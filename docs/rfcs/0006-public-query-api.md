# RFC 0006: Public Query API

## Status

Proposed

## Authors

CMSJumpstart Team

## Summary

Define the public querying API for CMSJumpstart.

The goal is to create an API that feels natural to React, Next.js, and TypeScript developers while hiding the complexity of Drupal JSON:API.

---

# Motivation

Most Drupal JSON:API libraries closely mirror Drupal's API.

This forces developers to understand Drupal's internal query syntax before they can retrieve data.

CMSJumpstart should instead expose a modern, fluent API that focuses on developer intent rather than Drupal implementation details.

The developer should think in terms of:

- Resources
- Queries
- Results

Not:

- URL parameters
- JSON:API query syntax
- HTTP request construction

---

# Design Principles

## 1. Intent over implementation

Good

```ts
await client
  .resource("node--page")
  .findMany();
```

Avoid

```ts
await client
  .resource("node--page")
  .get();
```

The method name should communicate what the developer is trying to accomplish.

---

## 2. Fluent API

Queries should read naturally.

```ts
await client
  .resource("node--page")
  .include("field_image")
  .sort("-created")
  .limit(10)
  .findMany();
```

---

## 3. Immutable query state

Every query operation returns a new immutable query.

Benefits:

- Safe reuse
- Predictable behavior
- Easier testing

---

## 4. Separate responsibilities

DrupalClient

- Stores configuration
- Authentication
- Request execution

DrupalResource

- Represents a Drupal resource

DrupalQuery

- Represents query state only

Serializer

- Converts query state into JSON:API parameters

---

# Proposed Public API

## Multiple Resources

```ts
const pages =
  await client
    .resource("node--page")
    .findMany();
```

---

## Includes

```ts
const pages =
  await client
    .resource("node--page")
    .include(
      "field_image",
      "field_author"
    )
    .findMany();
```

---

## Filtering

```ts
const pages =
  await client
    .resource("node--page")
    .where("status", "=", true)
    .findMany();
```

Additional operators:

- =
- !=
- >
- >=
- <
- <=
- CONTAINS
- STARTS_WITH
- ENDS_WITH

---

## Sorting

```ts
.sort("title")

.sort("-created")
```

---

## Pagination

```ts
.page(2)
.limit(25)
```

---

## Single Resource

```ts
const page =
  await client
    .resource("node--page")
    .id(uuid)
    .findOne();
```

---

## Lookup by Slug

```ts
const page =
  await client
    .resource("node--page")
    .slug(slug)
    .findOne();
```

---

## Future Operations

```ts
.count()

.exists(id)

.stream()

.create()

.update()

.delete()
```

---

# Deferred Features

The following are intentionally out of scope for the initial MVP.

- GraphQL
- Offline cache
- Request batching
- Automatic retries
- Preview mode
- Live content updates

---

# Non Goals

CMSJumpstart will not expose raw JSON:API URLs as part of the public API.

CMSJumpstart will not require developers to manually construct query parameter strings.

---

# Success Criteria

A new developer should be able to retrieve Drupal content within five minutes of installation without reading Drupal's JSON:API documentation.

## Resource Resolution

CMSJumpstart exposes friendly resource names.

Example:

```ts
client.resource("page")
```

Internally, CMSJumpstart resolves these to the correct CMS resource.

For Drupal:

```text
page -> node--page
image -> media--image
tags -> taxonomy_term--tags
```

Mappings are generated automatically during project setup through schema discovery.

Developers may override generated mappings when necessary.

The goal is to eliminate CMS-specific naming conventions from application code.