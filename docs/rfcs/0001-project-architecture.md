# RFC 0001: CMSJumpstart Project Architecture

## Status

Accepted

## Summary

Define the initial repository structure and architectural approach for CMSJumpstart.

## Problem

CMSJumpstart will contain multiple packages that share common tooling, conventions, and dependencies.

Without a defined structure, packages may develop inconsistent build systems, TypeScript configurations, and development workflows.

## Decision

CMSJumpstart will use a pnpm workspace monorepo.

Initial packages:

- @cmsjumpstart/core
- @cmsjumpstart/drupal

Future packages may include:

- @cmsjumpstart/next
- @cmsjumpstart/ui
- @cmsjumpstart/cli

## Principles

- Shared tooling belongs at the repository root.
- Package-specific configuration belongs inside each package.
- Packages should remain independently publishable.
- TypeScript configuration is shared through tsconfig.base.json.
- Features should be added based on real user needs.

## Alternatives Considered

### Separate repositories

Rejected because shared tooling and coordinated releases would become more difficult.

### Single package

Rejected because CMSJumpstart will eventually support multiple integrations.

## Consequences

Benefits:

- Consistent developer experience
- Easier package maintenance
- Independent package releases

Tradeoffs:

- More initial configuration
- More repository complexity