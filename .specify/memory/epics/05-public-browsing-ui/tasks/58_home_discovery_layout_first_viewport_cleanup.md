---
type: feature
epic: 05-public-browsing-ui
status: completed
blocked-by: null
---

## What to Build

Replace the centered, stacked home-page browsing layout with a full-width discovery layout that uses available desktop space, reduces first-viewport crowding, and keeps the announcement feed visible quickly.

This issue focuses on layout and page structure. Header separation is tracked in Issue 56. Location-control behavior is tracked in Issue 57.

## Acceptance Criteria

- [x] Home page no longer constrains the entire browsing experience to a centered `max-w-6xl` column.
- [x] A compact hero band exists above discovery controls.
- [x] Discovery controls and the first announcement row are visible quickly on common laptop viewports.
- [x] `#explorar`, `#como-funciona`, and `#anunciar` section targets exist and match the public header anchors.
- [x] Search, location/status, categories, and filters are grouped into one compact discovery controls area.
- [x] Desktop controls are visible inline without large full-width control bars.
- [x] Mobile secondary filters use a sheet/drawer instead of stacking all controls above the feed.
- [x] No public sort dropdown is introduced in the MVP layout cleanup.
- [x] Radius control is not shown as a large full-width section and only appears when fresh GPS is active.
- [x] Announcement grid uses denser responsive columns while preserving card readability.
- [x] `#anunciar` renders as a full-width CTA band, not a card.
- [x] Provider CTA includes `Anunciar serviço` and `Já tem conta? Entrar` actions with correct auth-aware routing.
- [x] Header does not add an extra primary provider CTA button beyond the `Anunciar` anchor.
- [x] `#como-funciona` renders as a compact Visitor-first 3-step section without cards or long marketing copy.
- [x] Layout avoids nested cards and oversized full-width alert/control surfaces.
- [x] Visual/regression tests or route-level UI assertions cover the main home-page layout states.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
