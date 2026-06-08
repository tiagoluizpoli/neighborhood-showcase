---
type: bug
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Fix the double-visualization analytics bug where clicking an announcement in the public showcase registers two IMPRESSION events.
1. Remove the `trackEvent` call from the `openAdDetails` function (or onClick card click handler) in the showcase grid.
2. Rely on the `useEffect` inside `anuncios.$id.tsx` (the detail route) as the single source of truth for impression tracking. This covers both the modal overlay path (grid details modal) and direct URL navigation.
3. Introduce a `useRef(false)` inside this `useEffect` to guard against React.StrictMode double-firing the effect in development mode.
4. Ensure re-visits (navigating away and back to the same announcement) continue to count as new impressions (no session-level or module-level caching).

## Acceptance Criteria

- [x] The `trackEvent` call with event `IMPRESSION` is removed from `openAdDetails` or onClick grid card handlers.
- [x] Direct page load or modal open of an announcement triggers exactly one `IMPRESSION` event.
- [x] A `useRef` guard prevents double-counting due to React.StrictMode in development mode.
- [x] Unit/integration tests are written to verify that the detail component mount tracks the event exactly once, and click handlers do not track it.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
