---
type: refactor
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Consolidate Unleash feature flagging logic into a type-safe shared workspace package `@neighborhood-showcase/feature-flags`:
1. Create a new package directory under `packages/feature-flags` with standard `package.json`, `tsconfig.json`, and source structure.
2. Relocate Unleash initialization and helper logic from `apps/server/src/shared/feature-flags.ts` and `apps/web/src/routes/__root.tsx`.
3. Provide two distinct entrypoints:
   - `/server` for node-based server flag evaluation (`initUnleash()`, `isFeatureEnabled()`).
   - `/client` for browser-based React components (`FlagProvider` setup).
4. Define a typed registry: export a `FLAGS` constant mapping (currently empty `as const` object) and a `FlagName` type. All toggle methods and hooks must accept only `FlagName` values to enforce type safety.
5. Reuse Unleash env definitions by importing `@neighborhood-showcase/env` or configure variables appropriately.

## Acceptance Criteria

- [x] A new package `@neighborhood-showcase/feature-flags` exists under `packages/feature-flags`.
- [x] Unleash configuration and checking are unified in this package.
- [x] Entrypoints `/server` and `/client` are correctly resolved.
- [x] Feature toggle check APIs accept only registered keys of the `FlagName` type.
- [x] Compilation, typing, and tests verify feature flags function correctly.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
