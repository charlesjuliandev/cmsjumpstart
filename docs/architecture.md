# CMSJumpstart Architecture

## Goal

CMSJumpstart provides production-ready tooling for building modern applications with headless CMS platforms.

The current implementation focuses on Drupal JSON:API with a framework-agnostic Drupal client and a Next.js integration.

The architecture is intentionally layered so that Drupal-specific behavior, query construction, request execution, response handling, and framework-specific behavior remain separate.

---

## Current Packages

### @cmsjumpstart/core

Shared CMSJumpstart foundation.

Current responsibilities include:

- Shared configuration primitives
- Core package infrastructure

The core package is intentionally framework agnostic.

Additional shared functionality may be introduced as the project grows.

---

### @cmsjumpstart/drupal

Drupal-specific functionality.

Current responsibilities include:

- Drupal JSON:API client
- Resource types
- Query building
- Query serialization
- Request execution
- Authentication configuration
- Response handling
- Typed resource responses
- Typed resource items
- Relationship access
- Included-resource resolution
- Pagination

The Drupal package is framework agnostic and does not depend on React, Next.js, or another application framework.

---

### @cmsjumpstart/next

Next.js integration for CMSJumpstart.

Current responsibilities include:

- `NextCMSClient`
- `NextCMSResource`
- `NextRequestExecutor`
- Next.js-specific request options
- Next.js fetch caching and revalidation options

The Next.js package is intentionally thin.

Drupal query and response behavior remains implemented by `@cmsjumpstart/drupal`.

---

### @cmsjumpstart/ui

Planned accessible UI package.

Future responsibilities may include:

- Layout components
- Navigation
- Content components
- Accessible interaction patterns
- WCAG-oriented UI primitives

This package is not currently part of the implemented runtime architecture.

---

### CLI

A CMSJumpstart CLI is planned.

The eventual CLI may provide project scaffolding and configuration for applications using CMSJumpstart.

The CLI is not currently part of the implemented runtime architecture.

---

## Package Architecture

The current runtime relationship is:

```
Next.js Application
        |
        v
@cmsjumpstart/next
        |
        +----------------------+
        |                      |
        v                      v
NextCMSClient          NextRequestExecutor
        |                      |
        v                      |
NextCMSResource               |
        |                      |
        +----------+-----------+
                   |
                   v
          @cmsjumpstart/drupal
                   |
                   v
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
The Next.js request executor extends the framework-agnostic RequestExecutor and is injected into DrupalClient.

This allows the Drupal package to remain independent of Next.js while the Next.js package can add framework-specific request behavior.

## Drupal Request Flow

A typical request follows this path:
```
Application
    |
    v
NextCMSClient
    |
    v
NextCMSResource
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
The query is built first and serialized only when the request is executed.

For example:
```
const response =
  await cms
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
The responsibilities are intentionally separated:

1. NextCMSResource provides the Next.js-facing resource API.
2. DrupalResource manages the resource query and execution boundary.
3. DrupalQueryBuilder maintains and validates query state.
4. DrupalQuerySerializer converts the query into URL parameters.
5. RequestExecutor performs the HTTP request.
6. Drupal JSON:API returns the response.
7. DrupalResourceResponse wraps the response.
8. DrupalResourceItem represents individual resources.

## Drupal Resource Types

CMSJumpstart uses Drupal JSON:API resource types directly.

For example:
```
node--page
```
represents the Drupal JSON:API resource type for the page content type.

The Drupal JSON:API URL corresponding to that resource type is:
```
/jsonapi/node/page
```
Drupal JSON:API derives resource types from the entity type and bundle and exposes them through predictable /jsonapi/{entity_type}/{bundle} paths.

CMSJumpstart does not currently introduce an additional resource-alias or schema-discovery layer.

## Query Architecture

Query construction and query serialization are separate responsibilities.
```
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
```
### DrupalQueryBuilder

Responsible for:

- Query state
- Include fields
- Sparse fieldsets
- Filters
- Sorting
- Pagination
- Filter validation

The query builder is immutable.

Each operation returns a new query builder.

### DrupalQuerySerializer

Responsible for converting the query builder into URLSearchParams.

It handles Drupal JSON:API query parameter formats such as:
```
include
fields[resource]
filter
sort
page[offset]
page[limit]
```

The serializer does not perform HTTP requests.

#### DrupalResource

DrupalResource maintains the current query builder and exposes the fluent public API:
```
include()
fields()
filter()
sort()
page()
limit()
get()
```
The resource itself coordinates execution but delegates the individual concerns to the appropriate lower-level layers.

## Request Execution Architecture

The request execution layer is framework agnostic.
```
RequestExecutor
      |
      v
fetch()
      |
      v
Drupal JSON:API
```
RequestExecutor currently provides:

- Base URL handling
- Default JSON:API Accept header
- Custom headers
- Authentication provider support
- Request timeout handling
- AbortController support
- Request cache configuration
- HTTP error handling
- Pagination-link requests

The executor is currently GET-oriented.

There is no separate FetchAdapter abstraction in the current implementation.

## Next.js Request Execution

The Next.js integration extends the base request executor:
``
RequestExecutor
      |
      v
NextRequestExecutor
``
NextRequestExecutor adds Next.js-specific fetch options:
``
interface NextRequestOptions {
  revalidate?: number | false;
  tags?: string[];
}
```
These values are translated into the Next.js fetch() request:
```
{
  next: {
    revalidate,
    tags
  }
}
```
This keeps Next.js behavior out of the framework-agnostic Drupal package.

## Client Architecture

DrupalClient is the primary framework-agnostic entry point for Drupal JSON:API.

It is responsible for:

- Drupal base URL
- Authentication configuration
- Default headers
- Custom headers
- Request configuration
- Request executor creation or injection
- Resource creation

Example:
```
const client =
  new DrupalClient({
    baseUrl:
      process.env.DRUPAL_BASE_URL!,
    auth: {
      type: "basic",
      username:
        process.env.HTAUTH_U!,
      password:
        process.env.HTAUTH_P!
    },
    headers: {
      "X-Consumer-ID":
        process.env.CONSUMERUUID!,
      "api-key":
        process.env.UP_API_KEY!
    }
  });
```

Custom headers remain unrestricted so CMSJumpstart can support Drupal installations behind gateways, API management systems, or other infrastructure requiring additional request headers.

### NextCMSClient

NextCMSClient provides the Next.js-facing client.

Its primary responsibilities are:

- Accepting NextCMSConfig
- Creating a NextRequestExecutor
- Injecting the executor into DrupalClient
- Creating NextCMSResource wrappers
- Exposing Drupal client headers when needed

The Next client does not duplicate Drupal query-building or response-handling logic.

Conceptually:
```
NextCMSClient
      |
      v
DrupalClient
      |
      v
DrupalResource
```
This keeps the Next.js integration thin and minimizes framework-specific duplication.

## Resource Response Architecture

The response path is:
```
Drupal JSON:API
      |
      v
RequestExecutor
      |
      v
DrupalResponse
      |
      v
DrupalResourceResponse
      |
      v
DrupalResourceItem
```
### DrupalResourceResponse

Represents the complete JSON:API response.

It provides access to:

- jsonapi
- links
- meta
- included
- data
- length

It also provides:
```
getOne()
getAll()
next()
previous()
toJSON()
```

## DrupalResourceItem

Represents an individual JSON:API resource object.

It provides access to:

- type
- id
- attributes
- relationships
- links
- meta

It also provides relationship and included-resource helpers.

CMSJumpstart preserves the JSON:API response structure rather than flattening relationships into attributes.

JSON:API represents relationships through resource identifier objects and uses the included member for compound documents

## Relationship Architecture

Relationship data remains explicitly represented.
```
DrupalResourceItem
        |
        v
relationships
        |
        +------------------+
        |                  |
        v                  v
resource linkage      included
(type + id)           resources
```
For example:
```
const author =
  page.includedResource(
    "field_author"
  );
```
CMSJumpstart resolves the relationship linkage against the response's included resources using the resource type and id.

This matches the JSON:API model in which relationship linkage provides the identifiers used to correlate related resources with resources in the included collection.

## Include Architecture

The include() query method maps directly to JSON:API's include functionality.

Example:
```
const response =
  await client
    .resource("node--article")
    .include(
      "field_comments",
      "field_author"
    )
    .get();
```
The Drupal JSON:API implementation supports relationship paths through the include query parameter and returns the related resources in the response's included member.

CMSJumpstart preserves those relationships rather than flattening them.

## Pagination Architecture

Pagination is handled through JSON:API links.

The response layer exposes:
```
response.next();
response.previous();
```
The lower-level resource API also provides:
```
resource.next(
  response
);

resource.previous(
  response
);
```
The request executor follows the links returned by Drupal JSON:API.

Conceptually:
```
DrupalResourceResponse
        |
        v
JSON:API links.next / links.prev
        |
        v
RequestExecutor
        |
        v
Drupal JSON:API
```
This keeps pagination URL handling inside the request-execution layer instead of requiring application code to construct URLs manually.

## Authentication Architecture

Authentication is configured through DrupalClientConfig.

Supported built-in authentication modes currently include:
```
none
api-key
bearer
basic
```
The client also supports arbitrary custom headers.

This allows deployments that use combinations such as:
```
Authorization: Basic ...
X-Consumer-ID: ...
api-key: ...
```
without requiring CMSJumpstart to model every possible Drupal authentication or API-gateway configuration.

The lower-level RequestExecutor also supports an AuthProvider abstraction for extensibility.

Authentication remains separate from query construction and response handling.

## Error Handling

HTTP request errors are handled by RequestExecutor.

The executor currently provides:

- HTTP status information
- HTTP status text
- Response body information when available
- Request URL information
- Timeout errors
- Abort handling

The resource and query layers do not implement HTTP error handling.

This keeps transport concerns centralized in the request-execution layer.

## Caching and Request Configuration

Request configuration is passed through the client and executor layers.

The framework-agnostic request layer supports the standard fetch cache configuration.

The Next.js request executor additionally supports:
```
revalidate
tags
```
for Next.js-specific caching and revalidation behavior.

Caching behavior therefore follows the same layering principle as request execution:
```
Application
    |
    v
NextCMSClient
    |
    v
NextRequestExecutor
    |
    v
Next.js fetch()
```
while the Drupal package remains framework agnostic.

## Type Flow

CMSJumpstart preserves resource typing across the client, resource, response, and item layers.
```
Application Type
       |
       v
DrupalClient.resource<TAttributes>()
       |
       v
DrupalResource<TAttributes>
       |
       v
DrupalResourceResponse<TAttributes>
       |
       v
DrupalResourceItem<TAttributes>
```
Relationship and included-resource types can also be propagated through the generic parameters.

This allows application code to work with typed Drupal data without requiring a separate response transformation layer.

## Package Boundaries

The current package boundaries are:
```
@cmsjumpstart/core
        |
        | shared foundation
        |
        v

@cmsjumpstart/drupal
        |
        | Drupal JSON:API
        |
        v

@cmsjumpstart/next
        |
        | Next.js integration
        |
        v

Next.js Application
```
The dependency direction is intentional.

@cmsjumpstart/drupal does not depend on @cmsjumpstart/next.

Instead:
```
@cmsjumpstart/next
        |
        v
@cmsjumpstart/drupal
```
This allows the Drupal package to be used independently by other frameworks or applications.

## Current Architecture Principles
#### Separation of Concerns

Each layer owns a specific responsibility.

#### Framework Independence

Drupal functionality remains independent of Next.js and React.

#### Thin Integrations

Framework packages should wrap or extend the core Drupal functionality rather than duplicate it.

#### Explicit APIs

The current implementation favors explicit Drupal resource types and query methods.

#### Typed Responses

Types should flow from resource definitions through response objects.

#### JSON:API Preservation

CMSJumpstart should preserve important JSON:API concepts rather than flattening or hiding them unnecessarily.

#### Extensibility

Authentication, request execution, and framework integrations should remain extensible without coupling the Drupal core implementation to a specific deployment environment.

## Current vs. Planned Architecture
### Current

Implemented today:

- @cmsjumpstart/core
- @cmsjumpstart/drupal
- @cmsjumpstart/next
- DrupalClient
- DrupalResource
- DrupalQueryBuilder
- DrupalQuerySerializer
- RequestExecutor
- NextRequestExecutor
- DrupalResourceResponse
- DrupalResourceItem
- Drupal JSON:API authentication configuration
- Relationship handling
- Included-resource resolution
- Pagination
- Next.js request caching/revalidation options

### Planned

Future packages and capabilities may include:

- @cmsjumpstart/ui
- CMSJumpstart CLI
- Additional CMS integrations
- Higher-level resource convenience APIs
- Mutations
- Additional request middleware
- Additional response transformations
- Additional framework integrations

Planned capabilities should be introduced through separate RFCs and should not be treated as part of the current runtime contract until implemented and accepted.

## Architecture Summary

CMSJumpstart currently follows a layered architecture:
```
                    Next.js Application
                            |
                            v
                  @cmsjumpstart/next
                            |
              +-------------+-------------+
              |                           |
              v                           v
        NextCMSClient            NextRequestExecutor
              |                           |
              v                           |
        NextCMSResource                   |
              |                           |
              +-------------+-------------+
                            |
                            v
                  @cmsjumpstart/drupal
                            |
                            v
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
The response path travels back through the execution and response layers:
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
       |
       v
Application
```
This architecture keeps query construction, query serialization, request execution, authentication, response handling, relationship resolution, and framework-specific behavior independently testable and replaceable.