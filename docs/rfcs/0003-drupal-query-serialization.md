# RFC 0003: Drupal Query Serialization

## Status

Accepted

## Summary

Define how CMSJumpstart converts DrupalQueryBuilder state into Drupal JSON:API query parameters.

## Problem

Drupal JSON:API uses a query string based API.

Example:
`/jsonapi/node/page?include=field_image&page[limit]=10&sort=-created`


Developers should not manually construct these parameters.

CMSJumpstart should provide a predictable conversion layer.

## Decision

Query building and query serialization will remain separate responsibilities.

DrupalQueryBuilder:
- Stores query intent.
- Provides fluent developer API.
- Does not know URL formats.

DrupalQuerySerializer:
- Converts query state into Drupal JSON:API parameters.
- Handles Drupal-specific parameter naming.

## Supported Parameters (MVP)

### Includes

Builder:

```ts
.include("field_image")