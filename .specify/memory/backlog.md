# Backlog

This file tracks ideas and follow-up work deliberately deferred during planning or grilling sessions. Deferred means "not in the current implementation slice", not "rejected". Items are picked up for implementation when a specific PRD or issue activates them.

Status values: `deferred` | `in-progress` | `completed` | `cancelled`

| Status | Area | Item | Why deferred | Revisit trigger | Linked |
| --- | --- | --- | --- | --- | --- |
| deferred | Categories | Category admin UI (create/edit/deactivate/reorder) | Backend-managed categories needed first; admin CRUD expands scope beyond home-page cleanup. | After category table and seeded category flow are stable. | Issue 62 |
| deferred | Categories | Analytics-backed trending categories (aggregate table/job) | Trending should not scan raw analytics on public home requests; aggregate infrastructure deserves a dedicated slice. | When category filtering is stable and enough analytics data exists to rank categories meaningfully. | Issue 62 |
| deferred | Frontend | Frontend architecture cleanup sweep | Issue 55 focuses on backend Clean Architecture first; frontend concerns need separate discovery and scope. | After backend architecture sweep is underway or complete. | Issue 55 |
| deferred | Announcement | Full visual redesign of `/anuncios/:id` | Issue 60 only removes duplicate modal/source-of-truth behavior; detail visual polish should follow home/card direction later. | After Issues 58, 59, and 60 are implemented. | Issue 60 |
| deferred | Providers | Public provider directory page | Header decision uses `Anunciar` instead of `Prestadores` for MVP because no public directory exists yet. | When provider profile/listing strategy is ready for a public directory. | Issue 56 |
| deferred | Geolocation | Live location tracking with `watchPosition()` | Background refresh after prior grant is enough for MVP; avoids battery/privacy complexity. | If usage shows Visitors need live movement updates during long browsing sessions. | Issue 57 |
| deferred | Home | Public sort dropdown or explicit sorting controls | Relevance-first ranking should stabilize before exposing sort choices that add UI and query complexity. | If users need to choose between newest, nearest, verified, or relevance ordering after MVP ranking is validated. | Issues 57, 58 |
| deferred | Legal | Public legal/support pages (privacy policy, terms, contact) | Footer should not link to dead legal placeholders; product needs these pages before broader launch. | Before public launch or when footer/legal compliance work is prioritized. | — |
| deferred | Routing | Mixed-language route naming fix (PT → EN) | Route files and paths currently use Portuguese (`anuncios`, `conta`) which should be `announcements`, `account` per coding standards. | Before any future route work to avoid propagating mixed naming. | — |
| deferred | i18n | Backend language preference persistence (per-user, cross-device) | Language currently stored in localStorage only via i18next-browser-languagedetector. Backend write would sync preferences across devices. | When multi-device user experience is prioritized. | — |
| deferred | Provider | Provider configuration page (logo, banner, companyName, publicDescription) | Provider should have own branding fields, not derived from User. Needs a dedicated config page. | After PRD-v5 layout is complete. | PRD-v5 |
| deferred | Provider | Announcement list page ("Meus Anúncios") | Stub route exists but no full list page yet. Provider needs a page to see all their announcements. | After PRD-v5 layout is complete. | PRD-v5 |
| deferred | Admin | Reports section (top-level block, ADMINISTRATOR only) | Sidebar "Reports" block is a placeholder. Full reporting functionality deferred to future slice. | When admin reporting is prioritized. | — |
| deferred | Admin | Admin provider management (global listing, condo filter, user drill-down) | Admin needs to see all providers globally, filter by condo, and drill into provider's user. | When admin provider management is prioritized. | — |
| deferred | Admin | Admin condominium management (approve/reject new condos) | System needs a UI for approving/rejecting new condominium applications. | When condo onboarding flow is built. | — |
| deferred | Frontend | Branding (name, logo, color palette, design system) | "NS" placeholder used for now. Product name, logo, and brand identity deferred until after MVP. | When product identity is defined. | — |
| deferred | Moderation | Live badge counts for sidebar moderation queues | Requires three new tRPC endpoints: `announcement.pendingCount`, `assignment.pendingCount`, `report.openCount`. Stub counts (0) used in PRD-v5. | When moderation queue endpoints are built. | PRD-v5 |