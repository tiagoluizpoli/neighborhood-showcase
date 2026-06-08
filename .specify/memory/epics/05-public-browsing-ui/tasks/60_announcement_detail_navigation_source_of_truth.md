---
type: feature
epic: 05-public-browsing-ui
status: completed
blocked-by: null
---

## What to Build

Remove the home-page detail preview modal/hybrid behavior and make `/anuncios/:id` the only full announcement detail rendering surface.

## Acceptance Criteria

- [x] Clicking an announcement card navigates to `/anuncios/:id` through router navigation.
- [x] Home route no longer stores or synchronizes announcement detail state.
- [x] Home route no longer renders a duplicate detail preview modal.
- [x] `/anuncios/:id` remains the only detail page for full announcement information.
- [x] `IMPRESSION` tracking fires from the detail page only.
- [x] Browser back navigation returns to the home/feed route without custom `popstate` handling.
- [x] Card contact action does not navigate to detail.
- [x] Provider identity link navigates to `/prestadores/:id` and does not navigate to detail.
- [x] Tests cover card-to-detail navigation, back behavior where practical, and no duplicate impression tracking from the home route.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
