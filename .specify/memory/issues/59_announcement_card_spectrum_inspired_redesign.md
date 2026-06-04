# Announcement Card Spectrum-Inspired Redesign

## Parent

Follow-up to Slice 12 (`48_announcement_card_redesign`) and Issue 58 (`home_discovery_layout_first_viewport_cleanup`).

## What to build

Redesign the public announcement card using the Spectrum UI Product Card as a visual reference, adapted for neighborhood announcements instead of ecommerce products.

Reference: https://ui.spectrumhq.in/docs/product-card

## Current problem

The current announcement card is functionally complete but visually and structurally noisy. It prioritizes category/location metadata above the offer, duplicates verified status, stacks badges over the image, and keeps the card implementation inline inside the large home route.

## Design direction

Use the Spectrum Product Card pattern as inspiration:

1. Image-led repeated card rhythm.
2. Clear offer-first hierarchy.
3. Compact metadata.
4. Strong title and short description.
5. Primary action visible on the card.
6. Polished grid density.

Do not copy the ecommerce card literally. Neighborhood announcements may be services, products, donations, events, or jobs, so the card must not use ecommerce-only language such as "Add to Cart".

## Information hierarchy

Visitors should understand the card in this order:

1. What is being offered: image and title.
2. Who offers it: provider avatar/name.
3. Whether the provider is trustworthy/relevant: verified badge and local/proximity context.
4. How to act: one primary contact action.
5. Extra relevance: category, price/value, city/neighborhood.

## Scope

1. Extract the card from `_portal.index.tsx` into a reusable public `AnnouncementCard` component.
2. Type props from the public announcement list item shape.
3. Keep the whole card clickable to the detail page.
4. Ensure provider identity links to `/prestadores/:id` and stops card navigation.
5. Ensure contact action stops card navigation and tracks contact clicks.
6. Use one primary card action only:
   - prefer WhatsApp
   - else phone
   - else email
   - else `Detalhes`
7. Keep all secondary contact/social links for detail/profile pages.
8. Show price/value prominently when present.
9. Omit price placeholder text when no explicit price exists.
10. Move `Morador verificado` trust signal near provider identity instead of using a large image overlay.
11. Avoid stacking multiple top-corner image badges.
12. Keep image clean unless one strong status needs an overlay.
13. Use proximity/location text only when confidence allows:
   - fresh GPS: approximate distance may be shown
   - confirmed condominium: `No seu condomínio` or equivalent
   - stored GPS while refreshing: no exact distance
   - IP fallback: `Região aproximada`, no exact distance
   - no signal: city/neighborhood only
14. Treat external providers neutrally with city/neighborhood context, not as warning-like badge copy.
15. Add visible hover/focus treatment.
16. Make card navigation keyboard-accessible.

## Out of scope

1. Full home-page layout restructure (Issue 58).
2. Detail page redesign.
3. Provider profile redesign.
4. Multiple card contact/social icons.
5. New review/rating system.
6. Ecommerce cart behavior.

## Acceptance criteria

- [x] `AnnouncementCard` is extracted from the home route into a reusable component.
- [x] Card uses a Spectrum-inspired image-led layout adapted for announcements.
- [x] Offer/title hierarchy appears before administrative metadata.
- [x] Provider identity is visible and links to `/prestadores/:id`.
- [x] Verified trust signal appears near provider identity and is not duplicated as noisy image badges.
- [x] Card shows exactly one primary action: WhatsApp, phone, email, or details fallback.
- [x] Price/value is visually prominent when present and absent gracefully when missing.
- [x] Whole-card detail navigation works and is keyboard-accessible.
- [x] Contact and provider links do not trigger detail navigation.
- [x] Location/proximity text follows Issue 57 confidence rules.
- [x] Card avoids warning-style treatment for external providers.
- [x] Focused tests cover card navigation, provider link, primary contact fallback, and contact click tracking.

## Blocked by

- Issue 57: Home Location Control & Geolocation Confidence Cleanup
- Issue 58: Home Discovery Layout & First Viewport Cleanup
