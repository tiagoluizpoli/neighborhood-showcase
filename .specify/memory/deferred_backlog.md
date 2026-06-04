# Deferred Backlog

This file tracks ideas and follow-up work deliberately deferred during planning or grilling sessions. Deferred means "not in the current implementation slice", not "rejected".

| Status | Area | Item | Why deferred | Revisit trigger | Linked issue |
| --- | --- | --- | --- | --- | --- |
| Deferred | Categories | Category admin UI for create/edit/deactivate/reorder | Backend-managed categories are needed now, but admin CRUD would expand the first category refactor beyond the home-page cleanup scope. | After category table and seeded category flow are stable. | Issue 62 |
| Deferred | Categories | Analytics-backed trending categories using aggregate table/job | Trending should not scan raw analytics on public home requests; aggregate infrastructure deserves a dedicated slice. | When category filtering is stable and enough analytics data exists to rank categories meaningfully. | Issue 62 |
| Deferred | Frontend architecture | Frontend architecture cleanup sweep | Issue 55 focuses on backend Clean Architecture first; frontend concerns need separate discovery and scope. | After backend architecture sweep is underway or complete. | TBD |
| Deferred | Announcement detail | Full visual redesign of `/anuncios/:id` | Issue 60 only removes duplicate modal/source-of-truth behavior; detail visual polish should follow home/card direction later. | After Issues 58, 59, and 60 are implemented. | Issue 60 |
| Deferred | Providers | Public provider directory page | Header decision uses `Anunciar` instead of `Prestadores` for MVP because no public directory exists yet. | When provider profile/listing strategy is ready for a public directory. | Issue 56 |
| Deferred | Geolocation | Live location tracking with `watchPosition()` | Background refresh after prior grant is enough for MVP and avoids battery/privacy complexity. | If usage shows Visitors need live movement updates during long browsing sessions. | Issue 57 |
| Deferred | Home filters | Public sort dropdown or explicit sorting controls | Relevance-first ranking should stabilize before exposing sort choices that add UI and query complexity. | If users need to choose between newest, nearest, verified, or relevance ordering after MVP ranking is validated. | Issues 57, 58 |
| Deferred | Legal | Public legal/support pages such as privacy policy, terms, and contact/support | Footer should not link to dead legal placeholders, but the product will need these pages before broader launch. | Before public launch or when footer/legal compliance work is prioritized. | TBD |
