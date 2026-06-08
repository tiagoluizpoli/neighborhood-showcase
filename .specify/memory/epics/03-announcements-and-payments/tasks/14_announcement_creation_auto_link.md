---
type: feature
epic: 03-announcements-and-payments
status: completed
blocked-by: null
---

## What to Build

Refactor announcement creation and editing:
1. Update the announcement creation use case (`apps/server/src/application/use-cases/announcement/create-announcement.ts`) to validate and save `providerLocationId` instead of `condominiumId`.
2. Update the frontend announcement creation page (`apps/web/src/routes/dashboard.anuncios.novo.tsx`) to auto-link the announcement if the provider has exactly 1 approved `provider_location`.
3. If the provider has multiple approved `provider_location` records (e.g., they work in multiple condominiums), display a dropdown in the UI forcing them to select which location context this announcement belongs to.
4. Adapt editing use cases and components to match the new schema.

## Acceptance Criteria

- [x] Announcements are saved in database with the correct `providerLocationId`.
- [x] Single-location providers are not prompted to choose a location context.
- [x] Multi-location providers are prompted to choose, and the selection is sent to the server.
- [x] Integration tests for creating/updating announcements with single/multiple locations.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
