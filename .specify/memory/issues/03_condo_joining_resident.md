## What to build

Implement the condominium joining flow for local resident providers on the `/dashboard/condo-setup` screen. Providers search for registered approved condominiums, enter their unit details, and upload an optional proof of residency.

## Acceptance criteria

- [ ] Swappable sub-flows on `/dashboard/condo-setup` screen (Resident Path).
- [ ] Condo search auto-complete searching by Name, City, or CEP (lists approved condos).
- [ ] Association form collects unit details and uploads an optional residency proof file to S3/MinIO.
- [ ] Creates a record in the `assignments` table with type `RESIDENT` and status `PENDING`.
- [ ] User remains on the setup setup screen displaying pending status for the condominium request.
- [ ] Integration tests verify the association request creation.

## Blocked by

- [.specify/memory/issues/02_condo_creation_sindico.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/02_condo_creation_sindico.md)
