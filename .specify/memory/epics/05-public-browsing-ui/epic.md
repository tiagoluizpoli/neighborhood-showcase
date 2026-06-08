---
type: epic
name: "Public Browsing UI"
status: completed
blocked-by: null
---

## About this Epic

Public portal navigation separation, home page discovery layout, announcement card redesign (Spectrum-inspired), detail page as sole source of truth, feed loading states, and backend-managed categories.

## Context

Public browsing routes (/, /anuncios/:id, /prestadores/:id) render a clean public shell. Header/footer are separate from the panel. Announcement cards use a Spectrum-inspired product card pattern. Categories are backend-managed.

## Child Tasks

- [x] [39_portal_panel_route_layout_separation](tasks/39_portal_panel_route_layout_separation.md)
- [x] [56_public_browsing_header_separation](tasks/56_public_browsing_header_separation.md)
- [x] [57_home_location_control_geolocation_confidence_cleanup](tasks/57_home_location_control_geolocation_confidence_cleanup.md)
- [x] [58_home_discovery_layout_first_viewport_cleanup](tasks/58_home_discovery_layout_first_viewport_cleanup.md)
- [x] [59_announcement_card_spectrum_inspired_redesign](tasks/59_announcement_card_spectrum_inspired_redesign.md)
- [x] [60_announcement_detail_navigation_source_of_truth](tasks/60_announcement_detail_navigation_source_of_truth.md)
- [x] [61_home_feed_loading_empty_error_states](tasks/61_home_feed_loading_empty_error_states.md)
- [x] [62_backend_managed_announcement_categories](tasks/62_backend_managed_announcement_categories.md)

---

<!-- INDEX SYNC: After completing or modifying any child task file,
update .specify/memory/index.md in the same turn. Keep the child
task checklist above in sync with actual file statuses. -->
