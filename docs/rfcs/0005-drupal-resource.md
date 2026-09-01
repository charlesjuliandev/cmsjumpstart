# RFC 0005: Drupal Resource API

## Status

Accepted

## Summary

`DrupalResource` represents a Drupal JSON:API resource type and provides the primary fluent API for building and executing resource queries.

It sits between `DrupalClient` and the lower-level query, serialization, request, and response layers.

The resource API is responsible for:

- Representing a Drupal JSON:API resource type
- Providing a fluent query-building API
- Preserving the immutability of `DrupalQueryBuilder`
- Executing requests through `RequestExecutor`
- Returning typed `DrupalResourceResponse` instances
- Providing pagination helpers
- Providing JSON:API relationship access
- Resolving included resources
- Supporting strongly typed resource attributes and relationships
- Remaining framework agnostic

The resource API does not own HTTP transport, authentication, query serialization, schema discovery, or framework-specific behavior.

---

## Goals

The resource API is designed to provide a convenient abstraction over Drupal JSON:API while keeping the lower-level layers independent.

The primary goals are:

1. Provide a fluent API for querying a specific Drupal resource type.
2. Keep query construction separate from query serialization.
3. Execute requests through the shared `RequestExecutor`.
4. Return typed response objects instead of exposing raw responses as the primary API.
5. Support JSON:API relationships and included resources.
6. Support strongly typed resource attributes.
7. Provide framework-agnostic pagination helpers.
8. Preserve the underlying JSON:API response structure.
9. Allow framework integrations such as Next.js to wrap the resource API without duplicating its behavior.

---

## Non-Goals

`DrupalResource` does not:

- Perform HTTP requests directly
- Implement `fetch`
- Manage authentication headers
- Serialize query parameters directly
- Discover Drupal resource types
- Discover Drupal schemas
- Define aliases for Drupal resource types
- Flatten JSON:API responses
- Normalize relationships into application-specific objects
- Implement React behavior
- Implement Next.js behavior
- Define application-level caching policies
- Implement mutations
- Define Drupal-specific business logic

Those concerns belong to other layers.

---

## Resource Creation

Resources are created through `DrupalClient.resource()`.

Example:

```ts
const pages =
  client
    .resource("node--page")
    .fields(
      "title",
      "body"
    )
    .sort("-created")
    .limit(10)
    .get();
    ```

CMSJumpstart does not currently perform schema discovery or translate application-specific aliases into Drupal resource types.

For example:
```
client.resource("node--page");
```
represents the Drupal JSON:API resource type:
```
node--page
```

## Generic Types

DrupalResource supports four generic parameters:
```
DrupalResource<
  TAttributes,
  TRelationships,
  TIncludedAttributes,
  TRelationshipDefinitions
>
```

TAttributes

Defines the attributes available on resources returned by the query.

Example:
```
type PageAttributes =
  Record<string, unknown> & {
    title?: string;
    body?: {
      value?: string;
      summary?: string;
      processed?: string;
      format?: string;
    };
  };
  ```

TRelationships

Defines the relationships available on the resource.

TIncludedAttributes

Defines the attribute shape for resources returned through JSON:API included.

TRelationshipDefinitions

Defines relationship cardinality and related resource typing used by the response and resource-item layers.

The generic parameters are propagated through:
```
DrupalClient
    |
    v
DrupalResource
    |
    v
DrupalResourceResponse
    |
    v
DrupalResourceItem
```
This allows applications to retain type information throughout the response lifecycle.

## Fluent Query API

DrupalResource exposes the following fluent query methods:
```
include()
fields()
filter()
sort()
page()
limit()
```

Each method updates the resource's current query and returns the same DrupalResource instance.

Example:

```
const response =
  await client
    .resource("node--page")
    .include("field_image")
    .fields(
      "title",
      "body"
    )
    .filter(
      "status",
      true
    )
    .sort("-created")
    .page(1)
    .limit(10)
    .get();
```

## Include

include() specifies JSON:API relationships that should be included in the response.
```
resource.include(
  "field_image",
  "field_author"
);
```

Multiple relationships are supported.

The resource API passes include information to DrupalQueryBuilder, which is responsible for maintaining the query state.

## Sparse Fieldsets

fields() specifies the fields requested for the resource.

Example:
```
resource.fields(
  "title",
  "body"
);
```

This corresponds to Drupal JSON:API sparse fieldset behavior.

The resource layer does not serialize the resulting query parameter. Serialization remains the responsibility of DrupalQuerySerializer.

## Filtering

filter() supports equality, comparison, string, collection, range, and NULL operators.

The currently supported operators are:
```
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

## Equality
```
resource.filter(
  "status",
  true
);
```

## Comparison
```
resource.filter(
  "created",
  ">=",
  1700000000
);
```

## String filtering
```
resource.filter(
  "title",
  "CONTAINS",
  "Drupal"
);
```

## Collection filtering
```
resource.filter(
  "status",
  "IN",
  [1, 2, 3]
);
```

## Range filtering
```
resource.filter(
  "created",
  "BETWEEN",
  [
    1700000000,
    1800000000
  ]
);
```

## NULL filtering
```
resource.filter(
  "field_image",
  "IS NULL"
);
```

Validation and operator-specific rules are implemented by DrupalQueryBuilder.

DrupalResource does not duplicate that validation logic.

# Sorting
sort() accepts one or more sort fields.

Example:
```
resource.sort(
  "-created",
  "title"
);
```
A leading - indicates descending order.

Sorting behavior is passed to DrupalQueryBuilder and subsequently serialized by DrupalQuerySerializer.

# Pagination
page() and limit() configure pagination.

Example:
```
resource
  .page(1)
  .limit(10);
```

The current serializer calculates the page offset using:
```
offset = page * limit
```

Therefore:
```
.page(1)
.limit(10)
```

produces an offset of:
```
10
```

and:
```
.page(2)
.limit(10)
```

produces an offset of:
```
20
```

If page() is used without limit(), the serializer currently treats the limit as 0, resulting in an offset of 0.

Pagination links returned by Drupal JSON:API can also be followed through the response API.

# Query Inspection

getQuery() returns the current DrupalQueryBuilder

Example
```
const resource =
  client.resource("node--page");

resource
  .fields("title")
  .limit(10);

const query =
  resource.getQuery();
```

This provides access to the underlying query representation without exposing the serializer or request executor.

## Query Builder Immutability

DrupalQueryBuilder is immutable.

Each query operation returns a new builder.

DrupalResource maintains the current builder by replacing its internal reference.

Conceptually:
```
DrupalResource
      |
      v
current DrupalQueryBuilder
      |
      | include()
      | fields()
      | filter()
      | sort()
      | page()
      | limit()
      |
      v
new DrupalQueryBuilder
```

The resource itself is mutable in the sense that its current query reference changes, while the query builder objects themselves remain immutable.

This allows the fluent API:
```
resource
  .fields("title")
  .sort("-created")
  .limit(10);
```

without mutating previously created query-builder instances.

## Request Execution

get() is the execution boundary for a resource query.

The execution flow is:
```
DrupalResource
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

DrupalResource does not execute fetch directly.

Instead, it:

1. Retrieves the current query.
2. Serializes the query through DrupalQuerySerializer.
3. Builds the Drupal JSON:API endpoint.
4. Passes the request to RequestExecutor.
5. Wraps the raw response in DrupalResourceResponse.

Example:
```
const response =
  await client
    .resource("node--page")
    .fields(
      "title",
      "body"
    )
    .limit(10)
    .get();
```
The result is a:
```
DrupalResourceResponse
```
rather than a raw fetch() response.

## Endpoint Resolution

Drupal JSON:API resource types use the entity_type--bundle form.

For example:
```
node--page
```
The current DrupalResource converts the resource type into:
```
node/page
```

and requests:
```
/jsonapi/node/page
```
The conversion is performed internally by getEndpoint().

The resource API does not require callers to construct JSON:API URLs manually.

## DrupalResourceResponse

get() returns a DrupalResourceResponse.

The response layer provides access to the JSON:API response while retaining the original response structure.

The response exposes:
```
jsonapi
links
meta
included
data
length
```

It also provides:
```
getOne()
getAll()
next()
previous()
toJSON()
```

Example:
```
const response =
  await client
    .resource("node--page")
    .limit(10)
    .get();

const pages =
  response.getAll();
```

The response layer is responsible for wrapping individual resources as DrupalResourceItem instances.

## DrupalResourceItem

DrupalResourceItem represents an individual JSON:API resource object.

It exposes:
```
type
id
attributes
relationships
links
meta
```

It also provides relationship helpers and access to the underlying JSON:API resource through toJSON().

Example:
```
const page =
  response.getOne();

if (page) {
  console.log(
    page.id
  );

  console.log(
    page.attributes.title
  );
}
```

Resource attributes remain structured according to the JSON:API response.

CMSJumpstart does not flatten attributes or relationships automatically.

## Relationship Data

DrupalResource provides relationshipData() for accessing raw JSON:API relationship linkage.

It supports:
```
relationshipData(
  relationship
);
```
and:
```
relationshipData(
  response,
  relationship
);
```
The method returns the relationship's data value or null when relationship data is unavailable.

This preserves the distinction between:

- to-one relationships
- to-many relationships
- missing relationship data

Example:
```
const relationship =
  response.getOne()
    ?.relationships
    ?.field_author;

const linkage =
  resource.relationshipData(
    relationship
  );
```
Relationship linkage is not automatically resolved into included resources.

## Included Resource Resolution

JSON:API may return related resources in the response's included collection.

DrupalResource provides helpers for resolving these resources.

### To-One Relationships

getIncludedResource() resolves a single relationship against the response's included resources.

Example:
```
const author =
  resource.getIncludedResource(
    response.toJSON(),
    relationship
  );
```
The lookup matches both:
```
type
id
```
between the relationship linkage and the included resource.

If the relationship is missing, is to-many, or no matching included resource exists, the method returns:
```
null
```

## To-Many Relationships

getIncludedResources() resolves a to-many relationship.

Example:
``
const categories =
  resource.getIncludedResources(
    response.toJSON(),
    relationship
  );
```
The method returns all included resources whose:
``
type
id
```
match the relationship linkage.

If the relationship is missing, is not to-many, or no matches exist, the method returns:
```
[]
```

## Typed Relationship Helpers

When relationship names are available through TRelationships, the resource API provides typed helpers.

includedResource()

Resolves a typed to-one relationship by name.

Example:
```
const author =
  resource.includedResource(
    response.toJSON(),
    "field_author"
  );
includedResources()
```
Resolves a typed to-many relationship by name.

Example:
```
const categories =
  resource.includedResources(
    response.toJSON(),
    "field_categories"
  );
```
These methods use the first resource in the response when resolving the named relationship.

## Conservative Relationship Behavior

Relationship helpers intentionally avoid guessing when the response does not match the expected cardinality.

The current behavior is:

Situation	To-one	To-many
Relationship missing	null	[]
Relationship data missing	null	[]
No matching included resource	null	[]
Cardinality mismatch	null	[]

This makes relationship resolution predictable and prevents accidental interpretation of an incorrectly shaped response.

## Pagination Helpers

DrupalResource provides low-level pagination helpers:
```
next(response)
previous(response)
```
Both methods accept either:
```
DrupalResponse
```
or:
```
DrupalResourceResponse
```
Example:
```
const response =
  await resource.get();

const next =
  await resource.next(
    response
  );
```
When passed a DrupalResourceResponse, the resource converts it back to its underlying JSON:API response before delegating pagination to RequestExecutor.

The response-oriented API is generally more convenient:
```
const next =
  await response.next();
```
The resource-level methods remain available as low-level helpers.

## Pagination Response Flow

Pagination follows the JSON:API links returned by Drupal.

The flow is:
```
DrupalResourceResponse
        |
        v
RequestExecutor
        |
        v
JSON:API next/previous link
        |
        v
Drupal JSON:API
        |
        v
DrupalResponse
```
RequestExecutor is responsible for following the link and performing the request.

DrupalResource does not construct pagination URLs itself.

Raw Response Access

DrupalResourceResponse.toJSON() returns the underlying raw DrupalResponse.

Example:

const raw =
  response.toJSON();

This provides an escape hatch for callers that need direct access to the original JSON:API response structure.

The raw response is also used internally by the resource-level pagination and relationship helpers.

## Framework Integration

The resource API is intentionally framework agnostic.

For example, the Next.js integration provides:
```
NextCMSClient
      |
      v
DrupalClient
      |
      v
DrupalResource
```
NextCMSResource wraps DrupalResource rather than reimplementing Drupal query behavior.

This allows framework integrations to add framework-specific behavior while keeping Drupal JSON:API functionality in the Drupal package.

The current Next.js integration adds Next-specific request execution through NextRequestExecutor.

## Separation of Responsibilities

The resource layer is intentionally positioned between the client and lower-level infrastructure.
```
DrupalClient
      |
      v
DrupalResource
      |
      v
DrupalQueryBuilder
      |
      v
DrupalQuerySerializer
      |
      v
RequestExecutor
      |
      v
Drupal JSON:API
```
The response path is:
```
Drupal JSON:API
      |
      v
RequestExecutor
      |
      v
DrupalResourceResponse
      |
      v
DrupalResourceItem
```
Each layer has a distinct responsibility.

### DrupalClient

Owns:

- Client configuration
- Base URL
- Authentication configuration
- Default/custom headers
- Request configuration
- Request executor creation or injection
- Resource creation

### DrupalResource

Owns:

- Resource representation
- Fluent query API
- Query state
- Request execution coordination
- Pagination helpers
- Relationship helpers
- Included-resource resolution

### DrupalQueryBuilder

Owns:

- Query state
- Query validation
- Filter validation
- Immutable query operations

### DrupalQuerySerializer

Owns:

- Drupal JSON:API query parameter serialization
- URLSearchParams construction

### RequestExecutor

Owns:

- HTTP execution
- Request headers
- Authentication provider headers
- Timeout handling
- Error handling
- Request cache configuration
- Pagination link execution

### DrupalResourceResponse

Owns:

- Typed response representation
- Resource-item creation
- Response metadata
- Pagination response helpers
- Raw response access

### DrupalResourceItem

Owns:

- Individual resource representation
- Typed attributes
- Typed relationships
- Relationship linkage
- Included-resource resolution

### Testing

The resource API should be tested independently from the lower-level implementation details.

Current tests cover areas including:

- Resource creation
- Query chaining
- Sparse fieldsets
- Include parameters
- Comparison filters
- Collection filters
- Range filters
- NULL filters
- Sorting
- Pagination
- Query inspection
- Request execution
- Typed resource attributes
- Typed included resources
- Relationship linkage
- Missing relationships
- Empty to-many relationships
- Included-resource resolution
- Pagination helpers

Request execution tests use mocked executors rather than requiring a live Drupal server.

Relationship tests verify both positive and conservative fallback behavior.

### Design Principles

The resource API follows several design principles.

Fluent

Queries should read naturally:
```
await client
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

#### Typed

Types should flow from the resource declaration through the response and resource-item layers.

#### JSON:API-Aware

The resource API understands JSON:API concepts such as:

- resource types
- relationships
- relationship linkage
- included resources
- pagination links
#### Layered

Query construction, serialization, request execution, and response handling remain separate concerns.

#### Framework-Agnostic

The Drupal package should remain usable without React, Next.js, or another application framework.

#### Explicit

The current API favors explicit Drupal resource types and explicit query methods rather than hiding Drupal behavior behind implicit schema discovery or aliases.

## Future Considerations

The following capabilities may be considered in future RFCs or API revisions:

- findOne() convenience methods
- findMany() convenience methods
- Higher-level where() APIs
- Resource-specific convenience methods
- More advanced relationship traversal
- Response transformation utilities
- Mutation support
- count() and exists() helpers
- Streaming APIs
- Additional query composition features

These capabilities are not part of the current accepted implementation.

Any future convenience API should preserve the separation between the public resource API and the lower-level query, serialization, execution, and response layers.

## Decision

The current DrupalResource API is accepted as the framework-agnostic resource abstraction for CMSJumpstart.

The accepted API includes:
```
include()
fields()
filter()
sort()
page()
limit()
get()
next()
previous()
getQuery()
relationshipData()
getIncludedResource()
getIncludedResources()
includedResource()
includedResources()
```

DrupalResource will continue to delegate query construction to DrupalQueryBuilder, query serialization to DrupalQuerySerializer, HTTP execution to RequestExecutor, and response representation to DrupalResourceResponse and DrupalResourceItem.

The API remains intentionally explicit and framework agnostic.

Future higher-level convenience APIs may be introduced through separate design work without changing the responsibilities of the underlying layers.