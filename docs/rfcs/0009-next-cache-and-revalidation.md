# RFC 0009: Next.js Cache, Revalidation, and Preview

## Status

Accepted

## Decision

CMSJumpstart will provide Next.js-specific caching, revalidation, and preview capabilities through `@cmsjumpstart/next` while keeping the Drupal package framework-agnostic.

The Next.js integration will use Next.js's native caching and request-time APIs rather than implementing an independent cache.

CMS-specific resource identity will be used to provide predictable cache tags, while applications may provide explicit custom tags when necessary.

CMSJumpstart will support a server-side preview mode using Next.js Draft Mode. Preview mode will automatically bypass CMS caching and request Drupal's working-copy revision.

The Drupal package will remain unaware of Next.js APIs such as:

* `use cache`
* `cacheLife`
* `cacheTag`
* `revalidateTag`
* `revalidatePath`
* `draftMode`

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

## Implementation Status

The implementation is being delivered incrementally.

### Implemented

* Next.js 16 integration.
* Next.js Cache Components configuration.
* `use cache` support in the example application.
* `cacheLife()` support.
* `cacheTag()` support.
* Next.js-aware request execution.
* Deterministic CMS resource cache tags.
* Application-defined cache tags.
* `revalidateResource()`.
* `revalidateTag(tag, "max")`-based invalidation.
* Automated tests for request caching and cache tags.
* Automated tests for resource revalidation.

### Approved / In Progress

* Drupal `resourceVersion` query support.
* Preview-mode data fetching.
* Next.js Draft Mode integration.
* Secure `/preview` entry point.
* Preview UI in the example application.
* Working-copy revision fetching.
* Preview lifecycle tests.

### Planned Follow-Up

* Drupal webhook integration.
* Webhook authentication and payload validation.
* End-to-end webhook revalidation.
* Specific Drupal revision fetching for individual resources where required.
* Additional preview and content lifecycle documentation.

---

# Context

CMSJumpstart provides a thin integration layer between Next.js applications and headless CMS platforms.

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

The Drupal package is responsible for CMS communication and remains framework-agnostic.

The Next.js package is responsible for translating CMS requests into Next.js-compatible behavior.

Next.js 16 introduces Cache Components as the current caching model. CMSJumpstart will build on the native Next.js APIs rather than creating another caching abstraction.

The primary caching primitives are:

* `"use cache"`
* `cacheLife()`
* `cacheTag()`
* `revalidateTag()`

Preview mode uses the separate Next.js `draftMode()` request-time API.

---

# Goals

This RFC establishes the caching, revalidation, and preview model for CMSJumpstart's Next.js integration.

The goals are:

* Preserve the framework-agnostic design of `@cmsjumpstart/drupal`.
* Provide first-class Next.js cache integration.
* Use Next.js 16's native Cache Components architecture.
* Provide predictable CMS resource cache tags.
* Allow applications to provide custom cache tags.
* Provide a small public revalidation API.
* Support CMS-driven cache invalidation.
* Support secure preview and draft content.
* Automatically bypass CMS caching while preview mode is active.
* Support Drupal working-copy revisions for preview.
* Keep Drupal authentication server-side.
* Avoid exposing CMS credentials to browsers.
* Avoid forcing applications to understand the internal Drupal request pipeline.
* Keep the API small and composable.
* Allow the implementation to evolve with Next.js caching APIs.

---

# Non-Goals

This RFC does not define:

* A replacement for Next.js's cache.
* A persistent CMSJumpstart cache.
* Client-side caching.
* CDN cache configuration.
* Automatic route discovery.
* Automatic mapping between Drupal resources and Next.js routes.
* Automatic invalidation of every application route.
* Automatic relationship-based invalidation.
* A generic CMS webhook protocol.
* Client-side Drupal authentication.
* Exposing Drupal credentials to the browser.
* A CMS-specific preview UI component.
* A requirement that every application use the example application's preview UI.

Webhook behavior is defined architecturally but implemented as a follow-up.

---

# Cache Ownership

Next.js owns the application cache.

CMSJumpstart does not implement or maintain a separate cache layer.

The responsibility is divided as follows:

```text
CMSJumpstart
    |
    | defines CMS resource identity
    | provides cache tags
    | configures Next.js request behavior
    |
    v
Next.js
    |
    | stores cached responses
    | manages cache lifetime
    | performs cache invalidation
    |
    v
Application
```

This keeps CMSJumpstart focused on integrating CMS data access with Next.js rather than becoming a caching system itself.

---

# Next.js Cache Components

The example application enables Next.js Cache Components:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true
};
```

Cached CMS data should use the Next.js cache model.

A typical cached data function is:

```ts
import {
  cacheLife,
  cacheTag
} from "next/cache";

export async function getPages() {
  "use cache";

  cacheLife("hours");

  cacheTag(
    "cmsjumpstart:drupal:node--page"
  );

  return cms
    .resource("node--page")
    .get();
}
```

The application owns the placement of the `"use cache"` boundary.

CMSJumpstart provides the underlying CMS-aware request and cache-tag mechanisms.

CMSJumpstart must not create a second caching abstraction that attempts to replace Next.js Cache Components.

---

# Cache Lifetime

Cache lifetime is controlled by Next.js.

Applications may use Next.js cache-life profiles such as:

```ts
cacheLife("hours");
```

or define more specific cache behavior where appropriate.

CMSJumpstart should not impose a universal cache lifetime on all CMS resources.

Different applications may have different freshness requirements.

For example:

* marketing content may tolerate an hourly cache lifetime;
* frequently changing content may use a shorter lifetime;
* stable content may use a longer lifetime;
* content requiring immediate freshness can be explicitly revalidated.

Cache lifetime and cache invalidation are separate concerns.

A longer cache lifetime does not prevent on-demand invalidation through cache tags.

---

# Request-Level Caching

`NextRequestExecutor` remains responsible for translating Next.js-specific request options into compatible fetch behavior.

The request options currently support:

```ts
interface NextRequestOptions
  extends RequestOptions {
  revalidate?: number | false;
  tags?: string[];
}
```

These options provide lower-level control over the underlying request.

CMSJumpstart also exposes the higher-level `.cache()` resource behavior where appropriate.

The public API should not require applications to instantiate `NextRequestExecutor` directly.

---

# Cache Tags

Cache tags provide a stable mechanism for associating CMS data with content that may later need to be invalidated.

CMSJumpstart distinguishes between:

1. Resource-derived tags.
2. Application-defined tags.

---

# Resource-Derived Tags

A Drupal resource identity consists of a resource type and, when applicable, a resource ID.

For example:

```text
resource type:
node--page

resource ID:
123
```

The resource type produces:

```text
cmsjumpstart:drupal:node--page
```

A specific resource produces:

```text
cmsjumpstart:drupal:node--page:123
```

This allows applications to invalidate:

* every resource of a type;
* one specific resource.

The tag format is centralized in `@cmsjumpstart/next`.

The Drupal package does not need to know about the tag namespace.

---

# Application-Defined Tags

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

---

# Tag Naming

CMSJumpstart-generated tags use a namespace to reduce collisions with application-defined tags.

The initial convention is:

```text
cmsjumpstart:<provider>:<resource>
cmsjumpstart:<provider>:<resource>:<id>
```

For Drupal:

```text
cmsjumpstart:drupal:node--page
cmsjumpstart:drupal:node--page:123
```

The tag format must remain:

* deterministic;
* stable;
* easy to inspect during debugging;
* independent of request URLs.

The implementation should avoid using request URLs as the semantic identity of CMS content.

---

# Resource Identity

Resource identity is based on the CMS resource type and, when available, the resource ID.

For example:

```text
node--page
123
```

maps to:

```text
cmsjumpstart:drupal:node--page
cmsjumpstart:drupal:node--page:123
```

Relationships and included resources do not automatically create independent invalidation tags unless they are independently fetched or explicitly represented by the application.

This prevents a single response containing many included resources from creating an unexpectedly large invalidation graph.

---

# Revalidation

CMSJumpstart exposes Next.js revalidation through `@cmsjumpstart/next`.

The integration uses Next.js's native revalidation APIs.

The primary CMS-aware helper is:

```ts
revalidateResource(
  resourceType,
  resourceId?
);
```

For example:

```ts
revalidateResource(
  "node--page"
);
```

invalidates the resource-type tag.

And:

```ts
revalidateResource(
  "node--page",
  "123"
);
```

invalidates the specific resource tag.

The current implementation resolves the appropriate CMSJumpstart tags and calls:

```ts
revalidateTag(
  tag,
  "max"
);
```

The use of `"max"` follows the current Next.js revalidation model for stale-while-revalidate behavior.

CMSJumpstart does not maintain its own cache.

---

# Route Revalidation

CMSJumpstart will not automatically map Drupal resources to Next.js routes.

For applications that need route-level invalidation, the application may explicitly use Next.js route revalidation.

For example:

```ts
revalidatePath("/news");
revalidatePath("/news/example-article");
```

Route-to-content mapping is application-specific.

A single CMS resource may appear on multiple routes, and a single route may contain many CMS resources.

Therefore resource tags remain the primary CMS invalidation mechanism.

---

# Why Tags Are Preferred

CMS content and application routes are not necessarily one-to-one.

A single Drupal resource may appear on:

* a detail page;
* a homepage;
* a listing page;
* a search page;
* a related-content component;
* multiple localized routes.

Invalidating a route directly would require CMSJumpstart to understand application routing.

Tags allow the CMS layer to identify changed content without knowing where that content is rendered.

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

---

# Preview and Draft Content

CMSJumpstart will support preview mode through Next.js Draft Mode.

Preview mode is intentionally different from normal cached rendering.

The normal flow is:

```text
getPages()
    |
    v
"use cache"
    |
    +--> cacheLife()
    |
    +--> cacheTag()
    |
    v
Drupal
```

The preview flow is:

```text
getPages()
    |
    v
draftMode()
    |
    v
Preview enabled
    |
    +--> bypass CMS cache
    |
    +--> request Drupal working copy
    |
    v
Drupal JSON:API
```

Preview mode must not require the developer or application to manually toggle a cache flag on every CMS request.

Once preview mode is active, CMSJumpstart's Next.js integration should automatically use the preview behavior.

---

# Preview Entry Point

Applications should provide a dedicated preview entry point.

The recommended pattern is:

```text
/preview?path=/about-us
```

The `/preview` route is an entry point into preview mode.

It is not intended to become part of the application's normal content routing scheme.

The preview entry point is responsible for:

1. validating the preview request;
2. enabling Next.js Draft Mode;
3. redirecting to the requested application path.

The resulting browser URL should normally become:

```text
/about-us
```

rather than remaining at:

```text
/preview?path=/about-us
```

The preview state is represented by the Draft Mode cookie and the application's preview UI.

The URL itself is not the security mechanism.

---

# Preview Security

Preview activation must be explicitly authorized.

The `/preview` route must not enable preview mode for arbitrary unauthenticated requests.

Applications should validate a secret or equivalent authorization mechanism before calling:

```ts
draftMode().enable();
```

The exact authentication mechanism belongs to the application because authentication requirements vary between deployments.

A typical flow is:

```text
Browser
   |
   | /preview?path=/about-us&secret=...
   v
Next.js Route Handler
   |
   | validate secret
   | validate path
   | enable Draft Mode
   v
redirect("/about-us")
```

The application must validate the redirect path to prevent open redirect vulnerabilities.

Preview secrets must not be exposed through client-side code.

---

# Preview Authentication

Existing CMS authentication remains server-side.

The example application currently uses:

```text
HTAUTH_U
HTAUTH_P
X-Consumer-ID
api-key
```

These credentials must remain server-side.

Preview mode does not change this architecture.

The browser receives only the Next.js Draft Mode cookie.

The request pipeline remains:

```text
Browser
    |
    | Draft Mode cookie
    v
Next.js
    |
    | server-side Drupal credentials
    v
Drupal
```

Drupal credentials must never be sent to the browser.

---

# Preview User Interface

The preview UI belongs to the application rather than the CMSJumpstart package.

CMSJumpstart provides the preview mechanism.

The application is responsible for displaying a visual indication that preview mode is active.

For example:

```text
+----------------------------------------------+
| PREVIEW MODE                                 |
| You are viewing unpublished Drupal content.  |
|                              [Exit Preview]   |
+----------------------------------------------+
```

The UI should make the preview state obvious to editors and developers.

The application should provide an Exit Preview action that disables Draft Mode and returns the user to normal cached rendering.

CMSJumpstart should not require applications to use a particular visual design.

---

# Preview Cache Behavior

Preview mode automatically bypasses CMS caching.

Applications should not need to write:

```ts
.cache(false)
```

or maintain a manual cache toggle.

The distinction is based on the request context:

```text
Normal request
    |
    v
cached CMS data

Preview request
    |
    v
uncached CMS data
```

This prevents accidentally displaying stale cached content while an editor is previewing unpublished changes.

The implementation must also ensure that request-time Draft Mode detection does not occur inside a `"use cache"` function boundary.

Request-time APIs such as `draftMode()` belong outside the cached function boundary.

---

# Drupal Revision Selection

Drupal JSON:API distinguishes between the identity of a content entity and the revision of that entity.

The entity/resource ID identifies the content entity.

A revision ID identifies a particular revision of that entity.

Preview mode should use Drupal's working-copy revision relationship:

```text
rel:working-copy
```

This allows preview requests to retrieve the current editable revision rather than the currently published revision.

The intended preview request is conceptually:

```text
?resourceVersion=rel:working-copy
```

The Drupal package will expose this capability through its query/resource API rather than embedding preview logic into the Next.js package.

---

# Resource Version API

The Drupal integration should expose a resource-version operation similar to:

```ts
resourceVersion(
  "rel:working-copy"
);
```

Supported relationship-based versions should include:

```text
rel:working-copy
rel:latest-version
```

Specific revision identifiers may use the Drupal form:

```text
id:<revision-id>
```

However, specific revision fetching must respect the distinction between collection requests and individual-resource requests.

The implementation must not blindly add:

```text
resourceVersion=id:123
```

to collection requests if Drupal does not support that form for the requested endpoint.

If specific revision retrieval requires a dedicated resource-by-ID API, that API should be introduced separately.

The important architectural rule is that revision selection belongs to `@cmsjumpstart/drupal`, while the decision to request the working copy in preview mode belongs to `@cmsjumpstart/next`.

---

# Preview Data Flow

The complete preview flow is:

```text
                    Browser
                       |
                       | /preview?path=/about-us
                       v
              Next.js Route Handler
                       |
                       | validate preview access
                       | validate path
                       | draftMode().enable()
                       |
                       v
                redirect("/about-us")
                       |
                       v
                 Server Component
                       |
                       | await draftMode()
                       |
              +--------+--------+
              |                 |
          Normal            Preview
              |                 |
              v                 v
         "use cache"        no CMS cache
              |                 |
         cacheLife()        working copy
              |                 |
         cacheTag()             |
              |                 |
              +--------+--------+
                       |
                       v
                Drupal JSON:API
```

---

# Exiting Preview Mode

Applications must provide a way to exit preview mode.

The exit flow should call:

```ts
draftMode().disable();
```

from an appropriate Next.js Route Handler or Server Function according to the current Next.js API requirements.

After disabling Draft Mode, the application should redirect the user back to the normal application route.

The next request should use the normal cached content path.

---

# Webhook Integration

Webhook-triggered revalidation is implemented as a separate layer on top of the caching model.

The intended flow is:

```text
Drupal
   |
   | content changed/published
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

* authenticating the webhook request;
* validating the request payload;
* determining the affected resource;
* generating or resolving the appropriate resource identity;
* triggering CMSJumpstart revalidation.

Webhook support must not require changes to the framework-agnostic Drupal request layer.

---

# Webhook Security

Cache invalidation endpoints must not be publicly executable without authorization.

A future webhook implementation should support a mechanism such as:

* shared secret validation;
* signed webhook verification;
* equivalent authenticated request validation.

The webhook endpoint must not accept arbitrary cache tags or paths from an unauthenticated request.

Applications must not be able to use an externally supplied webhook payload to invalidate unrelated cache entries without explicit validation.

Webhook credentials must be kept server-side.

---

# Relationship to the Drupal Package

The Drupal package remains framework-agnostic.

It may expose:

```text
DrupalClient
DrupalResource
DrupalQueryBuilder
DrupalQuerySerializer
RequestExecutor
```

without importing:

```text
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

This preserves the ability to use the Drupal package with:

* Next.js;
* other React frameworks;
* Node.js services;
* background workers;
* CLI applications;
* other server environments.

---

# Relationship to RequestExecutor

`RequestExecutor` remains responsible for framework-agnostic HTTP request execution.

Responsibilities include:

* HTTP requests;
* timeout handling;
* headers;
* authentication;
* pagination;
* Drupal response handling.

`NextRequestExecutor` remains responsible for Next.js-specific request behavior.

Responsibilities include:

* Next.js fetch configuration;
* `revalidate`;
* cache tags;
* Next.js cache behavior.

The boundary is:

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

The executor must not call:

```ts
revalidateTag();
revalidatePath();
```

The executor should also not be responsible for deciding whether the current request is a preview request.

Preview orchestration belongs at the Next.js integration/application layer.

---

# Configuration

The existing Next.js configuration remains compatible with this RFC.

For example:

```ts
createNextCMS({
  drupal: {
    baseUrl:
      "https://example.com"
  },

  request: {
    revalidate: 300,

    tags: [
      "pages"
    ]
  }
});
```

The public configuration should not require applications to instantiate `NextRequestExecutor` directly.

Application-specific cache configuration remains possible, but the higher-level CMS resource API should remain the preferred integration point.

---

# Error Handling

The Next.js integration should expose clear errors when:

* an invalid resource identity is supplied;
* an invalid resource version is supplied;
* a revalidation operation cannot be performed;
* invalid configuration is supplied;
* a preview request cannot be configured correctly.

Errors must not expose:

* Drupal credentials;
* Basic Auth credentials;
* API keys;
* consumer IDs where inappropriate;
* authentication headers;
* other sensitive configuration.

Preview authorization failures should not disclose sensitive information.

---

# Testing Requirements

The implementation must include tests for the following areas.

## Cache Configuration

Tests must verify:

* `revalidate` is passed to Next.js fetch configuration;
* `tags` are passed to Next.js fetch configuration;
* `revalidate: false` is preserved;
* omitted request configuration remains valid;
* resource-derived tags are included when appropriate;
* duplicate tags are removed.

## Resource Tags

Tests must verify:

* resource-type tags are deterministic;
* resource-specific tags are deterministic;
* resource type and ID are correctly represented;
* invalid resource identities produce clear errors;
* generated tags remain stable.

## Revalidation

Tests must verify:

* resource-type revalidation invalidates the expected tag;
* resource-specific revalidation invalidates the expected tags;
* `revalidateTag(tag, "max")` is used;
* invalid resource identities produce clear errors;
* revalidation does not modify the Drupal request layer.

## Drupal Resource Versions

Tests must verify:

* `resourceVersion("rel:working-copy")` serializes correctly;
* `resourceVersion("rel:latest-version")` serializes correctly;
* invalid resource-version values are rejected where validation is provided;
* resource version selection remains framework-agnostic;
* Drupal requests do not import Next.js APIs.

Specific revision behavior must be tested separately when an individual-resource API is implemented.

## Preview Mode

Tests must verify:

* preview mode can be enabled through the application entry point;
* preview authorization is required;
* invalid preview secrets are rejected;
* invalid redirect paths are rejected;
* Draft Mode is enabled only after validation;
* preview requests bypass CMS caching;
* preview requests request the working-copy revision;
* normal requests continue to use caching;
* exiting preview disables Draft Mode;
* preview state is not exposed through client-side CMS credentials.

## Integration

Tests must verify:

* `@cmsjumpstart/next` can configure caching without importing Next.js APIs into `@cmsjumpstart/drupal`;
* existing Drupal tests continue to pass;
* existing Next.js resource and request tests continue to pass;
* preview behavior works with the example application;
* cache invalidation and preview behavior do not interfere with one another.

---

# Example: Normal Cached Request

A normal CMS data function may look like:

```ts
import {
  cacheLife,
  cacheTag
} from "next/cache";

export async function getPages() {
  "use cache";

  cacheLife("hours");

  cacheTag(
    "cmsjumpstart:drupal:node--page"
  );

  const response =
    await cms
      .resource(
        "node--page"
      )
      .fields(
        "title",
        "body"
      )
      .sort("-created")
      .limit(5)
      .get();

  return response.getAll();
}
```

The result is eligible for Next.js caching.

---

# Example: Preview Request

The application determines whether Draft Mode is active:

```ts
const { isEnabled } =
  await draftMode();
```

If preview mode is enabled, the application should execute the CMS request without entering the cached CMS function boundary.

The request should target Drupal's working copy:

```text
resourceVersion=rel:working-copy
```

Conceptually:

```text
Normal:

getPages()
    |
    v
use cache
    |
    v
Drupal published content


Preview:

getPages()
    |
    v
draftMode()
    |
    v
uncached request
    |
    v
Drupal working copy
```

The implementation should prevent accidental reuse of the normal cached response while preview mode is active.

---

# Example: Resource Revalidation

When Drupal content changes:

```ts
revalidateResource(
  "node--page",
  "123"
);
```

CMSJumpstart resolves the resource tags:

```text
cmsjumpstart:drupal:node--page
cmsjumpstart:drupal:node--page:123
```

and revalidates the associated Next.js cache entries.

The next normal request can then retrieve fresh CMS data.

---

# Alternatives Considered

## Custom CMSJumpstart Cache

Rejected.

A separate cache would duplicate Next.js functionality and create additional invalidation and storage concerns.

CMSJumpstart should integrate with Next.js rather than compete with it.

---

## Route-Only Revalidation

Rejected as the primary mechanism.

Routes are application-specific and do not necessarily map one-to-one with CMS resources.

---

## URL-Based Cache Keys

Rejected.

Request URLs are implementation details and do not express the semantic identity of CMS content.

---

## Automatic Relationship-Based Invalidation

Deferred.

Automatically invalidating all related resources could produce unpredictable invalidation behavior and large dependency graphs.

---

## Manual Preview Cache Toggle

Rejected.

Requiring developers to manually toggle CMS caching when entering preview mode is error-prone.

Preview mode should automatically determine whether CMS data is cached.

---

## Preview URLs as Normal Content URLs

Rejected.

Preview should not require every application route to include preview-specific URL parameters.

The `/preview` route is an entry point that establishes preview state and redirects to the normal application route.

---

## Client-Side Preview Authentication

Rejected.

CMS credentials must remain server-side.

Next.js Draft Mode provides the browser-side preview state without exposing Drupal credentials.

---

## Drupal-Specific Next.js Logic

Rejected.

Drupal-specific concerns belong in `@cmsjumpstart/drupal`.

Next.js-specific concerns belong in `@cmsjumpstart/next`.

---

# Consequences

## Positive

* Uses Next.js's native caching infrastructure.
* Aligns CMSJumpstart with Next.js 16 Cache Components.
* Keeps Drupal integration framework-agnostic.
* Provides predictable CMS resource identity.
* Provides deterministic cache tags.
* Makes cache invalidation straightforward.
* Avoids coupling CMS content to application routes.
* Allows applications to define additional domain-specific cache tags.
* Provides a clear preview architecture.
* Automatically avoids stale CMS cache during preview.
* Supports Drupal working-copy revisions.
* Keeps Drupal credentials server-side.
* Provides a foundation for webhook-driven publishing workflows.
* Keeps application-specific preview UI outside the core package.

## Negative

* Applications still need to understand some Next.js caching concepts.
* Resource-to-route relationships remain application-specific.
* Cache invalidation becomes an important part of the public Next.js API.
* Preview authentication remains application-specific.
* Preview UI remains application-specific.
* Changes to Next.js caching APIs may require updates to `@cmsjumpstart/next`.
* Drupal revision semantics introduce additional API complexity.

---

# Future Considerations

Future RFCs or implementation work may address:

* Drupal webhook authentication;
* webhook payload normalization;
* webhook-driven revalidation;
* automatic route invalidation;
* specific Drupal revision retrieval APIs;
* localization-aware cache identity;
* cache invalidation for related resources;
* multi-provider CMS cache tags;
* more sophisticated preview permissions;
* preview links generated directly from Drupal;
* editor-specific preview sessions;
* additional Next.js cache APIs as the framework evolves.

---

# Implementation Plan

Implementation should proceed in the following order.

## Completed

1. Upgrade the example application to Next.js 16.
2. Enable Cache Components.
3. Add `use cache` to CMS data functions.
4. Add `cacheLife()`.
5. Add `cacheTag()`.
6. Implement deterministic CMS resource cache tags.
7. Integrate resource tags with Next.js requests.
8. Implement `revalidateResource()`.
9. Add unit and integration tests for caching and revalidation.
10. Update the example application to demonstrate CMS caching.

## Current Work

11. Add Drupal `resourceVersion` support.
12. Add `rel:working-copy` support.
13. Add preview-mode request handling.
14. Add Next.js Draft Mode integration.
15. Add a secure `/preview` Route Handler to the example application.
16. Add preview state UI.
17. Add Exit Preview behavior.
18. Add preview-specific tests.
19. Add end-to-end lifecycle tests.

## Follow-Up

20. Implement Drupal webhook-triggered revalidation.
21. Add webhook authentication.
22. Normalize webhook payloads.
23. Add webhook integration tests.
24. Document the complete content lifecycle.
25. Evaluate specific revision fetching for individual Drupal resources.

---

# Content Lifecycle

The resulting architecture is intended to support the complete CMS content lifecycle:

```text
                    Drupal
                       |
             +---------+---------+
             |                   |
         Published            Working Copy
             |                   |
             v                   v
        Normal Request      Preview Request
             |                   |
         use cache              |
         cacheLife()             |
         cacheTag()             |
             |                   |
             +---------+---------+
                       |
                       v
                    Next.js
                       |
              +--------+--------+
              |                 |
             Cache          Draft Mode
              |                 |
              v                 v
        Published Site       Preview
              |
              v
       Content Published
              |
              v
           Webhook
              |
              v
      revalidateResource()
              |
              v
       Next.js Cache
              |
              v
         Fresh Content
```

This establishes a clear distinction between:

* normal published content;
* cached application data;
* unpublished working-copy content;
* preview mode;
* cache invalidation;
* eventual webhook-driven publishing.

---

# Summary

CMSJumpstart treats Next.js as the owner of application caching while providing a thin CMS-aware integration layer.

The core architectural rules are:

```text
Drupal package
    |
    | CMS data
    | resource identity
    | resource versions
    v
Next.js package
    |
    | cache tags
    | revalidation
    | preview orchestration
    v
Next.js
    |
    +--> Cache Components
    |
    +--> Draft Mode
```

Normal content uses Next.js caching:

```text
"use cache"
cacheLife()
cacheTag()
```

CMS content changes are handled through resource-based revalidation:

```text
Drupal resource
      |
      v
CMSJumpstart cache tag
      |
      v
revalidateTag()
```

Preview content uses Next.js Draft Mode:

```text
/preview
    |
    v
validate request
    |
    v
draftMode().enable()
    |
    v
redirect to normal route
    |
    v
uncached CMS request
    |
    v
resourceVersion=rel:working-copy
```

The result is a content architecture that supports production caching, predictable invalidation, unpublished content preview, and future webhook-driven publishing without coupling the Drupal package to Next.js.
