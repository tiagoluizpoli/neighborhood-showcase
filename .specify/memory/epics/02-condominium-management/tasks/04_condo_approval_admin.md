---
type: feature
epic: 02-condominium-management
status: completed
blocked-by: null
---

## What to Build

Implement the condominium approval administration interface for global System Managers at `/admin`. Global admins review pending condominiums, inspect uploaded election convenção proof files, and either approve or reject them.

## Acceptance Criteria

- [x] Route loader / tRPC middleware limits `/admin` to users with the `SYSTEM_MANAGER` role.
- [x] Admin panel lists pending condominiums (`Condominiums.status = PENDING_APPROVAL`).
- [x] Interface enables direct view/rendering of convenção PDF or image files.
- [x] Approve action changes condominium status to `APPROVED` and automatically creates an approved `MODERATOR` assignment for the requesting creator.
- [x] Reject action prompts for a rejection reason, updates status to `REJECTED`, and dispatches email notification to the creator.
- [x] Integration tests verify role guards and correct status/assignment updates on approval/rejection.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
