---
type: refactor
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Deepen the Provider Dashboard route family by separating announcement editing, analytics, payment, and condominium-setup flows into clearer modules.

## Acceptance Criteria

- [x] Dashboard route files become materially smaller and more navigable.
- [x] Shared provider-dashboard policies move behind deeper modules rather than remaining inline in route files.
- [x] Behavior remains unchanged unless a separately approved bug fix is documented.
- [x] Focused route/component tests cover extracted modules and critical user flows.
- [x] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
