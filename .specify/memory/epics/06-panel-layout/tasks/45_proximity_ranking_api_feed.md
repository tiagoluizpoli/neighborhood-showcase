---
type: feature
epic: 06-panel-layout
status: blocked
blocked-by: null
---

## What to Build

Implement the proximity-based ranking engine that sorts the announcement feed based on the Visitor's location, condominium context, and verification status.

1. **Ranked listing API**: Modify the public announcement listing tRPC procedure to accept optional `latitude`, `longitude`, and `condominiumId` parameters. When coordinates are provided, use PostGIS `ST_Distance` to sort results by proximity.
2. **Ranking rules**:
   - Own-condominium announcements pinned to top (distance = 0).
   - Verified providers boosted above unverified providers at similar distances.
   - Feed limited to a configurable radius (default 10km, stored as a backend environment variable).
   - Option to expand radius up to 25km, with a warning UI element.
3. **Fallback**: When no coordinates are provided, return announcements in chronological order (existing behavior).
4. **Manual filter integration**: Support city/neighborhood filter parameters in the API query for Visitors who denied geolocation.
5. **Frontend feed update**: Connect the home page announcement grid to the ranked API, passing coordinates from the client capture (Slice 7).

## Acceptance Criteria

- [x] Announcement listing API accepts optional lat/lng/condominiumId parameters
- [x] Results sorted by PostGIS distance when coordinates are provided
- [x] Own-condominium announcements appear first
- [x] Verified providers rank higher than unverified at equal distance
- [x] Feed respects configurable radius (default 10km)
- [x] "Expand radius" option works up to 25km with a warning
- [x] Chronological fallback when no coordinates provided
- [x] City/neighborhood filter parameters are functional
- [x] Integration tests: verify ranking order with seeded data at known coordinates

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
