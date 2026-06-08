---
type: feature
epic: 02-condominium-management
status: completed
blocked-by: null
---

## What to Build

Implement the condominium creation flow for Síndicos at `/dashboard/condo-setup`. A provider can request to register a new condominium, uploading their election minutes (Ata de Eleição/Convenção) as proof of administration to MinIO/S3 storage.

## Acceptance Criteria

- [x] Swappable sub-flows on `/dashboard/condo-setup` screen (Síndico Path).
- [x] Condo creation form collects Name, CEP (with autofill query), administrative Email/Phone, and convenção document file upload.
- [x] Successfully uploads convenção PDF/Image to configured S3/MinIO bucket.
- [x] Database record created in `condominiums` with status `PENDING_APPROVAL`.
- [x] User remains locked on `/dashboard/condo-setup` with pending screen warning and is blocked from navigating to main dashboard.
- [x] Integration tests verify database insertion and file upload to storage.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
