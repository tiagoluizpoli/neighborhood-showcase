# Backend-Managed Announcement Categories

## Parent

Follow-up to home-page filter grilling and Issue 58 (`home_discovery_layout_first_viewport_cleanup`).

## What to build

Replace hardcoded frontend announcement categories and free-text backend category storage with backend-managed category records.

## Current problem

The public home page currently hardcodes category labels in the frontend, while announcements store category as a plain string. This makes category governance fragile: creation UI, feed filters, tests, translations, analytics, and backend validation can drift independently.

## Scope

1. Add a backend-managed `category` table.
2. Migrate announcements from string `category` to `categoryId`.
3. Seed initial MVP categories:
   - `Alimentação`
   - `Serviços`
   - `Produtos`
   - `Vagas`
   - `Eventos`
   - `Outros`
4. Category records should include:
   - `id`
   - `slug`
   - `name`
   - `description` optional
   - `icon` optional
   - `displayOrder`
   - `isActive`
5. Public category filters fetch active categories from the backend.
6. Provider announcement creation/editing uses active backend categories.
7. Public announcement listing filters by `categoryId`.
8. `Todos` remains UI-only and means no category filter is sent.
9. Public quick category filters use backend category `displayOrder` for MVP ordering.
10. Keep category labels displayable on announcement cards and detail pages.
11. Preserve existing announcements through migration or destructive schema reset strategy appropriate for the current pre-v1 project state.

## Trending category decision

Categories should eventually support analytics-backed trending, but public home requests must not scan raw analytics events to compute trending categories.

MVP ordering uses backend category `displayOrder`, optionally with active announcement count if already cheap to compute. Analytics-backed trending must be implemented later through a cached/aggregate approach such as a `category_metrics_daily` table or scheduled aggregation job.

## Out of scope

1. Category admin UI for create/edit/deactivate/reorder.
2. Analytics-backed trending category implementation.
3. Raw analytics scans on public home/feed requests.
4. Review/rating systems.
5. Broad announcement taxonomy redesign beyond MVP categories.

## Acceptance criteria

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

## Deferred follow-ups

- Category admin UI for create/edit/deactivate/reorder.
- Analytics-backed trending categories through aggregate/cached metrics.

## Blocked by

- None.
