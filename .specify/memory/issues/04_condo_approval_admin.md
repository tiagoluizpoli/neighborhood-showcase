## What to build

Implement the condominium approval administration interface for global System Managers at `/admin`. Global admins review pending condominiums, inspect uploaded election convenção proof files, and either approve or reject them.

## Acceptance criteria

- [ ] Route loader / tRPC middleware limits `/admin` to users with the `SYSTEM_MANAGER` role.
- [ ] Admin panel lists pending condominiums (`Condominiums.status = PENDING_APPROVAL`).
- [ ] Interface enables direct view/rendering of convenção PDF or image files.
- [ ] Approve action changes condominium status to `APPROVED` and automatically creates an approved `MODERATOR` assignment for the requesting creator.
- [ ] Reject action prompts for a rejection reason, updates status to `REJECTED`, and dispatches email notification to the creator.
- [ ] Integration tests verify role guards and correct status/assignment updates on approval/rejection.

## Blocked by

- [.specify/memory/issues/02_condo_creation_sindico.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/02_condo_creation_sindico.md)
