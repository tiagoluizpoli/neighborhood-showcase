# Home Location Control & Geolocation Confidence Cleanup

## Parent

Follow-up to Slice 7 (`43_geolocation_permission_modal`) and Slice 8 (`44_condominium_proximity_matching`).

## What to build

Replace the intrusive first-load geolocation prompt and large location bars on the home page with a compact location/status control that reflects location confidence accurately.

This issue corrects both behavior and presentation. Visitors should be able to browse first, then improve feed relevance with precise location, approximate region, or manual condominium selection.

## Current problem

The home page currently opens a geolocation explanation modal on first visit and renders large full-width location surfaces in the first viewport. The browser geolocation error path also treats every failure as a user denial, which can show misleading behavior when the user clicks allow but the browser fails due to timeout, unavailable GPS, insecure context, or platform settings.

## Scope

1. Replace automatic first-load geolocation prompting with a compact location/status control near the search/filter area.
2. Exact browser geolocation must be requested only after an explicit user action, except for background refresh after a previous successful grant.
3. Support explicit location states:
   - `unset`: user has not chosen exact geolocation
   - `granted`: browser returned coordinates successfully
   - `denied`: browser explicitly returned permission denied
   - `unavailable`: user requested location but the browser could not provide it for a non-denial reason
4. Preserve IP fallback as coarse regional relevance only:
   - session-only
   - transparent to the user
   - not stored in localStorage
   - not used for exact radius, kilometer distance, or condominium matching
5. Store precise GPS coordinates in localStorage with a `capturedAt` timestamp.
6. Reuse stored GPS only while fresh. MVP freshness window: 24 hours.
7. When a fresh stored GPS value exists, use it immediately, then refresh precise location in the background if the user previously granted permission.
8. Use a 1 km movement threshold before updating ranking/state from refreshed coordinates.
9. Do not use `watchPosition()` for MVP.
10. Keep manual condominium selection available from the compact control.
11. Keep feed browsing usable in all location states.
12. Support manual region selection from the compact control.
13. Manual region selection is city-first, with optional neighborhood refinement.
14. Manual region selection acts as an explicit filter:
   - city selected: only announcements matching that city
   - city and neighborhood selected: only announcements matching that neighborhood inside the city
15. Manual condominium selection acts as preferred browsing context by default, not as a hard filter.
16. `Somente este condomínio` remains a separate explicit filter when condominium context exists.
17. Replace the current custom condominium-only modal with a selector that supports both region and condominium choices.
18. Selector presentation:
   - desktop: popover or compact dialog anchored from the location control
   - mobile: bottom sheet
19. Default public feed ranking is relevance-first:
   - confirmed condominium match, when context exists
   - fresh GPS proximity, when available
   - manual region match, when selected
   - IP approximate region match, when active
   - verified providers as a tie-breaker
   - recent announcements as the final tie-breaker
20. Sorting remains implicit for MVP. Do not add a public sort dropdown in this issue.
21. Verified providers receive a default ranking boost, but unverified providers remain visible unless the user enables the verified-only filter.
22. Radius filtering is available only for fresh GPS confidence:
   - default 10 km
   - max 25 km with warning
   - no radius control for IP region, manual region, stale GPS, or condominium-only context

## Location confidence wording

Use wording that matches the confidence level:

1. Fresh GPS: `Perto de você`
2. Stored GPS while refreshing: `Perto da última localização`
3. Stored GPS refresh failed: `Última localização conhecida`
4. IP fallback: `Região aproximada`
5. Selected condominium: `Condomínio selecionado`
6. No signal: `Todos os anúncios`
7. Explicit denial: `Localização desativada`
8. Non-denial failure: `Localização indisponível`

IP fallback must never use "near you" copy, exact distance labels, radius controls, or condominium matching.

## Geolocation error mapping

1. `PERMISSION_DENIED`: set `denied`; show `Localização desativada`.
2. `POSITION_UNAVAILABLE`: set `unavailable`; show `Não conseguimos encontrar sua localização agora`.
3. `TIMEOUT`: set `unavailable`; show `A localização demorou para responder`.
4. Unsupported browser or insecure context: set `unavailable`; show `Localização indisponível neste navegador`.

Only explicit browser permission denial may persist as `denied`.

## Out of scope

1. Live location tracking with `watchPosition()`.
2. Exact distance ranking from IP fallback.
3. Condominium matching from IP fallback.
4. Backend persistence of visitor coordinates.
5. Full homepage redesign beyond reducing the geolocation UI footprint.
6. New provider directory page.
7. Public sort dropdown or advanced sorting controls.

## Acceptance criteria

- [ ] Home page does not auto-open the geolocation permission modal on first visit.
- [ ] Browser geolocation prompt happens only after an explicit user action, except background refresh after prior grant.
- [ ] Large first-viewport geolocation bars are replaced by one compact location/status control.
- [ ] The control reflects `unset`, `granted`, `denied`, and `unavailable` states accurately.
- [ ] Non-denial geolocation failures do not persist or display as user refusal.
- [ ] IP fallback is automatic, transparent, session-only, and used only for coarse regional feed relevance.
- [ ] GPS coordinates are stored with `capturedAt` and expire after 24 hours.
- [ ] Previously granted GPS can refresh in the background on page load without using `watchPosition()`.
- [ ] Refreshed GPS only updates ranking/state after a movement of at least 1 km.
- [ ] Feed remains browsable when geolocation is unset, denied, unavailable, or IP fallback fails.
- [ ] Manual region selection supports city-first filtering with optional neighborhood refinement.
- [ ] Manual condominium selection sets preferred context without hard-filtering the feed by default.
- [ ] `Somente este condomínio` remains available as a separate explicit filter.
- [ ] Current custom condominium-only modal is replaced by a selector that supports region and condominium choices.
- [ ] Default feed ranking follows relevance-first ordering with recency only as final tie-breaker.
- [ ] Verified-only can still be used as a hard filter, while verified providers are boosted by default.
- [ ] Radius control appears only for fresh GPS confidence and is capped at 25 km.
- [ ] Tests cover grant, explicit denial, non-denial failure, stored coordinate reuse, background refresh, IP fallback, manual region filter, and manual condominium context behavior.

## Blocked by

- None.
