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
- 2026-06-05: Iteration 3 continued with the provider dashboard edit-image crop/upload seam extraction, moving preview/upload/crop orchestration into an internal `panel/` module while keeping edit validation and announcement update behavior in `panel.dashboard.index.tsx`; added direct focused coverage for the extracted image field.
- 2026-06-05: Iteration 4 continued by extracting the remaining edit-form fields behind an internal `panel/` module, leaving modal shell/state/mutation behavior in `panel.dashboard.index.tsx` while moving category/contact/verification rendering out of the route; added direct focused coverage for the extracted form fields.
- 2026-06-05: Iteration 5 continued by extracting the remaining provider-dashboard edit modal shell/state/mutation block into an internal `panel/` module, leaving `panel.dashboard.index.tsx` to compose route-level dashboard state while direct focused coverage now exercises the extracted modal surface too.
- 2026-06-05: Iteration 6 continued by extracting the resident condominium-setup subflow into an internal `panel/` route-family module, moving condo search/selection, proof upload, and assignment-request orchestration out of `panel.dashboard.condo-setup.tsx` while preserving onboarding behavior; added direct focused coverage for the extracted resident flow.
- 2026-06-05: Iteration 7 continued by extracting the external condominium-setup subflow into an internal `panel/` route-family module, moving external CEP lookup, address form state, and registration orchestration out of `panel.dashboard.condo-setup.tsx` while preserving onboarding behavior; added direct focused coverage for the extracted external flow.
- 2026-06-05: Iteration 8 continued by extracting the remaining condo-setup status panels and Síndico form into internal `panel/` route-family modules, shrinking `panel.dashboard.condo-setup.tsx` to 170 lines while preserving selection, resident, and external behavior; added focused coverage for the new status-panels and sindico-flow modules and passed `bun run test`, `bun run check-types`, and `bun run check` (with the existing web chunk-size warning still non-blocking).
- 2026-06-05: Iteration 9 continued by extracting the provider dashboard payment renewal flow into an internal `panel/` route-family module, shrinking `panel.dashboard.anuncios.$id.pagamento.tsx` to a thin wrapper while preserving Pix generation, polling, countdown, copy, success, and error behavior; added focused payment-flow coverage and passed `bun run test`, `bun run check-types`, and `bun run check` (with the existing web chunk-size warning still non-blocking). The remaining dashboard index list/render-state seam still needs extraction.
- 2026-06-05: Iteration 10 continued by extracting the provider dashboard announcement card and empty-state render fragments into an internal `panel/` route-family module, trimming `panel.dashboard.index.tsx` further while preserving dashboard tab behavior, payment actions, edit actions, and analytics entry points; added focused announcement-card coverage and passed `bun run test`, `bun run check-types`, and `bun run check` (with the existing web chunk-size warning still non-blocking). The remaining dashboard index list/state orchestration still needs extraction.
- 2026-06-05: Iteration 11 continued by extracting the provider dashboard announcement tab/list orchestration into an internal `panel/` route-family module, leaving `panel.dashboard.index.tsx` with the route shell, stats, charts, and modal wiring while preserving dashboard tab behavior, payment actions, edit actions, and analytics entry points; added focused announcement-list coverage and passed `bun run test`, `bun run check-types`, and `bun run check` (with the existing web chunk-size warning still non-blocking). The remaining dashboard route still contains stats/charts/state seams for a later slice.
- 2026-06-05: Iteration 12 continued by extracting the provider dashboard performance overview into an internal `panel/` route-family module, moving the stats cards, period controls, and chart loading/error state out of `panel.dashboard.index.tsx` while preserving the dashboard shell, announcement list, and modal wiring; added focused performance-overview coverage and passed `bun test apps/web/src/routes/panel/-provider-dashboard-performance-overview.test.tsx`, `bun run test`, `bun run check-types`, and `bun run check`. The remaining dashboard route still contains the route shell and state seams for a later slice.
- 2026-06-05: Iteration 13 continued by extracting the provider dashboard header and create-action banner into an internal `panel/` route-family module, leaving `panel.dashboard.index.tsx` focused on route state, loading/error handling, and the extracted dashboard modules; added focused header coverage and passed `bun test apps/web/src/routes/panel/-provider-dashboard-header.test.tsx`, `bun run test`, `bun run check-types`, and `bun run check`. The remaining dashboard route still contains the route shell and state seams for a later slice.
- 2026-06-05: Iteration 14 continued by extracting the provider dashboard loading/error/null shell boundary into an internal `panel/` route-family module, keeping the route focused on state orchestration and the extracted dashboard modules; added focused shell-boundary coverage and passed `bun test apps/web/src/routes/panel/-provider-dashboard-shell-boundary.test.tsx`, `bun run test`, `bun run check-types`, and `bun run check`. The remaining dashboard route still contains the route shell and state seams for a later slice.
