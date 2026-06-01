## What to build

Rename project references from `base-fullstack-template` and `@base-fullstack-template` to `neighborhood-showcase` and `@neighborhood-showcase`:
1. Root `package.json` package name and scripts.
2. Package configuration files (`packages/*/package.json`).
3. Application config/package files (`apps/*/package.json`, `apps/desktop/electrobun.config.ts`, `apps/desktop/src/bun/index.ts`).
4. Code import statements in all `.ts`, `.tsx`, and `.json` files.
5. Documentation references in `README.md`, `bts.jsonc`, and SpecKit plans.

## Acceptance criteria

- [x] All `package.json` files updated to rename `base-fullstack-template` to `neighborhood-showcase` and import namespaces to `@neighborhood-showcase`.
- [x] All source imports matching `@base-fullstack-template/*` updated to `@neighborhood-showcase/*`.
- [x] Desktop shell config and title updated to use the new name.
- [x] Documentation files updated.
- [x] Workspace packages resolved via `bun install`.
- [x] All code passes linting (`bun run check`), type-checking (`bun run check-types`), and all tests (`bun run test`) pass.

## Blocked by

- [.specify/memory/issues/15_public_showcase_proximity_refactor.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/15_public_showcase_proximity_refactor.md)
