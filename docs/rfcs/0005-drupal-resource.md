# RFC 0005: Drupal Resource API

## Status

Accepted

## Summary

Introduce a DrupalResource abstraction that combines Drupal resource types with query building and request execution.

## Problem

Developers need a simple API for retrieving Drupal content while hiding the complexity of:

- Query construction
- URL generation
- Authentication
- HTTP requests

## Decision

The public API will expose resources.

Example:

```ts
client
  .resource("node--page")
  .include("field_image")
  .limit(10)
  .get();