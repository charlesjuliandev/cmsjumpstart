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

`createPreviewHandler` provides a handler for enabling Next.js draft mode and redirecting to a requested path. Configure a secret, keep it private, and use HTTPS in production. The handler validates that the redirect path is local rather than an external URL.

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