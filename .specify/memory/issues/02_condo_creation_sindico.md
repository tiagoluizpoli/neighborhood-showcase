## What to build

Implement the condominium creation flow for Síndicos at `/dashboard/condo-setup`. A provider can request to register a new condominium, uploading their election minutes (Ata de Eleição/Convenção) as proof of administration to MinIO/S3 storage.

## Acceptance criteria

- [ ] Swappable sub-flows on `/dashboard/condo-setup` screen (Síndico Path).
- [ ] Condo creation form collects Name, CEP (with autofill query), administrative Email/Phone, and convenção document file upload.
- [ ] Successfully uploads convenção PDF/Image to configured S3/MinIO bucket.
- [ ] Database record created in `condominiums` with status `PENDING_APPROVAL`.
- [ ] User remains locked on `/dashboard/condo-setup` with pending screen warning and is blocked from navigating to main dashboard.
- [ ] Integration tests verify database insertion and file upload to storage.

## Blocked by

- [.specify/memory/issues/01_auth_cpf_validation.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/01_auth_cpf_validation.md)
