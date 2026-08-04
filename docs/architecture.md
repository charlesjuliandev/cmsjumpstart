# CMSJumpstart Architecture

## Goal

CMSJumpstart provides production-ready tooling for building modern applications with headless CMS platforms.

## Packages

### @cmsjumpstart/core

Shared framework utilities.

Responsibilities:

- Configuration
- Environment validation
- Error handling
- Logging
- Plugin system

### @cmsjumpstart/drupal

Drupal-specific functionality.

Responsibilities:

- JSON:API client
- Entity helpers
- Authentication
- Drupal integrations

### @cmsjumpstart/next

Next.js helpers.

Responsibilities:

- Routing
- Metadata
- Caching
- Server components

### @cmsjumpstart/ui

Accessible UI components.

Responsibilities:

- Layout
- Navigation
- Content components
- WCAG patterns