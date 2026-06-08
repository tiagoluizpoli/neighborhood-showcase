---
type: feature
epic: 05-public-browsing-ui
status: completed
blocked-by: null
---

## What to Build

Replace the intrusive first-load geolocation prompt and large location bars on the home page with a compact location/status control that reflects location confidence accurately.

This issue corrects both behavior and presentation. Visitors should be able to browse first, then improve feed relevance with precise location, approximate region, or manual condominium selection.

## Acceptance Criteria

- [x] Home page does not auto-open the geolocation permission modal on first visit.
- [x] Browser geolocation prompt happens only after an explicit user action, except background refresh after prior grant.
- [x] Large first-viewport geolocation bars are replaced by one compact location/status control.
- [x] The control reflects `unset`, `granted`, `denied`, and `unavailable` states accurately.
- [x] Non-denial geolocation failures do not persist or display as user refusal.
- [x] IP fallback is automatic, transparent, session-only, and used only for coarse regional feed relevance.
- [x] GPS coordinates are stored with `capturedAt` and expire after 24 hours.
- [x] Previously granted GPS can refresh in the background on page load without using `watchPosition()`.
- [x] Refreshed GPS only updates ranking/state after a movement of at least 1 km.
- [x] Feed remains browsable when geolocation is unset, denied, unavailable, or IP fallback fails.
- [x] Manual region selection supports city-first filtering with optional neighborhood refinement.
- [x] Manual condominium selection sets preferred context without hard-filtering the feed by default.
- [x] `Somente este condomínio` remains available as a separate explicit filter.
- [x] Current custom condominium-only modal is replaced by a selector that supports region and condominium choices.
- [x] Default feed ranking follows relevance-first ordering with recency only as final tie-breaker.
- [x] Verified-only can still be used as a hard filter, while verified providers are boosted by default.
- [x] Radius control appears only for fresh GPS confidence and is capped at 25 km.
- [x] Tests cover grant, explicit denial, non-denial failure, stored coordinate reuse, background refresh, IP fallback, manual region filter, and manual condominium context behavior.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
