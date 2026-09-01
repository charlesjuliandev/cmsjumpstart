# CMSJumpstart

Production-ready starters for building modern web applications with headless CMS platforms.

CMSJumpstart provides reusable TypeScript packages for connecting applications to headless CMS platforms while keeping CMS-specific networking, querying, authentication, and response handling out of application code.

## Vision

CMSJumpstart helps developers build modern web applications with Next.js and headless CMS platforms without starting from scratch.

The project focuses on:

* Type-safe CMS data access
* Predictable query construction
* Framework-friendly integrations
* Production-oriented defaults
* Accessibility-conscious application starters
* Extensible architecture for additional CMS platforms

## Current Status

🚧 Early development

The core Drupal and Next.js integration is actively being developed.

The repository currently includes working packages for:

* CMS configuration
* Drupal JSON:API querying
* Drupal authentication and request execution
* Drupal resource and response handling
* Next.js integration
* A production-oriented Next.js example application

APIs may continue to evolve before the first stable release.

## Packages

### `@cmsjumpstart/core`

Shared CMS configuration and foundational functionality.

### `@cmsjumpstart/drupal`

Drupal JSON:API integration including:

* Drupal client
* Resource queries
* Query serialization
* Authentication
* Request execution
* JSON:API response handling
* Relationship and included-resource handling

### `@cmsjumpstart/next`

Next.js integration for CMSJumpstart.

The package provides a thin Next.js-oriented layer around the CMSJumpstart Drupal client, including support for Next.js request and caching behavior.

### `@cmsjumpstart/ui`

Planned shared UI components and application patterns.

### CLI

A CMSJumpstart project creation CLI is planned for a future release.

## Requirements

* Node.js 22+
* pnpm 11+

## Quick Start

Clone the repository and install dependencies:

```bash
pnpm install
```

The repository includes a working Next.js example application:

```bash
cd examples/next-app
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Configure the required Drupal environment variables:

```env
DRUPAL_BASE_URL=https://your-drupal-site.example

HTAUTH_U=your-username
HTAUTH_P=your-password

CONSUMERUUID=your-consumer-id
UP_API_KEY=your-api-key
```

Start the development server:

```bash
pnpm dev
```

The example application will start using the Drupal JSON:API endpoint configured by the application.

## Drupal Requirements

The Next.js example expects a Drupal installation with JSON:API enabled.

The example currently retrieves Drupal `page` nodes through:

```text
/jsonapi/node/page
```

The CMSJumpstart Drupal integration represents this resource as:

```text
node--page
```

The example requests the following fields:

```text
title
body
```

and retrieves the five most recently created pages.

Your Drupal installation must therefore expose the corresponding JSON:API resource and fields.

## Authentication

The example supports the authentication headers required by the configured Drupal API gateway.

The current example uses:

* HTTP Basic Authentication
* `X-Consumer-ID`
* `api-key`

Authentication values are supplied through environment variables and are not committed to the repository.

Required variables:

```env
HTAUTH_U=
HTAUTH_P=
CONSUMERUUID=
UP_API_KEY=
```

The application also requires:

```env
DRUPAL_BASE_URL=
```

The example intentionally fails with a clear configuration error when required environment variables are missing rather than silently falling back to an invalid or placeholder Drupal URL.

## Development

From the repository root:

```bash
pnpm install
```

Run the test suite:

```bash
pnpm test
```

Build the packages:

```bash
pnpm build
```

Run the Next.js example:

```bash
cd examples/next-app
pnpm dev
```

Run the Next.js example typecheck:

```bash
pnpm typecheck
```

Build the Next.js example for production:

```bash
pnpm build
```

## Architecture

CMSJumpstart separates CMS querying from request execution and framework integration.

The current high-level architecture is:

```text
Next.js Application
        |
        v
@cmsjumpstart/next
        |
        v
NextCMSClient
        |
        v
DrupalClient
        |
        v
DrupalResource
        |
        v
DrupalQueryBuilder
        |
        v
DrupalQuerySerializer
        |
        v
RequestExecutor
        |
        v
Drupal JSON:API
```

The Next.js integration remains intentionally thin. Drupal-specific behavior stays in the Drupal package rather than being duplicated inside the Next.js integration.

## Querying Drupal

A basic Drupal resource query looks like:

```ts
const pages = await client
  .resource("node--page")
  .fields("title", "body")
  .sort("-created")
  .limit(5)
  .get();
```

Queries support fluent composition for common Drupal JSON:API operations including:

* Field selection
* Includes
* Filtering
* Sorting
* Pagination

Example:

```ts
const pages = await client
  .resource("node--page")
  .include("field_image")
  .filter("status", true)
  .sort("-created")
  .limit(10)
  .get();
```

## Responses

CMSJumpstart provides typed response and resource abstractions around Drupal JSON:API responses.

Responses support:

* Resource access
* Included resources
* Relationship data
* Typed attributes
* Pagination
* Response-oriented navigation

The goal is to allow application code to work with typed CMS content without manually parsing JSON:API responses.

## Next.js Example

The example application demonstrates a production-oriented integration using:

* Next.js
* React
* React Aria Components
* Tailwind CSS
* CMSJumpstart
* Drupal JSON:API

The example includes:

* Environment validation
* Typed Drupal data handling
* Error boundaries
* Skeleton loading UI
* Keyboard-accessible interactions
* Visible keyboard focus states
* Reduced-motion support
* Accessible semantic HTML
* Next.js request handling

The example is intentionally small so that developers can use it as a starting point rather than having to remove application-specific boilerplate from a larger starter.

## Project Structure

```text
packages/
  core/
  drupal/
  next/

examples/
  next-app/

rfcs/
```

## RFCs

Architectural decisions and proposed changes are documented in the `rfcs/` directory.

RFCs are used to document:

* Architectural decisions
* Public API design
* Query behavior
* Request execution
* Future features

Because CMSJumpstart is still under active development, RFCs marked `Proposed` may describe future architecture rather than currently implemented functionality.

## Contributing

CMSJumpstart is currently in early development.

Before contributing significant architectural changes, review the relevant RFCs and existing package implementations.

## License

MIT
