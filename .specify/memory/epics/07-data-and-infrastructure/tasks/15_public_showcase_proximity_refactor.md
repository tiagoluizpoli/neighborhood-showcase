---
type: refactor
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Refactor public showcase and discovery logic:
1. Update `listPublicAnnouncements` (`apps/server/src/application/use-cases/announcement/list-public-announcements.ts`) to resolve address/location contexts for all announcements.
2. In the main public showcase, render both condominium-linked and external announcements matching the target city/state, sorted by proximity to the visitor.
3. If a visitor filters by a specific condominium, exclude external announcements and announcements from other condominiums.
4. Add a visual warning/badge on the UI to identify external announcements as "External Provider".

## Acceptance Criteria

- [x] Public showcase includes both internal and external announcements for the target city.
- [x] Proximity sorting uses address details from either the condominium address or the provider address.
- [x] Condominium filters exclude external announcements correctly.
- [x] Visual styling badge displayed on external announcements.
- [x] E2E and integration tests verifying showcase retrieval and sorting constraints.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
