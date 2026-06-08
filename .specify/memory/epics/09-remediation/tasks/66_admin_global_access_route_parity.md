---
type: bug
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Fix global-admin route parity so the web entry points enforce the same role hierarchy already documented in `CONTEXT.md` and partially enforced on the backend.

This slice is intentionally narrow. It should correct the access-control mismatch without mixing in unrelated UI or architecture refactors.

## Acceptance Criteria

- [x] Web route guards for global admin entry points allow both `SYSTEM_MANAGER` and `ADMINISTRATOR`.
- [x] Current moderator-only logic remains unchanged unless the route is explicitly global-admin scoped.
- [x] Access behavior matches the role hierarchy in `CONTEXT.md`.
- [x] Focused route tests cover `USER`, `SYSTEM_MANAGER`, and `ADMINISTRATOR` behavior for the affected routes.
- [x] `bun run check` and `bun run check-types` pass for the slice.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
