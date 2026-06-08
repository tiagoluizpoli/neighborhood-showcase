---
type: feature
epic: 02-condominium-management
status: completed
blocked-by: null
---

## What to Build

Implement the condominium joining flow for local resident providers on the `/dashboard/condo-setup` screen. Providers search for registered approved condominiums, enter their unit details, and upload an optional proof of residency.

## Acceptance Criteria

- [x] Swappable sub-flows on `/dashboard/condo-setup` screen (Resident Path).
- [x] Condo search auto-complete searching by Name, City, or CEP (lists approved condos).
- [x] Association form collects unit details and uploads an optional residency proof file to S3/MinIO.
- [x] Creates a record in the `assignments` table with type `RESIDENT` and status `PENDING`.
- [x] User remains on the setup setup screen displaying pending status for the condominium request.
- [x] Integration tests verify the association request creation.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
