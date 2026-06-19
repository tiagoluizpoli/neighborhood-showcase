# Index

> Read this file before any work.
> This is a derived navigation surface. The canonical execution state lives in task-file sub-task blocks. Aggregate status must be synchronized by `.plan/helper-scripts/sync-state.sh`.

## Current Run Family

- Current PRD: `.plan/prds/PRD-v9-panel-shell-layout-and-navigation.md`
- Current PRD pointer: `.plan/prds/.current-prd`
- Current grilling pointer: `.plan/grilling/.current-session`
- Current grill handoff pointer: `.plan/handoffs/.current-grill-handoff`
- Current PRD handoff pointer: `.plan/handoffs/.current-prd-handoff`
- Active summary: `.plan/.run-summary.md`
- Last archived family: `legacy-specify-memory-pre-cutover`

## Grilling Sessions

- Provider Section Reorg (2026-06-10) — `.plan/grilling/2026-06-10-provider-section-reorg-grilling.md`

## PRD History

| Status | Version | Title | File | Canonical Record | Date |
| --- | --- | --- | --- | --- | --- |
| HISTORICAL | v1 | Neighborhood Showcase MVP baseline | `.plan/prds/PRD-v1-original.md` | Root `/PRD.md` inlined Module 1 | 2026-06-08 |
| HISTORICAL | v2 | Backlog overhaul | `.plan/prds/PRD-v2-backlog-overhaul.md` | Root `/PRD.md` inlined Module 2 | 2026-06-08 |
| HISTORICAL | v3 | Backend domain alignment and Clean Architecture completion | `.plan/prds/PRD-v3-backend-domain-alignment.md` | Root `/PRD.md` inlined Module 3 | 2026-06-08 |
| HISTORICAL | v4 | Whole-codebase remediation and architecture alignment | `.plan/prds/PRD-v4-whole-codebase-remediation.md` | Root `/PRD.md` inlined Module 4 | 2026-06-08 |
| SUPERSEDED | v5 | Panel layout | `.plan/prds/PRD-v5-panel-layout.md` | Root `/PRD.md` inlined Module 23 | 2026-06-08 |
| SUPERSEDED | v6 | Panel i18n, navigation hierarchy, moderation condo context | `.plan/prds/PRD-v6-panel-i18n-and-navigation-remediation.md` | Root `/PRD.md` inlined Module 24 | 2026-06-09 |
| SUPERSEDED | v7 | Provider section reorg | `.plan/prds/PRD-v7-provider-section-reorg.md` | `.plan/prds/PRD-v7-provider-section-reorg.md` | 2026-06-10 |
| SUPERSEDED | v8 | Role access and route architecture | `.plan/prds/PRD-v8-role-access-and-route-architecture.md` | `.plan/prds/PRD-v8-role-access-and-route-architecture.md` | 2026-06-18 |
| CURRENT | v9 | Panel shell, layout, and navigation | `.plan/prds/PRD-v9-panel-shell-layout-and-navigation.md` | `.plan/prds/PRD-v9-panel-shell-layout-and-navigation.md` | 2026-06-19 |

## Epics

| Epic ID | Epic | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| E-13 | Provider Section Reorg | done | — | `.plan/epics/13-provider-section-reorg/epic.md` |
| E-14 | Role Access and Route Architecture | done | — | `.plan/epics/14-role-access-and-route-architecture/epic.md` |
| E-15 | Functional Testing | ready | — | `.plan/epics/15-functional-testing/epic.md` |
| E-16 | Panel Shell, Layout, and Navigation | in-progress | — | `.plan/epics/16-panel-shell-layout-and-navigation/epic.md` |

## Tasks

| Task ID | Epic ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- | --- |
| T-13-01 | E-13 | Schema migrations | done | — | `.plan/epics/13-provider-section-reorg/tasks/01-schema-migrations.md` |
| T-13-02 | E-13 | Provider profile backend | done | — | `.plan/epics/13-provider-section-reorg/tasks/02-provider-profile-backend.md` |
| T-13-03 | E-13 | Provider profile router | done | — | `.plan/epics/13-provider-section-reorg/tasks/03-provider-profile-router.md` |
| T-13-04 | E-13 | Shrink user update and DTOs | done | — | `.plan/epics/13-provider-section-reorg/tasks/04-shrink-user-update-and-dtos.md` |
| T-13-05 | E-13 | Configurações page | done | — | `.plan/epics/13-provider-section-reorg/tasks/05-configuracoes-page.md` |
| T-13-06 | E-13 | Conta e Segurança | done | — | `.plan/epics/13-provider-section-reorg/tasks/06-conta-e-seguranca.md` |
| T-13-07 | E-13 | Meus Anúncios list | done | — | `.plan/epics/13-provider-section-reorg/tasks/07-meus-anuncios-list.md` |
| T-13-08 | E-13 | Meus Anúncios detail | done | — | `.plan/epics/13-provider-section-reorg/tasks/08-meus-anuncios-detail.md` |
| T-13-09 | E-13 | Dashboard slim and sidebar | done | — | `.plan/epics/13-provider-section-reorg/tasks/09-dashboard-slim-and-sidebar.md` |
| T-13-10 | E-13 | Public page and ADRs | done | — | `.plan/epics/13-provider-section-reorg/tasks/10-public-page-and-adrs.md` |
| T-14-01 | E-14 | Canonical Provider-enabled access contract | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/01-canonical-provider-enabled-contract.md` |
| T-14-02 | E-14 | Provider route group and dashboard shim | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/02-provider-route-group-and-dashboard-shim.md` |
| T-14-03 | E-14 | Section-specific non-Provider landings | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/03-section-specific-non-provider-landings.md` |
| T-14-04 | E-14 | Fail-closed landing resolution | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/04-fail-closed-landing-resolution.md` |
| T-14-05 | E-14 | Provider enablement surface sync | done | — | `.plan/epics/14-role-access-and-route-architecture/tasks/05-provider-enablement-surface-sync.md` |
| T-15-01 | E-15 | Manual Verification Test Cases | ready | manual-execution-only | `.plan/epics/15-functional-testing/tasks/01-manual-verification.md` |
| T-16-01 | E-16 | Canonical content container primitive | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/01-canonical-content-container.md` |
| T-16-02 | E-16 | Migrate provider routes to container variants | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/02-migrate-routes-to-variants.md` |
| T-16-03 | E-16 | Sidebar collapse regression fix | ready | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/03-sidebar-collapse-regression-fix.md` |
| T-16-04 | E-16 | Strengthen sidebar header and top bar chrome | ready | T-16-03 | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/04-strengthen-shell-chrome.md` |
| T-16-05 | E-16 | Shared announcement presentation primitive | ready | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/05-announcement-presentation-primitive.md` |
| T-16-06 | E-16 | Shell-adjacent localization | ready | T-16-04 | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/06-shell-adjacent-localization.md` |

## Migration Note

- The active workflow has been cut over to `.plan/`.
- Legacy `.specify/memory/` artifacts are preserved for archival retrieval while historical epics are backfilled.
