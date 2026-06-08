---
type: refactor
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Deepen the public browsing route family so the `Visitor` browsing experience is composed from smaller modules with clearer seams.

Focus on the public vitrine and related public-browsing state orchestration.

## Acceptance Criteria

- [x] The route seam becomes a composition point rather than the home of all policy and rendering details.
- [x] Geolocation and localStorage policy move behind smaller internal modules with clear responsibilities.
- [x] Public browsing behavior remains unchanged unless a separately approved behavior fix is documented.
- [x] Focused route/component tests cover the extracted behavior seams.
- [x] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
