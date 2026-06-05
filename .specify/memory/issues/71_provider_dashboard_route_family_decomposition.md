# Provider Dashboard Route Family Decomposition

## Parent

Issue 65: Whole Codebase Review Remediation Backlog

## What to build

Deepen the Provider Dashboard route family by separating announcement editing, analytics, payment, and condominium-setup flows into clearer modules.

## Problem

The Provider Dashboard route family currently concentrates too much unrelated behavior inside route files, especially:

- announcement list/render state
- edit-modal state
- analytics display state
- payment renewal flow
- crop/upload orchestration
- condominium setup flow

This creates oversized shallow modules and makes behavior hard to reason about in isolation.

## Likely module targets

- Provider announcement dashboard state module
- Provider announcement editing module
- Provider analytics view module
- Condominium setup flow module

## Acceptance criteria

- [ ] Dashboard route files become materially smaller and more navigable.
- [ ] Shared provider-dashboard policies move behind deeper modules rather than remaining inline in route files.
- [ ] Behavior remains unchanged unless a separately approved bug fix is documented.
- [ ] Focused route/component tests cover extracted modules and critical user flows.
- [ ] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Blocked by

- None - can start after the higher-risk correctness/backend seam issues.

## Progress notes

- 2026-06-05: Created from the architecture review after identifying `panel.dashboard.index.tsx` and `panel.dashboard.condo-setup.tsx` as oversized route-family anchors.
- 2026-06-05: Iteration 2 started by extracting the provider announcement analytics modal behind an internal `panel/` route-family module plus a shared dashboard announcement type, keeping `panel.dashboard.index.tsx` as the composition layer for analytics-display state while preserving existing behavior and adding focused modal coverage.
