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

- [x] Proximity check API returns condominiums sorted by distance using PostGIS `ST_DWithin` and `ST_Distance`
- [x] Tier 1: single condo within 100m triggers direct prompt
- [x] Tier 2: multiple condos within 1km shows sorted selection list
- [x] Confirmed condominium is stored as the user's browsing context
- [x] Dismiss proceeds without condominium context
- [x] Integration test: seeded condominiums return in correct proximity order

## Blocked by

- None (dependencies resolved in prior iterations)

## Iteration 1 Notes

- Portal geolocation flow now consumed `condominium.listNearby` and persisted the nearest condo into `user_condo` when coordinates were available.
- Tier 1 direct prompt and Tier 2 multi-condo picker remained for the next iteration.

## Iteration 2 Notes

- Replaced the silent auto-linking behavior with a proximity prompt that appears only when nearby condominiums exist.
- Added the single-condo confirmation dialog and the multi-condo selection list, both sorted by distance.
- Implemented dismiss handling that clears condo context, stores the dismissal flag, and keeps the feed unlinked until the user confirms.
- Added/updated geolocation tests to cover confirm and dismiss flows plus the seeded proximity ordering test.
