# @cmsjumpstart/core

Core configuration utilities for CMSJumpstart, a TypeScript toolkit for building applications with headless CMS platforms.

## Installation

```bash
pnpm add @cmsjumpstart/core
```

## Usage

Create a shared CMSJumpstart configuration with sensible defaults:

```ts
import { createCMSConfig } from "@cmsjumpstart/core";

const config = createCMSConfig({
  site: {
    name: "Course Catalog",
    url: "https://catalog.example.com",
  },
  cms: {
    provider: "drupal",
    url: "https://drupal.example.com",
  },
  features: {
    search: true,
  },
});
```

`createCMSConfig` defaults the `search` and `preview` feature flags to `false`. Explicitly supplied feature values override those defaults.

## Configuration types

- `CMSJumpstartConfig` — site information, CMS provider and URL, and optional feature flags.
- `CMSProvider` — supported provider identifiers: `drupal`, `wordpress`, `contentful`, and `strapi`.

These provider identifiers describe configuration options; they do not imply that every provider has an implemented integration in this package.

## License

MIT. See the accompanying `LICENSE` file.