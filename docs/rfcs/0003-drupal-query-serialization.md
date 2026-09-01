# RFC 0003: Drupal Query Serialization

## Status

Accepted

## Summary

Define how CMSJumpstart converts `DrupalQueryBuilder` state into Drupal JSON:API query parameters.

The serializer is responsible for translating the structured query state produced by `DrupalQueryBuilder` into a `URLSearchParams` instance suitable for use by the request execution layer.

Query construction and query serialization remain separate responsibilities.

---

# Problem

Drupal JSON:API uses URL query parameters to represent collection operations such as:

* Includes
* Sparse fieldsets
* Filtering
* Sorting
* Pagination

For example:

```text
/jsonapi/node/page?include=field_image&page[limit]=10&sort=-created
```

More complex filters use nested condition parameters:

```text
filter[condition_0][condition][path]=title
filter[condition_0][condition][operator]=CONTAINS
filter[condition_0][condition][value]=Drupal
```

Manually constructing these parameters throughout an application is error-prone and couples application code to Drupal JSON:API's URL syntax.

CMSJumpstart therefore provides `DrupalQuerySerializer` as a dedicated translation layer.

---

# Goals

The serializer should:

* Convert `DrupalQueryBuilder` state into `URLSearchParams`.
* Produce predictable Drupal JSON:API query parameters.
* Handle Drupal-specific parameter naming.
* Support the query operations currently exposed by the builder.
* Encode array values consistently.
* Remain independent from HTTP request execution.
* Remain independently testable.
* Avoid mutating the query builder.

---

# Non-Goals

The serializer does not:

* Execute HTTP requests.
* Handle authentication.
* Manage request headers.
* Manage caching.
* Parse Drupal responses.
* Discover Drupal schemas.
* Build resource URLs.
* Implement query composition.

Those responsibilities belong to other CMSJumpstart layers.

---

# Decision

`DrupalQuerySerializer.serialize()` accepts a `DrupalQueryBuilder` and returns a `URLSearchParams` instance.

Example:

```ts
const query = DrupalQueryBuilder
  .create("node--page")
  .fields("title", "body")
  .sort("-created")
  .limit(10);

const params =
  DrupalQuerySerializer.serialize(
    query
  );
```

The serializer reads the builder's current options and converts each supported option into Drupal JSON:API query parameters.

The serializer does not modify the builder.

---

# Includes

The builder:

```ts
query.include(
  "field_image",
  "field_author"
);
```

serializes to:

```text
include=field_image,field_author
```

The serializer joins multiple include paths with commas.

The resulting parameter is:

```text
include
```

Drupal JSON:API uses `include` to request related resources in the same response.

---

# Sparse Fieldsets

The builder:

```ts
query.fields(
  "title",
  "body"
);
```

for the resource type:

```text
node--page
```

serializes to:

```text
fields[node--page]=title,body
```

The serializer uses the builder's resource type as the sparse-fieldset parameter key.

This allows field selection to remain associated with the specific JSON:API resource type.

Drupal JSON:API supports resource-specific sparse fieldsets through `fields[...]`.

---

# Sorting

The builder:

```ts
query.sort(
  "-created",
  "title"
);
```

serializes to:

```text
sort=-created,title
```

The serializer joins multiple sort expressions with commas.

The serializer does not interpret the meaning of individual sort expressions.

For example, it does not determine whether `-created` means descending order. It simply preserves the expression supplied by the query builder.

Drupal JSON:API uses a leading `-` to request descending sort order.

---

# Pagination

The serializer supports:

```text
page[offset]
page[limit]
```

## Limit

The builder:

```ts
query.limit(10);
```

serializes to:

```text
page[limit]=10
```

---

## Page and Limit

The current implementation calculates the offset as:

```text
offset = page × limit
```

when a limit is supplied.

Therefore:

```ts
query
  .page(1)
  .limit(10);
```

serializes to:

```text
page[offset]=10
page[limit]=10
```

This corresponds to requesting the second page of ten resources when using zero-based page indexing.

Drupal's JSON:API documentation demonstrates the same offset for the second page of ten resources:

```text
page[limit]=10&page[offset]=10
```

### Current Implementation Detail

The serializer does not convert the supplied page number into a one-based page number.

It directly multiplies:

```text
page × limit
```

Therefore the current behavior is:

| Builder              | Offset |
| -------------------- | -----: |
| `.page(0).limit(10)` |    `0` |
| `.page(1).limit(10)` |   `10` |
| `.page(2).limit(10)` |   `20` |
| `.page(3).limit(10)` |   `30` |

This behavior is part of the current implementation and should not be changed implicitly through documentation.

---

# Pagination Without a Limit

If `page()` is supplied without `limit()`, the current serializer uses:

```text
page[offset] = page × 0
```

because the serializer defaults the limit used in the calculation to `0`.

Therefore:

```ts
query.page(2);
```

currently produces:

```text
page[offset]=0
```

This is an implementation detail of the current serializer.

Applications should provide both `page()` and `limit()` when using page-based pagination.

---

# Equality Filters

Equality filters use Drupal's shorthand syntax.

The builder:

```ts
query.filter(
  "status",
  true
);
```

serializes to:

```text
filter[status]=true
```

The serializer recognizes the `=` operator and intentionally uses the shorter Drupal representation.

Drupal documents this key-value form as the shorthand for simple equality filters.

---

# Scalar Filter Values

Scalar values are converted to strings before being placed into `URLSearchParams`.

Supported scalar values are:

```text
string
number
boolean
```

Examples:

```ts
query.filter(
  "status",
  true
);
```

produces:

```text
filter[status]=true
```

```ts
query.filter(
  "weight",
  10
);
```

produces:

```text
filter[weight]=10
```

```ts
query.filter(
  "title",
  "Drupal"
);
```

produces:

```text
filter[title]=Drupal
```

---

# Array Filter Values

Array filter values are serialized using indexed query parameters.

For example:

```ts
query.filter(
  "status",
  "IN",
  [1, 2, 3]
);
```

produces:

```text
filter[condition_0][condition][path]=status
filter[condition_0][condition][operator]=IN
filter[condition_0][condition][value][1]=1
filter[condition_0][condition][value][2]=2
filter[condition_0][condition][value][3]=3
```

Array indexes begin at `1`.

The serializer deliberately uses explicit indexes rather than repeated empty array brackets.

This produces deterministic query parameters and aligns with Drupal's documented approach for array filter values.

---

# Non-Equality Filters

All operators other than `=` use Drupal JSON:API condition syntax.

For example:

```ts
query.filter(
  "title",
  "CONTAINS",
  "Drupal"
);
```

produces:

```text
filter[condition_0][condition][path]=title
filter[condition_0][condition][operator]=CONTAINS
filter[condition_0][condition][value]=Drupal
```

The condition structure contains:

```text
path
operator
value
```

Drupal's filter system models conditions using these same three primary components.

---

# Condition Indexing

The current serializer uses the filter's position in the builder's filter array as the condition index.

For example:

```ts
query
  .filter(
    "status",
    true
  )
  .filter(
    "title",
    "CONTAINS",
    "Drupal"
  );
```

produces:

```text
filter[status]=true

filter[condition_1][condition][path]=title
filter[condition_1][condition][operator]=CONTAINS
filter[condition_1][condition][value]=Drupal
```

The equality filter occupies index `0` in the internal filter collection, even though it does not use a condition structure.

Therefore condition indexes can contain gaps.

For example:

```ts
query
  .filter("status", true)
  .filter("title", "CONTAINS", "Drupal")
  .filter("created", ">=", 1000);
```

produces condition indexes:

```text
condition_1
condition_2
```

rather than:

```text
condition_0
condition_1
```

This behavior is intentional in the current implementation because the serializer uses the original filter array index.

---

# NULL Filters

The operators:

```text
IS NULL
IS NOT NULL
```

do not accept values.

For example:

```ts
query.filter(
  "field_image",
  "IS NULL"
);
```

serializes to:

```text
filter[condition_0][condition][path]=field_image
filter[condition_0][condition][operator]=IS NULL
```

No value parameter is generated.

Likewise:

```ts
query.filter(
  "field_image",
  "IS NOT NULL"
);
```

produces:

```text
filter[condition_0][condition][path]=field_image
filter[condition_0][condition][operator]=IS NOT NULL
```

Drupal documents `IS NULL` as a condition that does not require a value.

---

# Multiple Filters

The serializer processes filters in their stored order.

For example:

```ts
query
  .filter(
    "status",
    true
  )
  .filter(
    "title",
    "CONTAINS",
    "Drupal"
  )
  .filter(
    "created",
    ">=",
    1700000000
  );
```

produces a combination of shorthand and condition-based parameters:

```text
filter[status]=true

filter[condition_1][condition][path]=title
filter[condition_1][condition][operator]=CONTAINS
filter[condition_1][condition][value]=Drupal

filter[condition_2][condition][path]=created
filter[condition_2][condition][operator]=>=
filter[condition_2][condition][value]=1700000000
```

The serializer does not attempt to group, reorder, or optimize filters.

---

# URL Encoding

`DrupalQuerySerializer` returns `URLSearchParams` rather than a manually constructed string.

This delegates URL encoding to the platform's URL parameter implementation.

For example, operators containing characters such as:

```text
>=
<=
<>
```

are represented as parameter values and encoded appropriately when the resulting `URLSearchParams` is converted to a URL string.

The serializer therefore does not manually percent-encode operator values.

---

# Complete Query Example

Given:

```ts
const query =
  DrupalQueryBuilder
    .create("node--page")
    .include("field_image")
    .fields(
      "title",
      "body"
    )
    .filter(
      "status",
      true
    )
    .filter(
      "title",
      "CONTAINS",
      "Drupal"
    )
    .sort("-created")
    .page(1)
    .limit(10);
```

the serializer produces the equivalent parameter set:

```text
include=field_image
fields[node--page]=title,body
filter[status]=true
filter[condition_1][condition][path]=title
filter[condition_1][condition][operator]=CONTAINS
filter[condition_1][condition][value]=Drupal
sort=-created
page[offset]=10
page[limit]=10
```

The actual URL encoding of these parameters is handled by `URLSearchParams`.

---

# Serialization Order

The current serializer processes query options in this order:

1. Includes
2. Sparse fields
3. Sorting
4. Pagination offset
5. Pagination limit
6. Filters

This order affects the generated parameter insertion order but does not change the semantic meaning of the query.

The serializer does not attempt to sort or normalize query parameters alphabetically.

---

# Relationship to DrupalQueryBuilder

The responsibilities are intentionally separated.

`DrupalQueryBuilder` is responsible for:

* Fluent query composition.
* Query validation.
* Maintaining immutable query state.
* Storing resource type and query options.

`DrupalQuerySerializer` is responsible for:

* Drupal-specific query parameter names.
* URL parameter structure.
* Filter condition syntax.
* Array parameter indexing.
* Conversion to `URLSearchParams`.

This separation allows the builder to remain focused on query intent while the serializer handles Drupal's URL representation.

---

# Relationship to RequestExecutor

The serializer does not perform HTTP requests.

The request flow is:

```text
DrupalResource
      |
      v
DrupalQueryBuilder
      |
      v
DrupalQuerySerializer
      |
      v
URLSearchParams
      |
      v
RequestExecutor
      |
      v
Drupal JSON:API
```

`DrupalResource.get()` invokes the serializer and then passes the resulting parameters to the request executor.

This keeps query serialization independent from networking.

---

# Testing

Serializer tests should verify the exact generated parameters for:

* Includes.
* Sparse fieldsets.
* Sorting.
* Pagination.
* Equality filters.
* Scalar filters.
* Array filters.
* Comparison operators.
* String operators.
* Range operators.
* NULL operators.
* Multiple filters.
* Mixed equality and condition filters.
* Correct condition indexes.
* URL encoding.

Tests should compare the resulting `URLSearchParams` values rather than relying on an HTTP request.

---

# Future Considerations

Potential future serializer capabilities include:

* Nested filter groups.
* Explicit AND/OR condition groups.
* Relationship filter helpers.
* Additional query parameter types.
* Serializer validation diagnostics.
* Optional query normalization.

These should only be introduced when corresponding query-builder capabilities exist.

The serializer should not independently invent query features that cannot be expressed by `DrupalQueryBuilder`.

---

# Non-Goals

The serializer will not become responsible for:

* Authentication.
* HTTP requests.
* Retries.
* Caching.
* Response parsing.
* Relationship resolution.
* Drupal schema discovery.
* Framework-specific request options.

Those concerns belong to other layers.

---

# Decision

CMSJumpstart will use `DrupalQuerySerializer` as the dedicated translation layer between `DrupalQueryBuilder` state and Drupal JSON:API query parameters.

The serializer will:

* Return `URLSearchParams`.
* Serialize includes using `include`.
* Serialize sparse fieldsets using `fields[resourceType]`.
* Serialize sorting using `sort`.
* Serialize pagination using `page[offset]` and `page[limit]`.
* Serialize equality filters using Drupal's shorthand syntax.
* Serialize non-equality filters using Drupal condition syntax.
* Serialize array values using explicit one-based indexes.
* Omit values for `IS NULL` and `IS NOT NULL`.
* Preserve the current filter-array-based condition indexes.

Query construction, serialization, and request execution will remain separate architectural responsibilities.
