# Slice 8: Condominium Proximity Matching & Onboarding

## Parent

PRD-v2-backlog-overhaul (Item 2)

## What to build

Use the Visitor's captured coordinates to detect nearby condominiums and prompt association, implementing the two-tier matching radius.

1. **Proximity check API**: Create a tRPC procedure that accepts lat/lng coordinates and returns condominiums within a configurable radius, sorted by distance.
2. **Two-tier matching**:
   - **Tier 1 (100m)**: If a single condominium is within 100m, prompt directly: "Você mora no Condomínio X?" with confirm/deny.
   - **Tier 2 (1km)**: If multiple condominiums are within 1km, list them closest-first for the user to select one or dismiss.
3. **Context linking**: If the user confirms a condominium, store it as their context in client-side state. This context is used by the ranking engine to pin own-condominium announcements to the top.
4. **Dismiss flow**: If the user dismisses (doesn't live in any nearby condominium), proceed with distance-only ranking.

## Acceptance criteria

- [ ] Proximity check API returns condominiums sorted by distance using PostGIS `ST_DWithin` and `ST_Distance`
- [ ] Tier 1: single condo within 100m triggers direct prompt
- [ ] Tier 2: multiple condos within 1km shows sorted selection list
- [ ] Confirmed condominium is stored as the user's browsing context
- [ ] Dismiss proceeds without condominium context
- [ ] Integration test: seeded condominiums return in correct proximity order

## Blocked by

- #38 (PostGIS Schema & Geospatial Columns)
- #43 (Geolocation Permission Modal & Client Capture)
