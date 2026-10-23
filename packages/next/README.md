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

It also exports `createRevalidationHandler` to expose an authenticated `POST` endpoint for supported CMS or Drupal webhook payloads.

### Configure the endpoint

Set `CMSJUMPSTART_REVALIDATION_SECRET` as a server-side environment variable in your deployment environment. The example route at `app/api/revalidate/route.ts` uses this value to configure the handler. Do not commit the secret or expose it to client-side code.

The handler accepts either of these authentication methods:

- **Bearer token:** Send `Authorization: Bearer <secret>`.
- **HMAC signature:** Send `X-Hub-Signature-256: sha256=<hex-digest>`, where the digest is an HMAC-SHA256 signature of the exact raw request body, using the configured secret.

### Supported payloads

A CMSJumpstart resource payload identifies a resource type and may optionally identify a resource ID:

```json
{
  "resource": {
    "type": "node--course",
    "id": "resource-uuid"
  }
}
```

Omit `id` to revalidate the collection tag for that resource type.

The handler also recognizes Drupal node events with event names `entity:node:create`, `entity:node:update`, and `entity:node:delete`, using the entity UUID and node bundle from the payload. The payload must match the structure expected by the handler.

### Drupal integration

This route exposes the receiving endpoint; it does not configure Drupal to send webhook requests. Configure a compatible Drupal webhook sender separately, use HTTPS in production, and verify that the sender's actual payload and signature format match the handler before enabling automatic revalidation.

The handler uses Next.js cache revalidation with stale-while-revalidate semantics. Revalidated content may be served stale while Next.js refreshes it, rather than guaranteeing that the very next response contains fresh Drupal data.



## Preview workflow

CMSJumpstart provides three handlers for a server-mediated Drupal-to-Next.js preview workflow:

- `createPreviewTokenHandler` (`POST /api/preview-token`) authenticates a server-to-server request using `Authorization: Bearer <secret>` and issues a signed preview token.
- `createPreviewHandler` (`POST /preview`) accepts the token in a JSON or HTML form body, validates it and the configured Drupal editor origin, enables Next.js Draft Mode, and redirects to the signed local path.
- `createExitPreviewHandler` (`POST /exit-preview`) validates the editor origin and a local destination, disables Draft Mode, and redirects.

All three handlers require the Node.js runtime. The preview token expires after 60 seconds. The handlers return `Cache-Control: no-store` on their ordinary responses, including errors. The application and Drupal integration must also ensure the token-issuance response and browser handoff page are never cached.

### Server configuration

Configure these environment variables on the Next.js server:

- `CMSJUMPSTART_PREVIEW_SECRET`: a long, random, server-only secret shared with the Drupal server that requests preview tokens.
- `CMSJUMPSTART_PREVIEW_ALLOWED_ORIGIN`: the exact origin of the Drupal editor interface, such as `https://cms.example.com`. Do not include a path or trailing slash. This may differ from `DRUPAL_BASE_URL`, which identifies the Drupal API server.

Use HTTPS in production. HTTP is accepted only for localhost development.

### Token issuance

Drupal's server authenticates the editor, determines the permitted local preview path, and makes a server-to-server request:

```http
POST /api/preview-token HTTP/1.1
Authorization: Bearer your-server-side-preview-secret
Content-Type: application/json

{"path":"/courses/introduction-to-computer-science"}
```

The response contains a signed token, its expiration timestamp, and the validated path. The Drupal server must not expose the shared secret to the browser.

### Browser handoff

After obtaining the token, the Drupal server can render a short-lived HTML form that posts the token to the Next.js `/preview` endpoint:

```html
<form method="post" action="https://next.example.com/preview">
  <input type="hidden" name="token" value="SERVER_RENDERED_TOKEN">
  <button type="submit">Preview on Next.js</button>
</form>
```

Replace the example action with the actual Next.js origin and safely HTML-escape the token. Render this as a non-cacheable response with `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. Do not put the token in the action URL, query string, client-side JavaScript, analytics, or logs. Restrict the handoff page's Content Security Policy `form-action` to the Next.js origin.

The browser submits the form from the Drupal editor origin. The Next.js preview handler checks that the request's `Origin` matches `CMSJUMPSTART_PREVIEW_ALLOWED_ORIGIN`. It also validates the token signature, purpose, expiration, and signed local redirect path before enabling Draft Mode.

### Exit Preview

Provide an exit form or button that submits a POST to `/exit-preview`, with an optional local destination in the body:

```html
<form method="post" action="https://next.example.com/exit-preview">
  <input type="hidden" name="path" value="/courses">
  <button type="submit">Exit preview</button>
</form>
```

The destination must be a local path. If omitted, the handler redirects to `/`.

### Security limitations

- The shared preview secret is for server-to-server authentication only. Never put it in a browser request or URL.
- Tokens expire after 60 seconds and are signed with HMAC-SHA-256. Because this implementation does not use shared storage, it cannot guarantee single-use tokens; a captured token could be replayed until it expires.
- Origin validation is an additional browser request check, not a substitute for token validation.
- Redirect paths are validated to prevent external and protocol-relative redirects.
- Keep preview retrieval separate from published-content caching. Do not cache preview data as published content.
- The handlers implement the Next.js side of the contract. CMSJumpstart does not currently provide a Drupal module that adds an editor button, authenticates the editor, issues the token request, and renders the handoff form. That Drupal-side integration must be implemented and tested for your site.

Do not deploy the workflow until the Drupal integration and the preview and exit routes have been tested together.


## Exports

The package exposes:

- `createNextCMS` and `NextCMSClient`
- `NextCMSResource`
- `NextCMSConfig` and `NextRequestOptions`
- `revalidateResource`
- `createRevalidationHandler` and `RevalidationHandlerOptions`
- `createPreviewHandler` and `PreviewHandlerOptions`
- `createPreviewTokenHandler` and `PreviewTokenHandlerOptions`
- `createExitPreviewHandler` and `ExitPreviewHandlerOptions`

## License

MIT. See the accompanying `LICENSE` file.