---
type: feature
epic: 02-condominium-management
status: completed
blocked-by: null
---

## What to Build

Implement the resident association approval interface for local Condo Moderators at `/moderation`. Moderators review pending resident assignments for their assigned condominium, view proof documents securely, and approve or reject them.

## Acceptance Criteria

- [x] Route loader / tRPC middleware limits access to `/moderation` to approved `MODERATOR` users of that specific condominium.
- [x] List page shows pending resident requests (`Assignments.status = PENDING` and `Assignments.type = RESIDENT`).
- [x] Safe image/document preview modal displaying the resident's legal name, unit number, and proof of residency.
- [x] Approve action changes assignment status to `APPROVED`.
- [x] Reject action prompts for a mandatory rejection reason, sets status to `REJECTED`, and logs reason.
- [x] Integration tests verify access guards and assignment status transitions.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
