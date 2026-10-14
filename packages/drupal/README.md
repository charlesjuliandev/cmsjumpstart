# @cmsjumpstart/drupal

A TypeScript client and query utilities for working with Drupal JSON:API.

## Installation

```bash
pnpm add @cmsjumpstart/drupal
```

This package depends on `@cmsjumpstart/core`.

## Create a Drupal client

```ts
import { createDrupalClient } from "@cmsjumpstart/drupal";

const drupal = createDrupalClient({
  baseUrl: process.env.DRUPAL_BASE_URL!,
  apiKey: process.env.API_KEY!,
});

const courses = await drupal
  .resource("node--course")
  .get();
```

Set `DRUPAL_BASE_URL` to the base URL of your Drupal site and `API_KEY` to the API key expected by your Drupal configuration. Keep credentials in server-side environment variables; do not expose secrets through client-side code or public environment variables.

The `apiKey` option configures the client's API-key authentication. If your Drupal environment requires a different authentication method, configure the client's `auth` option accordingly.

## Query resources

The resource API supports methods for building JSON:API queries, including:

```ts
const query = drupal
  .resource("node--course")
  .include("field_department")
  .fields("title", "field_description")
  .sort("title")
  .limit(10);

const response = await query.get();
```

Use the field names and relationship names defined by your Drupal content model. The exact returned data depends on the JSON:API response and the fields and relationships available to the authenticated client.

Other resource methods include `id()`, `filter()`, `page()`, and `resourceVersion()`. Pagination helpers and included-resource utilities are also available.

## Client configuration

The client accepts a `baseUrl` and optional request settings, headers, and authentication configuration. Authentication modes and their requirements depend on the configuration you supply.

## License

MIT. See the accompanying `LICENSE` file.