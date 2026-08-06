# RFC 0002: Drupal Query Builder

## Status

Accepted

## Summary

Define the design and behavior of the Drupal JSON:API query builder used by CMSJumpstart.

The query builder provides developers with a type-safe way to construct Drupal API queries without manually building JSON:API query parameters.

---

# Problem

Drupal JSON:API is powerful but requires developers to understand:

- Resource type naming
- Query parameters
- Includes
- Filters
- Pagination
- Sorting
- Relationship handling

Every headless Drupal project typically recreates this logic.

CMSJumpstart should provide a consistent developer experience that allows developers to focus on building applications instead of manually constructing API requests.

---

# Goals

The query builder should:

- Provide a fluent API.
- Produce predictable Drupal JSON:API queries.
- Be fully testable without making HTTP requests.
- Support immutable query composition.
- Support incremental feature additions.
- Remain independent from authentication and networking.

---

# Non-Goals

The initial query builder will not:

- Execute HTTP requests.
- Handle authentication.
- Manage caching.
- Generate TypeScript types.
- Discover Drupal schemas.

Those responsibilities belong to other CMSJumpstart packages or layers.

---

# Design Decisions

## Immutable API

The query builder will use immutable operations.

Example:

```ts
const pages = client
  .resource("node--page");

const recentPages = pages
  .sort("-created");

const featuredPages = pages
  .filter("featured", true);