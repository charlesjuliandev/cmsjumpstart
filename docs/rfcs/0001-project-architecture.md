# RFC 0001: CMSJumpstart Project Architecture

## Status

Accepted

## Summary

Define the overall architecture and repository structure for CMSJumpstart.

CMSJumpstart is organized as a pnpm workspace monorepo containing reusable TypeScript packages for building applications with headless CMS platforms.

The architecture separates shared CMS functionality, CMS-specific integrations, and framework-specific integrations so that each layer can evolve independently without duplicating responsibilities.

---

# Problem

Headless CMS projects commonly require similar infrastructure:

* CMS configuration
* Authentication
* API clients
* Query construction
* Request execution
* Response handling
* Framework integration
* Application-level UI patterns

Without a shared architecture, these concerns tend to become tightly coupled inside individual applications.

CMSJumpstart should provide reusable packages with clearly defined responsibilities while allowing developers to adopt only the functionality they need.

---

# Goals

The CMSJumpstart architecture should:

* Provide a consistent monorepo structure.
* Separate shared functionality from CMS-specific functionality.
* Separate CMS integrations from framework integrations.
* Allow packages to be independently developed and published.
* Provide clear boundaries between query construction, serialization, request execution, and response handling.
* Support additional CMS platforms and frameworks in the future.
* Keep framework-specific behavior out of CMS-specific packages where possible.
* Favor small, composable packages over a single large framework.

---

# Repository Structure

The current repository is organized around the following packages:

```text
packages/
  core/
  drupal/
  next/

examples/
  next-app/

rfcs/
```

The current packages are:

### `@cmsjumpstart/core`

Shared CMSJumpstart functionality and foundational configuration.

### `@cmsjumpstart/drupal`

Drupal-specific functionality, including:

* Drupal JSON:API client
* Query building
* Query serialization
* Resource APIs
* Request execution
* Authentication
* Typed response handling
* Relationship handling
* Included-resource resolution

### `@cmsjumpstart/next`

Next.js integration for CMSJumpstart.

The package provides a thin Next.js-oriented layer around the Drupal integration, including:

* `NextCMSClient`
* `NextCMSResource`
* `NextRequestExecutor`
* Next.js request and caching options

### Future Packages

The following packages remain planned rather than currently implemented:

* `@cmsjumpstart/ui`
* CMSJumpstart project creation CLI

---

# Architectural Boundaries

CMSJumpstart separates functionality into several layers.

## Core

The core package contains functionality that is not specific to Drupal or a particular application framework.

It should not contain Drupal-specific API behavior.

---

## CMS Integrations

CMS integrations contain functionality specific to an individual CMS platform.

For Drupal, this includes the JSON:API client, query system, resources, request execution, authentication, and response abstractions.

CMS-specific behavior should remain inside the corresponding integration rather than being duplicated by framework packages.

---

## Framework Integrations

Framework integrations provide framework-specific behavior on top of CMS integrations.

The Next.js package is responsible for integrating CMSJumpstart with Next.js while delegating Drupal-specific behavior to `@cmsjumpstart/drupal`.

The Next.js integration should remain intentionally thin.

---

# Current Request Architecture

The current Drupal and Next.js implementation follows this general relationship:

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

The Next.js integration also provides a `NextRequestExecutor` that extends the Drupal request executor.

`NextCMSClient` creates the Next.js-specific executor and injects it into `DrupalClient`.

This allows the Drupal package to retain responsibility for Drupal behavior while the Next.js package adds framework-specific request behavior such as Next.js cache configuration and revalidation.

---

# Package Independence

Packages should remain independently buildable and publishable.

A package should only depend on lower-level packages when the dependency represents a genuine architectural relationship.

The intended dependency direction is:

```text
@cmsjumpstart/core
        ^
        |
@cmsjumpstart/drupal
        ^
        |
@cmsjumpstart/next
```

Framework-specific packages should not require application-specific code.

---

# Shared Tooling

The repository uses shared tooling at the workspace level where practical.

Common TypeScript configuration is maintained through the shared base TypeScript configuration.

Package-specific configuration belongs inside the package that owns it.

This keeps package builds predictable while avoiding unnecessary duplication.

---

# Design Principles

## Separation of Concerns

Each layer should have one primary responsibility.

For example:

* Query builders construct query intent.
* Serializers convert query state into API parameters.
* Request executors perform HTTP requests.
* Resources provide the developer-facing resource API.
* Responses provide typed access to returned JSON:API data.
* Framework integrations provide framework-specific behavior.

---

## CMS-Agnostic Core

Shared functionality should not depend on Drupal implementation details.

Drupal-specific behavior belongs in `@cmsjumpstart/drupal`.

---

## Thin Framework Integrations

Framework packages should adapt CMSJumpstart functionality to framework conventions rather than reimplementing CMS behavior.

For example, `@cmsjumpstart/next` delegates Drupal resource operations to the Drupal package while adding Next.js-specific request behavior.

---

## Independent Evolution

Packages should be able to evolve independently where their responsibilities differ.

A change to Next.js caching behavior should not require changes to the Drupal query builder.

Likewise, a change to Drupal JSON:API filtering should not require changes to the Next.js integration.

---

## Production-Oriented Defaults

The architecture should favor predictable behavior, explicit configuration, typed APIs, and clear failure modes.

Features should be added based on real application requirements rather than speculative abstraction.

---

# Alternatives Considered

## Separate Repositories

Each package could live in its own repository.

This was rejected because it would make coordinated development and testing more difficult while increasing repository and tooling overhead.

---

## Single Package

All functionality could be combined into one CMSJumpstart package.

This was rejected because it would tightly couple CMS integrations, framework integrations, and shared functionality.

A developer using Drupal without Next.js should not need to depend on Next.js-specific functionality.

---

## Framework-Specific CMS Implementations

Another option would be to implement Drupal support independently inside each framework package.

This was rejected because it would duplicate CMS behavior and make the implementations diverge over time.

The current architecture instead keeps Drupal behavior in `@cmsjumpstart/drupal` and allows framework packages to build thin adapters around it.

---

# Consequences

This architecture provides:

* Clear package responsibilities.
* Reusable Drupal functionality.
* A thin Next.js integration.
* Independent package development.
* A foundation for additional CMS integrations.
* A foundation for additional framework integrations.
* Easier testing of individual layers.
* Reduced duplication between framework integrations.

The tradeoffs include:

* Additional package boundaries.
* More initial repository configuration.
* Coordination between packages when public APIs change.
* More architectural decisions than a single-package implementation.

These tradeoffs are intentional because CMSJumpstart is intended to grow into a reusable toolkit rather than remain tied to a single application.

---

# Future Considerations

The architecture leaves room for future packages and integrations, including:

* `@cmsjumpstart/ui`
* A CMSJumpstart project creation CLI
* Additional CMS integrations
* Additional framework integrations
* Shared application patterns

Future packages should follow the same principle of keeping CMS-specific, framework-specific, and shared functionality separated.

---

# Decision

CMSJumpstart will use a pnpm workspace monorepo with separate packages for shared functionality, CMS integrations, and framework integrations.

The current implementation establishes:

* `@cmsjumpstart/core` for shared foundational functionality.
* `@cmsjumpstart/drupal` for Drupal integration.
* `@cmsjumpstart/next` for Next.js integration.

UI components, project-generation tooling, and additional integrations remain future work.

The architecture will evolve as implementation requirements become clearer, but new functionality should preserve these package boundaries wherever practical.
