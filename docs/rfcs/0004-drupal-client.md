# RFC 0004: Drupal Client

## Status

Accepted

## Summary

Define the developer-facing client responsible for interacting with Drupal JSON:API.

## Problem

Developers integrating headless Drupal repeatedly recreate:

- Base URL handling
- Authentication headers
- Request execution
- Error handling
- JSON:API communication

CMSJumpstart should provide a consistent client abstraction.

## Decision

The Drupal client will be responsible for:

- Drupal connection configuration
- Authentication
- Request execution
- Query builder integration
- Response handling

The client will not be responsible for:

- UI concerns
- Data transformation
- React/Next.js integration
- Caching strategies

Those belong to higher-level packages.

## API Goals

A developer should be able to write:

```ts
const client = createDrupalClient({
  baseUrl: "https://example.com",
  apiKey: "secret"
});

const pages = await client
  .resource("node--page")
  .limit(10)
  .get();