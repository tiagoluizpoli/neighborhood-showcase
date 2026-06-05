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
- [ ] Geolocation and localStorage policy move behind smaller internal modules with clear responsibilities.
- [ ] Public browsing behavior remains unchanged unless a separately approved behavior fix is documented.
- [ ] Focused route/component tests cover the extracted behavior seams.
- [ ] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Blocked by

- None - can start after correctness and backend seam fixes if prioritization remains risk-first.

## Progress notes

- 2026-06-05: Created from the architecture review after identifying `_portal.index.tsx` as one of the largest and shallowest route modules in the repo.
