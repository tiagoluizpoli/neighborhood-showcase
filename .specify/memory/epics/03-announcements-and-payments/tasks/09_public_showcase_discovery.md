---
type: feature
epic: 03-announcements-and-payments
status: completed
blocked-by: null
---

## What to Build

Implement the public showcase discovery interface at `/` (Vitrine). It automatically requests browser geolocation to sort and prioritize nearby listings, displays them in a rich grid with filtering options, and supports detail previews with click-tracking.

## Acceptance Criteria

- [x] Vitrine requests geolocation on first load; fallback displays a manual condominium/city selector modal.
- [x] Sorts active announcements based on proximity to the user's geolocated or selected condominium.
- [x] Grid filters include text search, category tabs, and a "Verified Residents Only" badge toggle.
- [x] Clicking a listing opens a detail drawer (mobile) or modal (desktop) displaying all ad fields and syncs the URL to `/anuncios/:id`.
- [x] Clicking contact actions (WhatsApp/Instagram/PDF Catalog) calls a backend tracking endpoint (`/api/analytics/track`) to increment analytics clicks before routing.
- [x] Component tests for geolocation mock states, grid sorting, and detail modal visibility.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
