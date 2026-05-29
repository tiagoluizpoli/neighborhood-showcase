## What to build

Implement the resident association approval interface for local Condo Moderators at `/moderation`. Moderators review pending resident assignments for their assigned condominium, view proof documents securely, and approve or reject them.

## Acceptance criteria

- [x] Route loader / tRPC middleware limits access to `/moderation` to approved `MODERATOR` users of that specific condominium.
- [x] List page shows pending resident requests (`Assignments.status = PENDING` and `Assignments.type = RESIDENT`).
- [x] Safe image/document preview modal displaying the resident's legal name, unit number, and proof of residency.
- [x] Approve action changes assignment status to `APPROVED`.
- [x] Reject action prompts for a mandatory rejection reason, sets status to `REJECTED`, and logs reason.
- [x] Integration tests verify access guards and assignment status transitions.


## Blocked by

- [.specify/memory/issues/03_condo_joining_resident.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/03_condo_joining_resident.md)
- [.specify/memory/issues/04_condo_approval_admin.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/04_condo_approval_admin.md)
