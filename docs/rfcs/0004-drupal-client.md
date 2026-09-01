# RFC 0004: Drupal Client

## Status

Accepted

## Summary

Define the responsibilities and public API of the CMSJumpstart Drupal client.

`DrupalClient` is the primary entry point for Drupal JSON:API functionality in `@cmsjumpstart/drupal`.

The client is responsible for configuring Drupal connectivity, constructing request execution infrastructure, applying authentication and custom headers, and creating typed Drupal resources.

The client remains framework-agnostic.

---

# Problem

Applications interacting with Drupal JSON:API need a consistent entry point for:

* Drupal API configuration
* Authentication
* Request headers
* Request execution
* Resource creation
* Typed resource APIs

Without a central client, applications would need to construct and configure these pieces independently.

CMSJumpstart should provide a single client that establishes the connection to Drupal while delegating query construction, serialization, resource behavior, and response handling to specialized layers.

---

# Goals

The Drupal client should:

* Provide a simple entry point for Drupal JSON:API access.
* Store the Drupal connection configuration.
* Configure request execution.
* Support common authentication methods.
* Support unrestricted custom headers.
* Provide Drupal resources through a typed API.
* Remain framework-agnostic.
* Allow a custom `RequestExecutor` to be injected.
* Provide the standard JSON:API `Accept` header automatically.
* Keep query construction separate from client configuration.
* Keep response handling separate from client configuration.

---

# Non-Goals

`DrupalClient` does not:

* Build query parameters directly.
* Serialize query state directly.
* Parse JSON:API responses.
* Resolve relationships directly.
* Implement application UI.
* Implement Next.js-specific behavior.
* Implement framework-specific caching semantics.
* Perform schema discovery.
* Define CMS-specific resource aliases.
* Own application state.

These responsibilities belong to other CMSJumpstart layers.

---

# Configuration

The client accepts a `DrupalClientConfig`.

The current configuration includes:

```ts
interface DrupalClientConfig {
  baseUrl: string;
  auth?: DrupalAuth;
  headers?: Record<string, string>;
  request?: DrupalRequestOptions;
}
```

The base URL identifies the Drupal installation used by the client.

Example:

```ts
const client =
  new DrupalClient({
    baseUrl:
      "https://cms.example.com"
  });
```

---

# Base URL

`baseUrl` is required.

It represents the root URL used when constructing Drupal API requests.

For example:

```text
https://cms.example.com
```

A resource request for:

```text
node--page
```

ultimately targets:

```text
/jsonapi/node/page
```

The conversion from Drupal's resource type notation to its endpoint path is handled by `DrupalResource`, while URL construction is handled by `RequestExecutor`.

---

# Default Headers

The client automatically includes:

```text
Accept: application/vnd.api+json
```

This identifies the expected Drupal JSON:API response format.

Drupal's JSON:API documentation uses the same `Accept` media type for JSON:API requests.

Application-provided headers may be supplied through the configuration:

```ts
const client =
  new DrupalClient({
    baseUrl:
      "https://cms.example.com",

    headers: {
      "X-Consumer-ID":
        "consumer-id",
      "api-key":
        "api-key"
    }
  });
```

Custom headers are merged with the default headers.

---

# Header Precedence

The client combines headers from multiple configuration sources.

The current implementation applies them in this order:

```text
Default headers
      ↓
config.headers
      ↓
config.request.headers
```

Later values override earlier values when the same header name is provided.

This allows applications to customize request headers without modifying the underlying request executor.

Authentication headers are then applied according to the configured authentication method.

---

# Authentication

Authentication is configured through the `DrupalAuth` union.

The currently supported authentication types are:

```text
none
api-key
bearer
basic
```

Authentication configuration is intentionally small and extensible through custom headers.

The goal is to support common authentication schemes without attempting to model every possible Drupal deployment architecture.

This decision is further defined by RFC 0008: Authentication Extensibility.

---

# No Authentication

Anonymous requests can explicitly use:

```ts
const client =
  new DrupalClient({
    baseUrl:
      "https://cms.example.com",

    auth: {
      type: "none"
    }
  });
```

Authentication headers are not added by the client when this mode is selected.

---

# API Key Authentication

The client supports an API key authentication configuration:

```ts
const client =
  new DrupalClient({
    baseUrl:
      "https://cms.example.com",

    auth: {
      type: "api-key",
      key: "secret-key"
    }
  });
```

By default, the key is placed in:

```text
Authorization
```

The header can be customized:

```ts
const client =
  new DrupalClient({
    baseUrl:
      "https://cms.example.com",

    auth: {
      type: "api-key",
      key: "secret-key",
      header: "api-key"
    }
  });
```

This allows the client to support APIs where the credential is expected in a non-standard header.

---

# Bearer Authentication

Bearer authentication is configured with:

```ts
const client =
  new DrupalClient({
    baseUrl:
      "https://cms.example.com",

    auth: {
      type: "bearer",
      token: "token-value"
    }
  });
```

The client produces:

```text
Authorization: Bearer token-value
```

The client does not negotiate or refresh bearer tokens.

Token acquisition and lifecycle management remain application responsibilities unless a future authentication implementation adds that capability.

---

# Basic Authentication

Basic authentication is configured with:

```ts
const client =
  new DrupalClient({
    baseUrl:
      "https://cms.example.com",

    auth: {
      type: "basic",
      username: "api-user",
      password: "secret"
    }
  });
```

The client encodes the credentials and produces:

```text
Authorization: Basic <encoded-credentials>
```

Drupal supports HTTP Basic Authentication for authenticated JSON:API requests.

Credentials should be supplied through secure application configuration such as environment variables rather than committed to source control.

---

# Custom Headers

Custom headers are a first-class part of the client configuration.

For example:

```ts
const client =
  new DrupalClient({
    baseUrl:
      "https://cms.example.com",

    headers: {
      "X-Consumer-ID":
        process.env.CONSUMER_ID ?? "",

      "api-key":
        process.env.API_KEY ?? ""
    }
  });
```

This is important because Drupal deployments frequently sit behind API gateways, reverse proxies, authentication services, or other infrastructure that requires headers beyond the standard Drupal authentication mechanisms.

CMSJumpstart intentionally does not attempt to create a separate configuration type for every possible gateway.

Instead, arbitrary headers can be supplied directly.

---

# Request Configuration

The client supports request-level configuration through:

```ts
interface DrupalRequestOptions {
  headers?: Record<string, string>;
  cache?: RequestCache;
}
```

This allows callers to configure:

* Additional request headers.
* Fetch cache behavior.

The request configuration is passed to the underlying request executor.

Framework-specific extensions can build on this configuration.

For example, the Next.js integration extends request options with Next.js-specific caching and revalidation behavior.

---

# Request Executor

`DrupalClient` delegates HTTP execution to `RequestExecutor`.

If an executor is not supplied to the constructor, the client creates one from the configured Drupal options.

Conceptually:

```text
DrupalClient
      |
      v
RequestExecutor
      |
      v
fetch()
      |
      v
Drupal JSON:API
```

This keeps networking concerns out of the client itself.

---

# Executor Injection

A `RequestExecutor` may be supplied to the client constructor.

Example:

```ts
const executor =
  new RequestExecutor({
    baseUrl:
      "https://cms.example.com"
  });

const client =
  new DrupalClient(
    {
      baseUrl:
        "https://cms.example.com"
    },
    executor
  );
```

This provides an extension point for framework-specific or application-specific request behavior.

The Next.js integration uses this capability to inject `NextRequestExecutor`.

---

# Framework Integration

The Drupal client is intentionally framework-agnostic.

Framework integrations should inject specialized request executors rather than modifying the Drupal client.

For example:

```text
NextCMSClient
      |
      v
NextRequestExecutor
      |
      v
DrupalClient
      |
      v
DrupalResource
```

`NextRequestExecutor` extends the base request executor with Next.js-specific request options such as:

* `revalidate`
* `tags`

This keeps Next.js behavior out of `@cmsjumpstart/drupal`.

---

# Resource Creation

The client exposes resources through:

```ts
client.resource(...)
```

Example:

```ts
const pages =
  client.resource(
    "node--page"
  );
```

The resource factory supports typed attributes, relationships, included attributes, and relationship definitions.

Example:

```ts
interface PageAttributes {
  title: string;
  body: string;
}

const pages =
  client.resource<
    PageAttributes
  >(
    "node--page"
  );
```

The resulting resource is responsible for query composition and request execution.

---

# Resource Types

The current API accepts Drupal JSON:API resource types directly.

For example:

```text
node--page
media--image
taxonomy_term--tags
```

The client does not perform schema discovery or automatically translate application-specific aliases into Drupal resource types.

This keeps resource configuration explicit and predictable.

Higher-level resource aliases may be considered in the future, but they are not part of the current API.

---

# Query Responsibility

The client does not construct query parameters itself.

The responsibility chain is:

```text
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
```

The client establishes the Drupal connection and execution infrastructure.

The resource and query layers determine what data should be requested.

---

# Response Responsibility

The client does not directly parse Drupal JSON:API responses.

The response flow is:

```text
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

This separation allows response handling to evolve independently from connection configuration.

---

# Client and Request Lifecycle

A typical request follows this lifecycle:

```text
1. Application creates DrupalClient
        |
        v
2. Client configures/injects RequestExecutor
        |
        v
3. Application creates DrupalResource
        |
        v
4. Resource builds query state
        |
        v
5. DrupalQuerySerializer creates URL parameters
        |
        v
6. RequestExecutor performs HTTP GET
        |
        v
7. Drupal JSON:API returns response
        |
        v
8. DrupalResourceResponse wraps response
```

This keeps each stage independently testable.

---

# Error Handling

The client does not normalize all request errors into a separate domain-specific error hierarchy.

HTTP-level errors are handled by `RequestExecutor`.

The current request executor reports unsuccessful HTTP responses with an error containing:

* HTTP status.
* HTTP status text.
* Response body when available.
* Request URL.

Timeouts are also converted into an explicit timeout error.

The client itself remains responsible for configuration and resource creation rather than becoming a general-purpose error-processing layer.

---

# Testing

`DrupalClient` should be tested independently of a real Drupal installation.

Tests should verify:

* Base URL configuration.
* Default JSON:API `Accept` header.
* Custom headers.
* Request-specific headers.
* API key authentication.
* Bearer authentication.
* Basic authentication.
* Disabled authentication.
* Custom authentication header names.
* Request executor creation.
* Injected request executors.
* Resource creation.
* Generic type propagation.

HTTP execution behavior belongs primarily in `RequestExecutor` tests.

Query behavior belongs in `DrupalQueryBuilder` and `DrupalQuerySerializer` tests.

Response behavior belongs in response-layer tests.

---

# Security Considerations

Authentication credentials should never be hard-coded into application source.

Applications should provide sensitive values through secure environment or secret-management systems.

For example:

```ts
const client =
  new DrupalClient({
    baseUrl:
      process.env.DRUPAL_BASE_URL ?? "",

    auth: {
      type: "basic",
      username:
        process.env.HTAUTH_U ?? "",
      password:
        process.env.HTAUTH_P ?? ""
    },

    headers: {
      "X-Consumer-ID":
        process.env.CONSUMERUUID ?? "",
      "api-key":
        process.env.UP_API_KEY ?? ""
    }
  });
```

When used from a framework such as Next.js, applications must ensure that server-only credentials are not exposed to browser bundles.

---

# Relationship to RFC 0008

RFC 0008 defines the authentication extensibility strategy for CMSJumpstart.

The client follows that strategy by providing common authentication mechanisms while preserving arbitrary custom headers.

The client should not grow a separate authentication abstraction for every Drupal hosting environment or API gateway.

When a deployment requires a custom authentication mechanism, custom headers or a custom request executor should be preferred before introducing another built-in authentication type.

---

# Future Considerations

Potential future client capabilities include:

* Additional authentication providers.
* Authentication provider injection directly into client configuration.
* Request middleware.
* Retry policies.
* Request instrumentation.
* Request logging.
* Additional HTTP methods.
* Client-level request hooks.

These features should only be added when there is a concrete use case and should not cause the client to absorb responsibilities belonging to other layers.

---

# Non-Goals

The client will not become responsible for:

* React components.
* Next.js APIs.
* UI state.
* Drupal schema discovery.
* Automatic resource aliases.
* Query serialization.
* Response normalization beyond the existing response abstractions.
* Application-specific caching policies.
* Application-specific authentication flows.

---

# Decision

`DrupalClient` is the primary framework-agnostic entry point for CMSJumpstart's Drupal integration.

It is responsible for:

* Drupal connection configuration.
* Base URL configuration.
* Default JSON:API headers.
* Authentication configuration.
* Custom headers.
* Request configuration.
* Request executor creation or injection.
* Typed Drupal resource creation.

Query construction, serialization, HTTP execution, and response handling remain separate responsibilities.

The client will support common authentication methods while preserving unrestricted custom-header support, consistent with RFC 0008.

This architecture allows `@cmsjumpstart/drupal` to provide a reusable Drupal integration while allowing framework packages such as `@cmsjumpstart/next` to add framework-specific behavior without duplicating Drupal functionality.
