# @cmsjumpstart/next

Next.js integration for CMSJumpstart, providing Drupal resource access, Next.js-compatible request caching, cache revalidation helpers, and preview and revalidation handlers.

## Installation

```bash
pnpm add @cmsjumpstart/next next
```

This package depends on `@cmsjumpstart/drupal` and requires a compatible Next.js installation. Check the package's `peerDependencies` for the supported Next.js version range.

## Create a CMS client

```ts
import { createNextCMS } from "@cmsjumpstart/next";

const cms = createNextCMS({
  drupal: {
    baseUrl: process.env.DRUPAL_BASE_URL!,
    auth: {
      type: "api-key",
      key: process.env.API_KEY!,
    },
  },
});

const courses = await cms
  .resource("node--course")
  .get();
```

Keep API credentials server-side. Do not expose secrets through public environment variables or client components.

## Request caching

Configure caching through the client's `request` options:

```ts
const cms = createNextCMS({
  drupal: {
    baseUrl: process.env.DRUPAL_BASE_URL!,
    auth: {
      type: "api-key",
      key: process.env.API_KEY!,
    },
  },
  request: {
    revalidate: 300,
    tags: ["course-catalog"],
  },
});
```

The executor forwards supported Next.js caching options to its fetch requests. It can attach resource-specific cache tags and application-defined tags, removing duplicate tags.

Resource-level `.cache()` is also available to enable Next.js-compatible HTTP caching for that resource request. Choose caching and revalidation behavior according to how frequently your Drupal content changes.

## Cache revalidation

The package exports `revalidateResource`, which revalidates cache tags associated with a resource type and, optionally, a resource ID.

It also exports `createRevalidationHandler` for handling supported CMS or Drupal webhook payloads. Configure a secret and protect the handler with the authentication mechanism supported by the implementation. Verify your Drupal webhook payload and deployment configuration before enabling it in production.

## Preview handler

`createPreviewHandler` provides a POST handler for enabling Next.js Draft Mode and redirecting to a validated local path.

The handler requires the configured secret in the `Authorization: Bearer <secret>` header and the destination in a JSON request body. Never place the preview secret in a URL, query string, or client-side code. Use HTTPS in production and keep the secret in a server-only environment variable.

Example request:

```http
POST /preview HTTP/1.1
Authorization: Bearer your-server-side-preview-secret
Content-Type: application/json

{"path":"/about-us"}
```

The handler rejects requests that use other HTTP methods, invalid credentials, malformed JSON, or external redirect destinations before enabling Draft Mode.

**Integration note:** This endpoint is a server-side primitive, not a complete Drupal editor-to-browser preview workflow. A server-to-server request does not set Draft Mode cookies in an editor's browser. A browser-based preview workflow requires a separate, securely designed handoff to establish Draft Mode in that browser.


## Exports

The package exposes:

- `createNextCMS` and `NextCMSClient`
- `NextCMSResource`
- `revalidateResource`
- `createRevalidationHandler`
- `createPreviewHandler`
- Associated configuration and handler option types

## License

MIT. See the accompanying `LICENSE` file.