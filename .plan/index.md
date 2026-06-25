# Index

> Read this file before any work.
> This is a derived navigation surface. The canonical execution state lives in task-file sub-task blocks. Aggregate status must be synchronized by `.plan/helper-scripts/sync-state.sh`.

## Current Run Family

- Current PRD: `.plan/prds/PRD-v13-provider-entity-and-verified-stamp.md`
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
| SUPERSEDED | v9 | Panel shell, layout, and navigation | `.plan/prds/PRD-v9-panel-shell-layout-and-navigation.md` | `.plan/prds/PRD-v9-panel-shell-layout-and-navigation.md` | 2026-06-19 |
| SUPERSEDED | v10 | Announcement creation and authoring model | `.plan/prds/PRD-v10-announcement-creation-and-authoring-model.md` | `.plan/prds/PRD-v10-announcement-creation-and-authoring-model.md` | 2026-06-20 |
| SUPERSEDED | v11 | Announcement detail, edit split, and analytics | `.plan/prds/PRD-v11-announcement-detail-edit-and-analytics.md` | `.plan/prds/PRD-v11-announcement-detail-edit-and-analytics.md` | 2026-06-22 |
| SUPERSEDED | v12 | Provider identity, configuration IA, and public profile | `.plan/prds/PRD-v12-provider-identity-and-public-profile.md` | `.plan/prds/PRD-v12-provider-identity-and-public-profile.md` | 2026-06-23 |
| CURRENT | v13 | Provider entity refactor and verified resident stamp | `.plan/prds/PRD-v13-provider-entity-and-verified-stamp.md` | `.plan/prds/PRD-v13-provider-entity-and-verified-stamp.md` | 2026-06-24 |

## Epics

| Epic ID | Epic | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| E-13 | Provider Section Reorg | done | — | `.plan/epics/13-provider-section-reorg/epic.md` |
| E-14 | Role Access and Route Architecture | done | — | `.plan/epics/14-role-access-and-route-architecture/epic.md` |
| E-15 | Functional Testing | done | — | `.plan/epics/15-functional-testing/epic.md` |
| E-16 | Panel Shell, Layout, and Navigation | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/epic.md` |
| E-17 | Announcement Creation and Authoring Model | done | — | `.plan/epics/17-announcement-creation-and-authoring-model/epic.md` |
| E-18 | Announcement Detail, Edit Split, and Analytics | done | — | `.plan/epics/18-announcement-detail-edit-and-analytics/epic.md` |
| E-19 | Provider Identity, Configuration IA, and Public Profile | done | — | `.plan/epics/19-provider-identity-and-public-profile/epic.md` |
| E-20 | Provider Entity Refactor | in-progress | — | `.plan/epics/20-provider-entity-refactor/epic.md` |
| E-21 | Verified Resident Stamp | ready | — | `.plan/epics/21-verified-resident-stamp/epic.md` |

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
| T-15-01 | E-15 | Manual Verification Test Cases | done | manual-execution-only | `.plan/epics/15-functional-testing/tasks/01-manual-verification.md` |
| T-16-01 | E-16 | Canonical content container primitive | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/01-canonical-content-container.md` |
| T-16-02 | E-16 | Migrate provider routes to container variants | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/02-migrate-routes-to-variants.md` |
| T-16-03 | E-16 | Sidebar collapse regression fix | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/03-sidebar-collapse-regression-fix.md` |
| T-16-04 | E-16 | Strengthen sidebar header and top bar chrome | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/04-strengthen-shell-chrome.md` |
| T-16-05 | E-16 | Shared announcement presentation primitive | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/05-announcement-presentation-primitive.md` |
| T-16-06 | E-16 | Shell-adjacent localization | done | — | `.plan/epics/16-panel-shell-layout-and-navigation/tasks/06-shell-adjacent-localization.md` |
| T-17-01 | E-17 | Provider contact defaults and WhatsApp baseline | done | — | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/01-provider-contact-defaults-and-whatsapp-baseline.md` |
| T-17-02 | E-17 | Create flow inherited contact authoring | done | T-17-01 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/02-create-flow-inherited-contact-authoring.md` |
| T-17-03 | E-17 | Edit flow contact parity and live inheritance | done | T-17-02 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/03-edit-flow-contact-parity-and-live-inheritance.md` |
| T-17-04 | E-17 | Bounded CTA authoring and public fallback | done | T-17-02, T-17-03 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/04-bounded-cta-authoring-and-public-fallback.md` |
| T-17-05 | E-17 | Structured category, tags, and money primitives | done | T-17-03 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/05-structured-category-tags-and-money-primitives.md` |
| T-17-06 | E-17 | Authoring surface regression and seeded Playwright matrix | done | T-17-04, T-17-05 | `.plan/epics/17-announcement-creation-and-authoring-model/tasks/06-authoring-surface-regression-and-seeded-playwright-matrix.md` |
| T-18-01 | E-18 | Extract shared AnnouncementForm and field-policy seam | done | — | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/01-extract-shared-announcement-form-and-field-policy-seam.md` |
| T-18-02 | E-18 | Edit route split onto shared form and delete duplicates | done | T-18-01 | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/02-edit-route-split-and-delete-duplicates.md` |
| T-18-03 | E-18 | Facts-first read-only detail rebuild | done | T-18-02 | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/03-facts-first-read-only-detail-rebuild.md` |
| T-18-04 | E-18 | Analytics placement and chart shrink | done | T-18-03 | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/04-analytics-placement-and-chart-shrink.md` |
| T-18-05 | E-18 | Test matrix and boundary guards | done | — | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/05-test-matrix-and-boundary-guards.md` |
| T-18-06 | E-18 | Manual detail field-parity verification | done | manual-execution-only | `.plan/epics/18-announcement-detail-edit-and-analytics/tasks/06-manual-detail-parity-verification.md` |
| T-19-01 | E-19 | Shared identity-precedence helper | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/01-shared-identity-precedence-helper.md` |
| T-19-02 | E-19 | Original-image retention backend slice | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/02-original-image-retention-backend.md` |
| T-19-03 | E-19 | Role-parameterized ImageUploadField with re-crop | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/03-role-parameterized-image-upload-field.md` |
| T-19-04 | E-19 | Configuration IA reorg, identity-first | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/04-configuration-ia-reorg.md` |
| T-19-05 | E-19 | Public page identity-hero recomposition | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/05-public-page-recomposition.md` |
| T-19-06 | E-19 | i18n pt/en parity and cross-surface E2E matrix | done | — | `.plan/epics/19-provider-identity-and-public-profile/tasks/06-i18n-parity-and-e2e-matrix.md` |
| T-20-01 | E-20 | Provider table, re-key migration, domain/repo plumbing, seed rebuild | done | — | `.plan/epics/20-provider-entity-refactor/tasks/01-provider-table-rekey-and-seed.md` |
| T-20-02 | E-20 | Provider-profile read/write re-key + soft-delete exclusion | ready | T-20-01 | `.plan/epics/20-provider-entity-refactor/tasks/02-provider-profile-rekey.md` |
| T-20-03 | E-20 | Announcement read/write re-key + soft-delete exclusion | ready | T-20-01 | `.plan/epics/20-provider-entity-refactor/tasks/03-announcement-rekey.md` |
| T-20-04 | E-20 | Layered auth — global role + provider-scoped gating | ready | T-20-01 | `.plan/epics/20-provider-entity-refactor/tasks/04-layered-auth.md` |
| T-20-05 | E-20 | Panel `$providerId` routing + My Providers + switcher + onboarding | ready | T-20-01, T-20-04 | `.plan/epics/20-provider-entity-refactor/tasks/05-panel-routing-and-my-providers.md` |
| T-21-01 | E-21 | `get-public-profile` condo contract | ready | T-20-02 | `.plan/epics/21-verified-resident-stamp/tasks/01-get-public-profile-condo-contract.md` |
| T-21-02 | E-21 | Verified stamp UI + i18n keys | ready | T-21-01 | `.plan/epics/21-verified-resident-stamp/tasks/02-verified-stamp-ui-and-i18n.md` |
| T-21-03 | E-21 | i18n pt/en parity pass + cross-surface E2E matrix | ready | T-21-02, T-20-05 | `.plan/epics/21-verified-resident-stamp/tasks/03-i18n-parity-and-e2e-matrix.md` |
## Migration Note

- The active workflow has been cut over to `.plan/`.
- Legacy `.specify/memory/` artifacts are preserved for archival retrieval while historical epics are backfilled.
