# Home Discovery Layout & First Viewport Cleanup

## Parent

PRD-v2-backlog-overhaul follow-up for the public home page.

## What to build

Replace the centered, stacked home-page browsing layout with a full-width discovery layout that uses available desktop space, reduces first-viewport crowding, and keeps the announcement feed visible quickly.

This issue focuses on layout and page structure. Header separation is tracked in Issue 56. Location-control behavior is tracked in Issue 57.

## Current problem

The home page currently uses a centered `max-w-6xl` container for the entire browsing experience. Location state, denied-location banners, search, filters, category pills, and the announcement grid are stacked vertically. This leaves unused side space on desktop and pushes the announcement grid too far down the page.

## Scope

1. Move the home page from a centered container layout to a full-width discovery layout.
2. Add a compact hero band above discovery controls.
3. Keep the hero compact enough that discovery controls and the first announcement row appear quickly on common laptop screens.
4. Add or preserve home-page section targets:
   - `#explorar`
   - `#como-funciona`
   - `#anunciar`
5. Page order:
   - Public header
   - Compact hero
   - `#explorar`: discovery controls and announcement feed
   - `#como-funciona`: short 3-step explanation
   - `#anunciar`: provider CTA section
   - Footer
6. Group search, location status, category filters, verified toggle, condominium filter, and future manual area filters into one compact discovery controls area.
7. Desktop controls:
   - search prominent but not oversized
   - location/status control inline near search
   - category pills in a horizontal row
   - verified/condominium toggles as compact controls
   - advanced/overflow controls behind a `Filtros` action if needed
8. Mobile controls:
   - search and location/status visible
   - categories horizontally scrollable
   - secondary filters available through a sheet/drawer opened by `Filtros`
9. Make the announcement grid denser and responsive:
   - mobile: 1 column
   - small tablet: 2 columns
   - desktop: 3 or 4 columns depending available width
   - wide desktop: up to 4 columns unless card readability remains strong at 5
10. Keep announcement cards readable with 4:3 imagery, provider identity, verified status, and primary contact action visible.
11. Keep sorting implicit for MVP. Do not add a visible sort dropdown in the first home layout cleanup.
12. Verified-only remains a compact filter:
   - off by default
   - verified providers are still boosted in ranking by default
   - when enabled, it becomes a hard filter
13. Radius control is treated as an advanced filter and appears only when fresh GPS is active.
14. `#anunciar` is a full-width provider CTA band, not a centered floating card.
15. Provider CTA content:
   - headline: `Anuncie para quem mora perto`
   - concise supporting copy about publishing services/products to nearby residents
   - primary CTA: `Anunciar serviço`
   - secondary link/text: `Já tem conta? Entrar`
16. Provider CTA routing:
   - unauthenticated new Provider: `/auth?tab=signup`
   - unauthenticated returning Provider: `/auth?tab=signin`
   - authenticated Provider: `/panel/dashboard`
17. Public header uses `Anunciar` as an anchor link only, not a second primary header button. Header right action remains `Entrar` or `Painel`.
18. `#como-funciona` is a compact Visitor-first explanation section:
   - full-width or unframed section, not cards
   - three compact steps on desktop
   - stacked steps on mobile
   - small lucide icons
   - no long marketing paragraphs
19. `#como-funciona` content:
   - `Explore perto de você`: browse by region, condominium, category, or search
   - `Confira quem anuncia`: review provider identity, verification, location context, and details
   - `Fale direto com o prestador`: contact through WhatsApp/phone/email or view the provider profile
20. Add a small Provider note under the Visitor steps: `Quer anunciar? Publique seu serviço no painel e apareça para moradores próximos.`

## Out of scope

1. Public header behavior and route split (Issue 56).
2. Geolocation state machine and error handling (Issue 57).
3. Full announcement card redesign beyond density/readability adjustments.
4. New provider directory page.
5. Marketing-heavy landing page redesign.
6. Public sort dropdown or explicit sorting controls.

## Acceptance criteria

- [x] Home page no longer constrains the entire browsing experience to a centered `max-w-6xl` column.
- [x] A compact hero band exists above discovery controls.
- [x] Discovery controls and the first announcement row are visible quickly on common laptop viewports.
- [x] `#explorar`, `#como-funciona`, and `#anunciar` section targets exist and match the public header anchors.
- [x] Search, location/status, categories, and filters are grouped into one compact discovery controls area.
- [x] Desktop controls are visible inline without large full-width control bars.
- [x] Mobile secondary filters use a sheet/drawer instead of stacking all controls above the feed.
- [ ] No public sort dropdown is introduced in the MVP layout cleanup.
- [x] Radius control is not shown as a large full-width section and only appears when fresh GPS is active.
- [ ] Announcement grid uses denser responsive columns while preserving card readability.
- [ ] `#anunciar` renders as a full-width CTA band, not a card.
- [ ] Provider CTA includes `Anunciar serviço` and `Já tem conta? Entrar` actions with correct auth-aware routing.
- [ ] Header does not add an extra primary provider CTA button beyond the `Anunciar` anchor.
- [x] `#como-funciona` renders as a compact Visitor-first 3-step section without cards or long marketing copy.
- [ ] Layout avoids nested cards and oversized full-width alert/control surfaces.
- [ ] Visual/regression tests or route-level UI assertions cover the main home-page layout states.

## Blocked by

- None.

## Iteration 3 Notes

- Started Issue 58 by widening the home-page shell, removing the old `max-w-6xl` constraint, and introducing a compact hero band above discovery controls.
- Added route-level UI assertions covering the wider shell, preserved section anchors, and new hero content.
- Remaining work: compact discovery controls layout, denser feed viewport behavior, compact `#como-funciona`, full-width `#anunciar` CTA band, and mobile secondary-filter sheet behavior.

## Iteration 4 Notes

- Grouped search, location status, category pills, desktop toggles, and radius controls into one compact discovery-controls block under `#explorar`.
- Added mobile-only `Filtros` sheet so secondary filters no longer stack above the feed on small screens.
- Removed the old standalone full-width radius block and kept radius controls embedded inside discovery filters only when fresh GPS is active.
- Remaining work: denser announcement grid, compact visitor-first `#como-funciona`, full-width `#anunciar` CTA band, auth-aware CTA routing, and follow-up route-level assertions for those sections.

## Iteration 5 Notes

- Reworked `#como-funciona` into a compact Visitor-first 3-step section with short copy, small lucide icons, and a provider note under the steps.
- Added route-level UI assertions for the new `#como-funciona` copy and provider note.
- Remaining work: denser announcement grid, full-width `#anunciar` CTA band, auth-aware CTA routing, and final route-level assertions for the CTA section and overall layout finish.
