# Home Feed Loading, Empty & Error States

## Parent

Follow-up to Issue 58 (`home_discovery_layout_first_viewport_cleanup`) and Issue 59 (`announcement_card_spectrum_inspired_redesign`).

## What to build

Improve the home announcement feed's loading, empty, and error states so the browsing experience remains stable, contextual, and actionable.

## Current problem

The home feed currently uses a centered spinner for loading and a generic empty state. Feed query failures are not clearly separated from empty results. Location/IP/GPS refresh states can also make the page feel blocked or ambiguous.

## Scope

1. Keep discovery controls visible during loading, empty, and error states.
2. Replace centered feed spinner with feed-shaped skeleton announcement cards.
3. Skeleton cards must use the same responsive grid density as real announcement cards.
4. Do not block feed rendering while IP fallback, GPS refresh, or location confidence checks are running.
5. Add contextual empty states based on active search/filter/location state.
6. Add explicit feed query error state with a retry action.
7. Keep location-control errors separate from feed-loading errors.
8. Avoid exposing raw technical error messages to Visitors.

## Empty state variants

Use context-specific copy and actions where applicable:

1. Search active: `Nenhum resultado para "{query}"`; action: clear search.
2. Category active: `Nenhum anúncio em {category}`; action: clear category.
3. Verified-only active: `Nenhum morador verificado encontrado`; action: clear verified filter.
4. Selected condominium active: `Ainda não há anúncios neste condomínio`; action: change or clear condominium.
5. Region/location active: `Nenhum anúncio encontrado nesta região`; action: adjust location/filter.
6. Fresh GPS active and radius controls available: offer expand radius only when applicable.
7. No filters and no announcements: `Ainda não há anúncios publicados`; action: provider CTA.

## Error state

If the announcement feed query fails:

1. Show `Não conseguimos carregar os anúncios agora.`
2. Provide `Tentar novamente`.
3. Keep discovery controls visible.
4. Do not blame geolocation unless the feed failure is specifically location-related.
5. Do not show raw stack traces, SQL errors, or transport internals.

## Out of scope

1. Home page layout restructure (Issue 58).
2. Announcement card redesign (Issue 59).
3. Geolocation state machine changes (Issue 57).
4. Backend query optimization.

## Acceptance criteria

- [ ] Feed loading uses skeleton announcement cards instead of a centered spinner.
- [ ] Skeleton grid follows the same responsive columns as the real card grid.
- [ ] Discovery controls remain visible during loading, empty, and error states.
- [ ] Feed is not blocked by IP fallback or GPS refresh.
- [ ] Empty states reflect active search, category, verified-only, condominium, location, and no-inventory contexts.
- [ ] Empty states include a relevant action where useful.
- [ ] Feed query failures show a clear error state with `Tentar novamente`.
- [ ] Raw technical errors are not exposed to Visitors.
- [ ] Tests cover loading skeleton, contextual empty variants, query error, and retry behavior.

## Blocked by

- Issue 58: Home Discovery Layout & First Viewport Cleanup
- Issue 59: Announcement Card Spectrum-Inspired Redesign
