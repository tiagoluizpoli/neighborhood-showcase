# Public Vitrine Route Family Decomposition

## Parent

Issue 65: Whole Codebase Review Remediation Backlog

## What to build

Deepen the public browsing route family so the `Visitor` browsing experience is composed from smaller modules with clearer seams.

Focus on the public vitrine and related public-browsing state orchestration.

## Problem

The current public browsing route family mixes too many concerns in oversized route modules, especially:

- geolocation policy
- localStorage state
- nearby-condominium prompting
- region filtering
- query orchestration
- modal/sheet state
- rendering

This reduces locality and makes the route seam shallow.

## Likely module targets

- Public location-selection module
- Public filter/query-state module
- Public browsing view fragments

## Acceptance criteria

- [ ] The route seam becomes a composition point rather than the home of all policy and rendering details.
- [x] Geolocation and localStorage policy move behind smaller internal modules with clear responsibilities.
- [x] Public browsing behavior remains unchanged unless a separately approved behavior fix is documented.
- [x] Focused route/component tests cover the extracted behavior seams.
- [x] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Blocked by

- None - can start after correctness and backend seam fixes if prioritization remains risk-first.

## Progress notes

- 2026-06-05: Created from the architecture review after identifying `_portal.index.tsx` as one of the largest and shallowest route modules in the repo.
- 2026-06-05: Iteration 2 extracted the public vitrine geolocation/localStorage seam into internal route-family modules (`portal/-public-vitrine-location*`), kept browse behavior unchanged, reduced `_portal.index.tsx` from 1326 lines to 864 lines, and passed focused geolocation/home-layout coverage plus full `bun run test`, `bun run check-types`, and `bun run check`. The next Issue 70 slice should target filter/query-state and rendering fragments so the route becomes a thinner composition point.
- 2026-06-05: Iteration 3 extracted the public vitrine filter/query-state seam into internal route-family modules (`portal/-public-vitrine-filters*`), moved desktop/mobile filter and location surfaces behind dedicated modules, reduced `_portal.index.tsx` from 864 lines to 591 lines, and added focused query-state coverage plus refreshed geolocation/home-layout coverage. Public browse behavior stayed unchanged, and `bun run test`, `bun run check-types`, and `bun run check` all passed. The next Issue 70 slice should target announcement-grid/empty-state view fragments to finish thinning the route seam.
