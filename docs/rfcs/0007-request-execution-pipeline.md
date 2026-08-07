# RFC 0007: Request Execution Pipeline

## Status

Proposed

## Authors

CMSJumpstart Team

## Summary

Define the architecture responsible for converting CMSJumpstart queries into HTTP requests and executing them against a CMS API.

The request execution layer should provide a flexible foundation for:

- Authentication
- Retries
- Caching
- Request logging
- Error handling
- Future CMS adapters

The initial implementation will target Drupal JSON:API.

---

# Motivation

CMSJumpstart needs to provide developers with a simple and predictable API for retrieving CMS content.

Developers should not need to understand:

- HTTP request construction
- JSON:API URL formatting
- Authentication headers
- Query serialization
- Network retry strategies

The public API should focus on developer intent.

Example:

```ts
const pages =
  await client
    .resource("page")
    .include("field_image")
    .limit(10)
    .findMany();
```

The complexity of turning that request into a network call should be handled internally.

---

# Design Goals

## 1. Separate Query Building From Execution

Queries should describe what data is needed.

They should not know how data is retrieved.

Example:

```text
DrupalQuery

- resource
- filters
- includes
- sorting
- pagination
```

is separate from:

```text
Request Execution

- URL construction
- headers
- authentication
- fetch
- retries
```

---

## 2. Keep Components Single Purpose

Each layer should have one responsibility.

---

# Architecture

```
Application
    |
    |
DrupalClient
    |
    |
DrupalResource
    |
    |
DrupalQuery
    |
    |
RequestExecutor
    |
    |
FetchAdapter
    |
    |
Drupal JSON:API
```

---

# Component Responsibilities

## DrupalClient

Responsible for:

- Client configuration
- Authentication configuration
- Creating resources
- Managing execution

Example:

```ts
const client =
  createDrupalClient({
    baseUrl,
    apiKey
  });
```

DrupalClient should not:

- Build query parameters
- Manage query state
- Format JSON:API URLs

---

## DrupalResource

Responsible for:

- Representing a CMS resource
- Providing developer-friendly methods

Example:

```ts
client.resource("page")
```

DrupalResource should not:

- Execute HTTP requests directly
- Manage authentication
- Serialize URLs

---

## DrupalQuery

Responsible for:

- Resource selection
- Filtering
- Includes
- Sorting
- Pagination
- Field selection

Example:

```ts
client
  .resource("page")
  .where("status", "=", true)
  .limit(10)
```

DrupalQuery should remain:

- Immutable
- Serializable
- Testable without network access

---

## RequestExecutor

Responsible for:

- Receiving a query
- Creating a request
- Executing the request
- Returning results

Future responsibilities may include:

- Retry handling
- Request timing
- Error normalization
- Middleware execution

---

## FetchAdapter

Responsible for:

- Abstracting the underlying HTTP implementation

The initial implementation will use:

```ts
fetch()
```

but should allow replacement for:

- Testing
- Node environments
- Alternative HTTP clients

---

# Future Middleware Support

The execution pipeline should allow middleware layers.

Example:

```
DrupalQuery
      |
      v
Retry Middleware
      |
      v
Cache Middleware
      |
      v
Logging Middleware
      |
      v
Fetch Adapter
```

Potential middleware:

- RetryMiddleware
- CacheMiddleware
- LoggingMiddleware
- PreviewMiddleware
- PerformanceMiddleware

---

# Authentication

Authentication should be configurable and independent from query execution.

Initial support:

- API key authentication
- Bearer token authentication

Future support:

- OAuth
- Session authentication
- Custom headers

Example:

```ts
createDrupalClient({
  auth: {
    type: "api-key",
    key: process.env.API_KEY
  }
});
```

---

# Error Handling

CMSJumpstart should provide normalized errors.

Developers should not need to parse raw HTTP errors.

Example:

```ts
try {
  await client
    .resource("page")
    .findMany();

} catch(error) {

  error.code;
  error.status;
  error.message;

}
```

Future error categories:

- AuthenticationError
- NotFoundError
- ValidationError
- NetworkError
- RateLimitError

---

# Non Goals

The first implementation will not include:

- Advanced caching
- Offline support
- Request batching
- GraphQL support
- Real-time updates

These features may be added after the core execution pipeline is stable.

---

# Open Questions

## 1. Should execution live on the query?

Possible API:

```ts
query.execute()
```

or:

```ts
client.execute(query)
```

Decision:

Deferred until implementation.

---

## 2. Should middleware be part of v1?

Decision:

No.

The architecture should allow middleware without requiring it initially.

---

## 3. Should networking become its own package?

Possible future structure:

```
packages/

core

drupal

network

next

cli
```

Decision:

Deferred until multiple CMS adapters require shared networking functionality.

---

# Success Criteria

The execution pipeline is successful when a developer can:

1. Configure CMSJumpstart.
2. Define a resource query.
3. Execute the query.
4. Receive typed CMS content.

without manually handling:

- HTTP requests
- Authentication headers
- JSON:API query syntax
- Response parsing