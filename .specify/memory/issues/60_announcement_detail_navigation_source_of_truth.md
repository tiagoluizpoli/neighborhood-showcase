# Announcement Detail Navigation Source of Truth

## Parent

Follow-up to Slice 13 (`49_announcement_detail_page`) and Issue 59 (`announcement_card_spectrum_inspired_redesign`).

## What to build

Remove the home-page detail preview modal/hybrid behavior and make `/anuncios/:id` the only full announcement detail rendering surface.

## Current problem

The home page currently manages `activeAdId`, pushes `/anuncios/:id` into browser history manually, fetches announcement details, and renders a duplicate detail preview modal. The application also has a real dedicated `/anuncios/:id` route. This creates two detail experiences, duplicated UI, and unclear navigation/analytics ownership.

## Scope

1. Home page card click navigates to `/anuncios/:id` using TanStack Router.
2. Remove home-page `activeAdId` state.
3. Remove home-page `activeAdQuery`.
4. Remove home-page `openAdDetails` and `closeAdDetails` manual `window.history.pushState` logic.
5. Remove home-page `popstate` synchronization for announcement detail state.
6. Remove the duplicate home-page detail preview modal.
7. Keep `/anuncios/:id` as the only full announcement detail rendering surface.
8. Keep `/anuncios/:id` as the single source of truth for `IMPRESSION` tracking.
9. Ensure browser back returns from detail page to the home/feed route naturally.
10. Keep card primary contact action independent from detail navigation.
11. Keep provider identity link independent from detail navigation.

## Out of scope

1. Full detail page visual redesign.
2. Announcement card visual redesign (Issue 59).
3. Home discovery layout restructure (Issue 58).
4. Analytics event model changes beyond preserving single detail-page impression tracking.

## Acceptance criteria

- [ ] Clicking an announcement card navigates to `/anuncios/:id` through router navigation.
- [ ] Home route no longer stores or synchronizes announcement detail state.
- [ ] Home route no longer renders a duplicate detail preview modal.
- [ ] `/anuncios/:id` remains the only detail page for full announcement information.
- [ ] `IMPRESSION` tracking fires from the detail page only.
- [ ] Browser back navigation returns to the home/feed route without custom `popstate` handling.
- [ ] Card contact action does not navigate to detail.
- [ ] Provider identity link navigates to `/prestadores/:id` and does not navigate to detail.
- [ ] Tests cover card-to-detail navigation, back behavior where practical, and no duplicate impression tracking from the home route.

## Blocked by

- None.
