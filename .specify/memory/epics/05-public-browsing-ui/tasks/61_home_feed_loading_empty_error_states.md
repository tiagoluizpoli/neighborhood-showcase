---
type: feature
epic: 05-public-browsing-ui
status: completed
blocked-by: null
---

## What to Build

Improve the home announcement feed's loading, empty, and error states so the browsing experience remains stable, contextual, and actionable.

## Acceptance Criteria

- [x] Feed loading uses skeleton announcement cards instead of a centered spinner.
- [x] Skeleton grid follows the same responsive columns as the real card grid.
- [x] Discovery controls remain visible during loading, empty, and error states.
- [x] Feed is not blocked by IP fallback or GPS refresh.
- [x] Empty states reflect active search, category, verified-only, condominium, location, and no-inventory contexts.
- [x] Empty states include a relevant action where useful.
- [x] Feed query failures show a clear error state with `Tentar novamente`.
- [x] Raw technical errors are not exposed to Visitors.
- [x] Tests cover loading skeleton, contextual empty variants, query error, and retry behavior.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
