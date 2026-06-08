---
type: refactor
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Deepen the moderation and admin route family so global-admin and moderator surfaces are composed from smaller, role-aware modules instead of giant route files.

## Acceptance Criteria

- [x] Role-aware route entry points stay clear and behavior-preserving.
- [x] Admin and moderation concerns are separated into deeper modules by shared seam.
- [x] Oversized route files become materially smaller and easier to review.
- [x] Focused route/component tests cover role behavior and the extracted submodules.
- [x] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
