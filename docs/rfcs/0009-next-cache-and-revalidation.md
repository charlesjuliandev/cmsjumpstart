# RFC 0009: Next.js Cache and Revalidation

## Status

Proposed

## Decision

CMSJumpstart will provide Next.js-specific caching and revalidation capabilities through `@cmsjumpstart/next` while keeping the Drupal package framework-agnostic.

The Next.js integration will use Next.js's native caching and revalidation mechanisms rather than implementing an independent cache.

CMS-specific resource identity will be used to provide predictable cache tags, while applications may provide explicit custom tags when necessary.

The Drupal package will remain unaware of Next.js caching APIs such as `revalidateTag` and `revalidatePath`.

## Context

CMSJumpstart is designed to provide a thin integration layer between Next.js applications and headless CMS platforms.

The current request pipeline is:

```text
Next.js Application
        |
        v
@cmsjumpstart/next
        |
        v
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
        |
        v
RequestExecutor
        |
        v
Drupal JSON:API
```

The Next.js request executor already supports Next.js-specific request options including:

* `revalidate`
* `tags`

This allows applications to participate in Next.js's server-side caching behavior without changing the framework-agnostic Drupal request layer.

However, the current API does not define how CMS resources should be associated with cache tags or how an application should invalidate CMS content after changes.

Next.js provides native cache invalidation APIs including `revalidateTag` and `revalidatePath`. CMSJumpstart should build on those APIs rather than introduce a separate cache implementation.

Next.js also supports server-side data fetching and revalidation as part of its App Router architecture.

## Goals

This RFC establishes a predictable caching and revalidation model for CMSJumpstart's Next.js integration.

The goals are:

* Preserve the framework-agnostic design of `@cmsjumpstart/drupal`.
* Provide first-class Next.js cache integration.
* Allow CMS resources to participate in Next.js cache invalidation.
* Provide predictable cache tag generation.
* Allow applications to provide custom cache tags.
* Support webhook-driven cache invalidation in a later phase.
* Avoid forcing applications to manually understand the internal Drupal request pipeline.
* Keep the API small and composable.
* Allow the implementation to evolve with Next.js caching APIs.

## Non-Goals

This RFC does not define:

* Drupal webhook implementation.
* Draft or preview content.
* Authentication for preview mode.
* A CMS-specific webhook protocol.
* A replacement for Next.js's cache.
* Client-side caching libraries.
* A persistent CMSJumpstart cache.
* CDN cache configuration.
* Automatic route discovery.
* Automatic invalidation of every application route.

Preview and webhook behavior will be addressed by subsequent implementation work.

## Cache Ownership

Next.js owns the application cache.

CMSJumpstart does not implement or maintain a separate cache layer.

The responsibility is divided as follows:

```text
CMSJumpstart
    |
    | defines resource identity
    | provides cache tags
    | configures Next.js fetch behavior
    v
Next.js
    |
    | stores cached responses
    | manages cache lifetime
    | performs invalidation
    v
Application
```

This keeps CMSJumpstart focused on integrating CMS data access with Next.js rather than becoming a caching system itself.

## Request-Level Caching

The existing `NextRequestOptions` API will remain the primary mechanism for configuring request-level caching behavior.

The current shape is:

```ts
interface NextRequestOptions {
  revalidate?: number | false;
  tags?: string[];
}
```

For example:

```ts
const cms = createNextCMS({
  drupal: {
    baseUrl: process.env.DRUPAL_BASE_URL!
  },

  request: {
    revalidate: 300,
    tags: ["pages"]
  }
});
```

The exact configuration flow between `NextCMSConfig` and `NextRequestExecutor` will be reviewed during implementation to ensure the public configuration matches the documented API.

## Cache Tags

Cache tags provide a stable mechanism for associating CMS requests with content that may later need to be invalidated.

CMSJumpstart will distinguish between:

1. Resource-derived tags.
2. Application-defined tags.

### Resource-Derived Tags

A resource identity may be represented using the Drupal JSON:API resource type.

For example:

```text
node--page
```

could produce a resource-type tag such as:

```text
cmsjumpstart:drupal:node--page
```

A specific resource may additionally produce an identity tag:

```text
cmsjumpstart:drupal:node--page:123
```

This allows applications to invalidate:

* all pages of a resource type, or
* one specific resource.

The exact tag format is intentionally centralized in the Next.js package so that it can evolve without exposing implementation details through the Drupal package.

### Application-Defined Tags

Applications may define additional tags for higher-level concepts.

For example:

```ts
tags: [
  "navigation",
  "homepage",
  "featured-content"
]
```

CMSJumpstart will not attempt to infer arbitrary application-level relationships.

Applications remain responsible for defining domain-specific tags when resource identity alone is insufficient.

## Tag Naming

CMSJumpstart-generated tags will use a namespace to avoid collisions with application-defined tags.

The initial convention is:

```text
cmsjumpstart:<provider>:<resource>
```

and:

```text
cmsjumpstart:<provider>:<resource>:<id>
```

For Drupal:

```text
cmsjumpstart:drupal:node--page
cmsjumpstart:drupal:node--page:123
```

The exact formatting may be revised during implementation if Next.js or CMS requirements indicate a better convention.

The tag format must remain:

* deterministic
* stable
* URL-safe
* easy to inspect during debugging
* independent of request URLs

## Resource Identity

Resource identity will be based on CMS resource type and, when available, resource ID.

For example:

```text
resource type: node--page
resource id: 123
```

produces:

```text
cmsjumpstart:drupal:node--page
cmsjumpstart:drupal:node--page:123
```

Relationships and included resources do not automatically create independent invalidation tags unless they are independently fetched or explicitly represented by the application.

This prevents a single response containing many included resources from unexpectedly generating a large and difficult-to-manage invalidation graph.

## Revalidation

CMSJumpstart will expose Next.js revalidation through the `@cmsjumpstart/next` package rather than the Drupal package.

The integration will use Next.js's native revalidation mechanisms.

Next.js provides `revalidateTag` for invalidating cached data associated with a tag and `revalidatePath` for invalidating a route path.

CMSJumpstart should prefer **tag-based invalidation for CMS content** because resource identity maps naturally to content changes.

Path-based invalidation should remain an application-level concern.

For example:

```text
Drupal page 123 changes
        |
        v
cmsjumpstart:drupal:node--page:123
        |
        v
revalidateTag(...)
```

The application can separately determine whether a route also needs invalidation.

## Why Tags Are Preferred

CMS content and application routes are not always one-to-one.

A single Drupal resource may appear on:

* a detail page
* a homepage
* a listing page
* a search page
* a related-content component
* multiple localized routes

Invalidating a route directly would require CMSJumpstart to understand application routing.

Tags allow the CMS layer to identify the changed content without knowing where that content is rendered.

Therefore:

```text
CMS content identity
        |
        v
      Tag
        |
        v
Next.js cached data
```

is preferred over:

```text
CMS content identity
        |
        v
Application route
```

## Revalidation API

The public revalidation API should remain small.

The implementation should provide functionality equivalent to:

```ts
revalidateResource(
  resourceType,
  resourceId?
)
```

which resolves to the appropriate CMSJumpstart cache tag.

For example:

```ts
revalidateResource("node--page");
```

invalidates the resource-type tag.

```ts
revalidateResource("node--page", "123");
```

invalidates the specific resource tag.

The exact exported API name is intentionally left open until implementation begins.

The implementation must use Next.js's native cache APIs internally rather than maintaining its own cache.

## Route Revalidation

CMSJumpstart will not automatically map Drupal resources to Next.js routes.

For applications that need route invalidation, the application may explicitly call Next.js's `revalidatePath`.

For example:

```ts
revalidatePath("/news");
revalidatePath("/news/example-article");
```

CMSJumpstart may provide helper functions around route revalidation in the future, but route-to-content mapping is considered application-specific and is not part of this RFC.

## Webhook Integration

Webhook-triggered revalidation will be implemented as a separate layer on top of this caching model.

The intended flow is:

```text
Drupal
   |
   | content published
   v
Webhook
   |
   v
Next.js Route Handler
   |
   v
Validate webhook
   |
   v
Determine resource identity
   |
   v
CMSJumpstart revalidation
   |
   v
Next.js cache invalidation
```

The webhook layer will be responsible for:

* authenticating the webhook request
* validating the request payload
* determining the affected resource
* generating the appropriate resource tag
* triggering Next.js revalidation

Webhook support must not require changes to the framework-agnostic Drupal request layer.

## Security

Cache invalidation endpoints must not be publicly executable without authorization.

A future webhook implementation must provide a mechanism such as:

* shared secret validation
* signed webhook verification
* equivalent authenticated request validation

The webhook endpoint must not accept arbitrary cache tags or paths from an unauthenticated request.

Applications must not be able to use an externally supplied webhook payload to invalidate arbitrary unrelated cache entries without explicit validation.

## Configuration

The existing Next.js request configuration remains compatible with this RFC:

```ts
createNextCMS({
  drupal: {
    baseUrl: "https://example.com"
  },

  request: {
    revalidate: 300,
    tags: [
      "pages"
    ]
  }
});
```

However, implementation work must verify that the configured `request` object is passed through the Next.js integration consistently.

The public configuration should not require applications to instantiate `NextRequestExecutor` directly.

## Relationship to the Drupal Package

The Drupal package remains framework-agnostic.

It may continue to expose:

```ts
DrupalClient
DrupalResource
RequestExecutor
```

without importing:

```ts
next/cache
```

or any other Next.js-specific module.

The dependency direction remains:

```text
@cmsjumpstart/next
        |
        v
@cmsjumpstart/drupal
```

and never:

```text
@cmsjumpstart/drupal
        |
        v
Next.js
```

This preserves the ability to use the Drupal package with other frameworks or server environments.

## Relationship to RequestExecutor

`RequestExecutor` remains responsible for HTTP request execution.

`NextRequestExecutor` remains responsible for translating Next.js-specific request options into Next.js-compatible fetch behavior.

The responsibility boundary is:

```text
RequestExecutor
    |
    | HTTP
    | timeout
    | headers
    | authentication
    | pagination
    v
Drupal API

NextRequestExecutor
    |
    | Next.js fetch options
    | revalidate
    | tags
    v
Next.js
```

Cache invalidation belongs above request execution.

The executor should not call `revalidateTag` or `revalidatePath`.

## Error Handling

Revalidation failures should not be silently ignored.

The Next.js integration should expose clear errors when:

* an invalid resource identity is supplied
* a revalidation operation cannot be performed
* a required Next.js API is unavailable
* invalid configuration is supplied

Errors should not expose credentials, authentication headers, or other sensitive configuration.

## Testing Requirements

The implementation must include tests for:

### Cache Configuration

* `revalidate` is passed to Next.js fetch configuration.
* `tags` are passed to Next.js fetch configuration.
* `revalidate: false` is preserved.
* omitted request configuration remains valid.

### Resource Tags

* resource-type tags are deterministic.
* resource-specific tags are deterministic.
* resource type and ID are correctly represented.
* tag names do not contain unsafe characters.

### Revalidation

* resource-type revalidation invalidates the expected tag.
* resource-specific revalidation invalidates the expected tag.
* invalid resource identities produce clear errors.
* revalidation does not modify the Drupal request layer.

### Integration

* `@cmsjumpstart/next` can configure caching without importing Next.js APIs into `@cmsjumpstart/drupal`.
* existing Drupal tests continue to pass.
* existing Next.js resource and request tests continue to pass.

## Example

A future application may look conceptually like:

```ts
const response = await cms
  .resource("node--page")
  .fields("title", "body")
  .limit(5)
  .get();
```

The request may be cached by Next.js using a resource-derived tag:

```text
cmsjumpstart:drupal:node--page
```

When Drupal publishes a specific page:

```text
node--page:123
```

the webhook layer can invalidate:

```text
cmsjumpstart:drupal:node--page:123
```

The next request for that resource can then retrieve fresh CMS data.

## Alternatives Considered

### Custom CMSJumpstart Cache

Rejected.

A separate cache would duplicate Next.js functionality and create additional invalidation and storage concerns.

### Route-Only Revalidation

Rejected as the primary mechanism.

Routes are application-specific and do not necessarily map one-to-one with CMS resources.

### URL-Based Cache Keys

Rejected.

Request URLs are implementation details and do not express the semantic identity of CMS content.

### Automatic Relationship-Based Invalidation

Deferred.

Automatically invalidating all related resources could produce unpredictable invalidation behavior and large dependency graphs.

### Drupal-Specific Next.js Logic

Rejected.

Drupal-specific concerns belong in `@cmsjumpstart/drupal`, while Next.js-specific concerns belong in `@cmsjumpstart/next`.

## Consequences

### Positive

* Uses Next.js's native caching infrastructure.
* Keeps Drupal integration framework-agnostic.
* Provides predictable CMS resource identity.
* Makes webhook invalidation straightforward.
* Avoids coupling CMS content to application routes.
* Allows applications to define additional domain-specific cache tags.
* Provides a clear foundation for preview and draft content.

### Negative

* Applications still need to understand some Next.js caching concepts.
* Resource-to-route relationships remain application-specific.
* Cache invalidation becomes an important part of the public Next.js API.
* Changes to Next.js caching APIs may require updates to `@cmsjumpstart/next`.

### Future Considerations

Future RFCs or implementation work may address:

* Draft/preview content.
* Webhook authentication.
* Webhook payload normalization.
* Automatic route invalidation.
* Multi-provider CMS cache tags.
* Localization-aware cache identity.
* Cache invalidation for related resources.
* Additional Next.js cache APIs as the framework evolves.

## Implementation Plan

Implementation should proceed in the following order:

1. Verify the current `NextCMSConfig` request configuration flow.
2. Define the internal cache-tag generation utility.
3. Add deterministic resource-type and resource-ID tags.
4. Integrate resource tags with Next.js fetch requests.
5. Define and implement the public revalidation helper.
6. Add unit and integration tests.
7. Update the Next.js example to demonstrate revalidation.
8. Document the resulting public API.
9. Implement webhook-triggered invalidation as a follow-up.
10. Implement draft/preview content as a follow-up.

## Summary

CMSJumpstart will treat Next.js as the owner of application caching while providing a thin CMS-aware integration layer.

The core architectural rule is:

```text
Drupal package
    |
    | CMS data + resource identity
    v
Next.js package
    |
    | cache tags + revalidation
    v
Next.js cache
```

CMSJumpstart will use deterministic resource-based cache tags to connect CMS content changes to Next.js cache invalidation.

This provides the foundation for reliable content revalidation without coupling the Drupal package to Next.js or forcing CMSJumpstart to understand application routing.
