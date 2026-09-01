# RFC 0002: Drupal Query Builder

## Status

Accepted

## Summary

Define the design and behavior of the Drupal JSON:API query builder used by CMSJumpstart.

The query builder provides a fluent, immutable API for constructing Drupal JSON:API query intent without requiring application code to manually manage query state.

The query builder is responsible for describing a query. Query serialization and HTTP request execution are handled by separate layers.

---

# Problem

Drupal JSON:API provides a flexible query system supporting functionality such as:

* Includes
* Sparse fieldsets
* Filtering
* Sorting
* Pagination

These capabilities are powerful but require developers to understand Drupal's query parameter conventions and URL syntax.

For example, a Drupal JSON:API filter can use the shorthand:

```text
filter[status]=true
```

while more complex conditions use a structure such as:

```text
filter[condition_0][condition][path]=title
filter[condition_0][condition][operator]=CONTAINS
filter[condition_0][condition][value]=Drupal
```

CMSJumpstart should provide a consistent TypeScript API for expressing these queries without requiring application code to manually construct the query string.

Drupal's JSON:API implementation supports a broad set of filter operators, including comparison, string, collection, range, and NULL operators.

---

# Goals

The query builder should:

* Provide a fluent API.
* Keep query construction type-safe.
* Produce predictable query state.
* Use immutable operations.
* Support Drupal JSON:API query capabilities required by CMSJumpstart.
* Be independently testable without making HTTP requests.
* Remain independent from authentication.
* Remain independent from HTTP request execution.
* Remain independent from query serialization.
* Allow additional query capabilities to be added without coupling the builder to networking or framework code.

---

# Non-Goals

The query builder does not:

* Execute HTTP requests.
* Handle authentication.
* Serialize query state into URL parameters.
* Manage response data.
* Manage caching.
* Discover Drupal schemas.
* Perform automatic resource-type mapping.
* Know about Next.js or other application frameworks.

Those responsibilities belong to other CMSJumpstart layers.

---

# Design Decisions

## Immutable Query State

The query builder uses immutable operations.

Each method returns a new `DrupalQueryBuilder` instance rather than modifying the existing builder.

For example:

```ts
const pages = client
  .resource("node--page");

const recentPages = pages
  .sort("-created");

const featuredPages = pages
  .filter("featured", true);
```

`pages`, `recentPages`, and `featuredPages` represent separate query states.

This allows a base query to be reused safely when constructing multiple variations.

The immutable behavior also makes the query builder easier to test and reason about.

---

# Fluent API

The current query builder supports the following operations:

```text
include()
fields()
filter()
sort()
page()
limit()
```

It also exposes query state through:

```text
getResourceType()
getOptions()
```

These methods allow the serializer and other internal layers to consume the builder state without coupling those layers to the builder's implementation details.

---

# Resource Type

A query builder is created with a Drupal JSON:API resource type.

Example:

```ts
const query =
  DrupalQueryBuilder.create(
    "node--page"
  );
```

The resource type is preserved as part of the query state.

The query builder does not attempt to discover or translate resource aliases.

Applications currently provide Drupal JSON:API resource types directly, such as:

```text
node--page
media--image
taxonomy_term--tags
```

Resource endpoint conversion is handled by the resource/request layer rather than by the query builder.

---

# Includes

The `include()` method adds one or more relationship paths to the query.

Example:

```ts
query.include(
  "field_image"
);
```

Multiple relationships can be supplied:

```ts
query.include(
  "field_image",
  "field_author"
);
```

The builder stores these values as an ordered collection.

Serialization into Drupal's `include` query parameter is handled by `DrupalQuerySerializer`.

Drupal JSON:API supports the `include` parameter for requesting related resources.

---

# Sparse Fieldsets

The `fields()` method specifies the fields requested for the resource.

Example:

```ts
query.fields(
  "title",
  "body"
);
```

The builder stores the requested fields without constructing the final query string.

Serialization is handled separately by `DrupalQuerySerializer`.

Drupal JSON:API supports sparse fieldsets for requesting only selected resource fields.

---

# Filtering

The `filter()` API supports equality filters, comparison filters, string filters, collection filters, range filters, and NULL filters.

## Equality Filters

The simplest form is:

```ts
query.filter(
  "status",
  true
);
```

This represents an equality condition.

The serializer can use Drupal's shorthand representation:

```text
filter[status]=true
```

---

## Comparison and String Filters

Filters may specify an operator and value.

Example:

```ts
query.filter(
  "title",
  "CONTAINS",
  "Drupal"
);
```

Another example:

```ts
query.filter(
  "field_date.value",
  ">=",
  "2026-08-13"
);
```

The query builder validates that the supplied operator is supported.

---

## Collection Filters

Collection operators require array values.

Supported collection operators include:

```text
IN
NOT IN
```

Example:

```ts
query.filter(
  "status",
  "IN",
  [1, 2, 3]
);
```

An empty array is rejected because it does not represent a meaningful collection filter.

---

## Range Filters

Range operators include:

```text
BETWEEN
NOT BETWEEN
```

These operators require exactly two values.

Example:

```ts
query.filter(
  "created",
  "BETWEEN",
  [
    "2026-01-01",
    "2026-12-31"
  ]
);
```

The builder validates that range filters contain exactly two values.

---

## NULL Filters

NULL filters are unary operators and therefore do not accept a value.

Example:

```ts
query.filter(
  "field_image",
  "IS NULL"
);
```

Or:

```ts
query.filter(
  "field_image",
  "IS NOT NULL"
);
```

The serializer omits the value parameter for these operators.

---

# Supported Filter Operators

The current implementation supports:

```text
=
<>
>
>=
<
<=
STARTS_WITH
CONTAINS
ENDS_WITH
IN
NOT IN
BETWEEN
NOT BETWEEN
IS NULL
IS NOT NULL
```

These operators correspond to the filter operator model supported by Drupal JSON:API.

The TypeScript type system exposes these operators through `DrupalFilterOperator`.

---

# Filter Value Types

Filter values currently support:

```ts
type DrupalFilterValue =
  | string
  | number
  | boolean
  | Array<
      string |
      number |
      boolean
    >;
```

The builder validates operator/value combinations.

Collection and range operators require arrays.

Scalar operators reject array values.

NULL operators do not accept values.

This validation occurs during query construction rather than waiting until HTTP request execution.

---

# Sorting

The `sort()` method accepts one or more Drupal sort expressions.

Example:

```ts
query.sort(
  "-created"
);
```

Multiple sort fields can be supplied:

```ts
query.sort(
  "-created",
  "title"
);
```

The query builder stores the requested sort expressions.

The serializer is responsible for converting them into the Drupal JSON:API `sort` parameter.

Drupal JSON:API supports ascending and descending sort expressions, with a leading `-` indicating descending order.

---

# Pagination

The query builder supports:

```text
page()
limit()
```

Example:

```ts
query
  .page(1)
  .limit(10);
```

The builder stores these values as query state.

The actual Drupal JSON:API pagination parameters are generated by `DrupalQuerySerializer`.

The current serializer calculates the offset as:

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

currently serializes to:

```text
page[offset]=10
page[limit]=10
```

This behavior is intentional as part of the current implementation and should be treated as the current API behavior.

Drupal JSON:API uses `page[limit]` and `page[offset]` for collection pagination.

---

# Separation From Serialization

The query builder does not know how its state is represented in a URL.

For example, the builder may represent:

```ts
query.filter(
  "title",
  "CONTAINS",
  "Drupal"
);
```

as structured query state.

It does not construct:

```text
filter[condition_0][condition][path]=title
filter[condition_0][condition][operator]=CONTAINS
filter[condition_0][condition][value]=Drupal
```

That responsibility belongs to `DrupalQuerySerializer`.

This separation keeps the query builder focused on developer-facing query composition.

---

# Separation From Request Execution

The query builder does not perform network requests.

The following responsibilities remain separate:

```text
DrupalQueryBuilder
        |
        | query intent
        v
DrupalQuerySerializer
        |
        | URL parameters
        v
RequestExecutor
        |
        | HTTP request
        v
Drupal JSON:API
```

This allows the query builder to be tested without requiring a Drupal server.

It also allows request execution to evolve independently from query construction.

---

# Relationship to DrupalResource

`DrupalResource` provides the developer-facing fluent resource API while using `DrupalQueryBuilder` internally.

For example:

```ts
const pages = await client
  .resource("node--page")
  .fields(
    "title",
    "body"
  )
  .filter(
    "status",
    true
  )
  .sort("-created")
  .limit(10)
  .get();
```

`DrupalResource` replaces its internal builder state with the new immutable builder returned by each operation.

Therefore:

* `DrupalQueryBuilder` remains immutable.
* `DrupalResource` maintains the current query for the resource instance.
* `DrupalQuerySerializer` converts that query into Drupal JSON:API parameters.
* `RequestExecutor` performs the request.

This provides a mutable-looking fluent resource API without making the underlying query builder mutable.

---

# Testing

The query builder should remain independently testable.

Tests should verify:

* Query creation.
* Resource type preservation.
* Include composition.
* Sparse fieldsets.
* Equality filters.
* Comparison filters.
* String operators.
* Collection filters.
* Range filters.
* NULL filters.
* Invalid operator handling.
* Invalid filter value handling.
* Sort composition.
* Pagination state.
* Immutability.

Tests should not require HTTP requests.

Serialization behavior belongs in separate `DrupalQuerySerializer` tests.

---

# Future Considerations

Potential future query-builder capabilities include:

* More expressive filter groups.
* Nested filter conditions.
* OR condition groups.
* Relationship-aware filtering helpers.
* Additional pagination abstractions.
* Query validation improvements.
* Query optimization diagnostics.

These features should only be added when they provide clear value and can be introduced without coupling the query builder to request execution or framework-specific behavior.

---

# Non-Goals for Future Abstraction

The query builder should not become responsible for:

* HTTP requests.
* Authentication.
* Response parsing.
* Caching strategies.
* Next.js-specific behavior.
* React behavior.
* Application state management.
* Drupal schema discovery.

Those concerns belong to other layers of CMSJumpstart.

---

# Decision

CMSJumpstart will use an immutable `DrupalQueryBuilder` as the query-intent layer for Drupal JSON:API operations.

The builder will provide a fluent API for:

* Includes
* Sparse fieldsets
* Filters
* Sorting
* Pagination

Filtering will support the currently implemented Drupal operator set:

```text
=
<>
>
>=
<
<=
STARTS_WITH
CONTAINS
ENDS_WITH
IN
NOT IN
BETWEEN
NOT BETWEEN
IS NULL
IS NOT NULL
```

Query construction, serialization, and HTTP execution will remain separate responsibilities.

This design provides a predictable, testable query API while preserving a clean architectural boundary between application code and Drupal JSON:API's URL-level query syntax.
