# Slice 12: Announcement Card Redesign

## Parent

PRD-v2-backlog-overhaul (Item 13)

## What to build

Redesign the announcement card component on the public home page with rich provider identity, trust signals, and a primary contact action button.

1. **Card component**: Rebuild the announcement card using the shadcn `Card` component. The card should display:
   - Cover image (4:3 ratio)
   - Title and category
   - Provider identity row: avatar (initials fallback), provider name, verified badge (if applicable), link to provider profile
   - Primary contact action button (e.g., WhatsApp button) directly on the card for quick access
2. **Provider data in API response**: Ensure the public announcement listing API includes provider info (name, avatar URL, verification status, primary contact channel) in the response payload.
3. **Card click**: Clicking the card body (not the contact button) navigates to the dedicated detail page `/anuncios/:id` (implemented in Slice 13).
4. **Visual polish**: Cards must use semantic tokens, feel premium, and align with the `base-lyra` design system.

## Acceptance criteria

- [x] Card displays cover image, title, category, provider identity row, and primary contact button
- [x] Provider avatar shows initials fallback
- [x] Verified badge displays conditionally on the card
- [x] Primary contact button (WhatsApp) is functional directly from the card
- [x] Card click navigates to `/anuncios/:id`
- [x] API response includes provider info (name, avatar, verification, contact)
- [x] Cards render responsively on mobile and desktop
- [x] No hardcoded color classes — strict semantic tokens

## Blocked by

- #39 (Portal/Panel Route Restructuring & Layout Separation)
- #42 (Expanded Contact Channels Schema & Profile Form)
