---
type: feature
epic: 05-public-browsing-ui
status: completed
blocked-by: null
---

## What to Build

Replace hardcoded frontend announcement categories and free-text backend category storage with backend-managed category records.

## Acceptance Criteria

- [x] Backend has a category table with required category fields.
- [x] Initial MVP categories are seeded.
- [x] Announcements reference categories by `categoryId`, not free-text category strings.
- [x] Public feed category filter accepts category identity from backend-managed categories.
- [x] Frontend no longer hardcodes the full category taxonomy for the public feed.
- [x] `Todos` is represented only as a UI "no category filter" state.
- [x] Provider create/edit announcement flow selects from active backend categories.
- [x] Public cards/detail pages display category labels from backend category data.
- [x] Public quick filters use backend ordering rather than frontend hardcoded ordering.
- [x] Implementation does not scan raw analytics events on public home/feed requests.
- [x] Tests cover category seeding, announcement category assignment, public category filtering, and `Todos`/no-filter behavior.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
