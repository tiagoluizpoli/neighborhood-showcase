# Backlog

This file tracks deferred or follow-up work that remains relevant after the Ralph Loop cutover.

Status values: `ready` | `in-progress` | `blocked` | `done`
Horizon values: `now` | `soon` | `later`

| Status | Horizon | Area | Item | Notes | Linked |
| --- | --- | --- | --- | --- | --- |
| ready | now | Migration | Backfill completed historical `.specify/memory` epics into native Ralph Loop task format | Pass A migrated the active PRD lineage and epic 13 only. Older completed epics remain preserved in legacy `.specify/memory/epics/` until backfilled. | `.plan/archive/legacy-specify-memory/` |
| ready | now | Migration | Curate historical grilling material into `.plan/summaries/` | The latest grilling session is canonical in `.plan/grilling/`; the large legacy grilling log was archived and still needs optional curated summaries. | `.plan/archive/legacy-specify-memory/grilling_history.md` |
| ready | later | Provider | Company Provider (CNPJ / legal-entity profile type — Option B) | Deferred by the 2026-06-10 grilling session; current Provider Profile scope remains individual-only. | PRD-v7 |
| ready | later | Routing | Finish mixed-language route naming sweep (PT → EN) | Some PT-named route/i18n surfaces remain outside the migrated active task path and should be cleaned in a future sweep. | legacy backlog |
| ready | later | Admin | Reports section implementation | Sidebar/reporting placeholder work remains deferred. | legacy backlog |
| ready | later | Admin | Admin provider management and condominium management UIs | Deferred admin surfaces remain outside the current provider-section reorg slice. | legacy backlog |
| blocked | now | Provider / E2E | T-13-09/ST-04 Playwright coverage is blocked on sidebar capability gate + footer avatar image implementation | `apps/web/src/routes/panel.tsx` still has unconditional `GROUP_PROVEDOR.condition = true` and renders only `AvatarFallback`, so truthful E2E coverage for provider-only sidebar visibility and avatar image/fallback cannot pass until ST-02 lands or app-code edits are allowed. | `.plan/epics/13-provider-section-reorg/tasks/09-dashboard-slim-and-sidebar.md` |
| ready | later | Routing | Translate the remaining public announcement route surface (`/anuncios/:id`, `_portal.anuncios.$id.tsx`) to English | T-13-10/ST-01 renamed the public provider route to `/providers/:id`; the linked public announcement route remains PT-named but was outside this sub-task's scope. | `.plan/epics/13-provider-section-reorg/tasks/10-public-page-and-adrs.md` |
| ready | later | Routing | Rename PT-named payment route within provider namespace (`/panel/provider/anuncios/$id/pagamento`) to EN (`/panel/provider/announcements/$id/payment`) | T-14-02/ST-02 created the payment route under provider namespace but preserved the PT path name (legacy constraint). Rename pending sweep. | `.plan/epics/14-role-access-and-route-architecture/tasks/02-provider-route-group-and-dashboard-shim.md` |
| ready | soon | Provider | Restore independent-provider activation once backend capability storage supports non-condominium enablement | T-14-05/ST-01 disabled the external-provider CTA on the non-Provider activation surface because the current canonical `providerEnabled` contract only unlocks Provider navigation from approved RESIDENT assignments; the old external flow would loop users back into locked onboarding. | `.plan/epics/14-role-access-and-route-architecture/tasks/05-provider-enablement-surface-sync.md` |
| ready | later | Routing | Remove redundant `useUserAccessProfile` access check in `provider-nav.spec.ts` sidebar button assertions (expects `/panel/dashboard` hrefs) — update E2E test to assert `/panel/provider` hrefs after sidebar update in T-14-02/ST-02 | provider-nav.spec.ts checks for `a[href*="/panel/dashboard"]` but sidebar now links to `/panel/provider/*`; test needs update in ST-04 or dedicated sweep. | `.plan/epics/14-role-access-and-route-architecture/tasks/02-provider-route-group-and-dashboard-shim.md` |

## Legacy backlog note

The full pre-cutover backlog corpus was archived to `.plan/archive/legacy-specify-memory/backlog.md` and `.plan/archive/legacy-specify-memory/deferred_backlog.md`. Use those files for historical retrieval during the backfill phase.
