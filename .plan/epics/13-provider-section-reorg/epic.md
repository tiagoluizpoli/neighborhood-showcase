---
type: epic
id: E-13
name: "Provider Section Reorg"
status: done
blocked-by: []
---

## About this Epic

Reorg the Provider experience into four focused surfaces: Conta e Segurança (User identity only), Configurações (Provider Profile only), Meus Anúncios (dedicated list + detail page), and a slim summary dashboard. This epic also fixes the Provider sidebar visibility rule and expands the public provider page branding surface.

## Context

Canonical PRD: `.plan/prds/PRD-v7-provider-section-reorg.md`

Canonical grilling session: `.plan/grilling/2026-06-10-provider-section-reorg-grilling.md`

This epic was migrated from the legacy `.specify/memory/epics/13-provider-section-reorg/` workflow during the Ralph Loop cutover on 2026-06-17. Tasks 01–07 were already completed before migration. Tasks 08–10 remain.

## Child Tasks

| Task ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| T-13-01 | Schema migrations | done | — | `.plan/epics/13-provider-section-reorg/tasks/01-schema-migrations.md` |
| T-13-02 | Provider profile backend | done | — | `.plan/epics/13-provider-section-reorg/tasks/02-provider-profile-backend.md` |
| T-13-03 | Provider profile router | done | — | `.plan/epics/13-provider-section-reorg/tasks/03-provider-profile-router.md` |
| T-13-04 | Shrink user update and DTOs | done | — | `.plan/epics/13-provider-section-reorg/tasks/04-shrink-user-update-and-dtos.md` |
| T-13-05 | Configurações page | done | — | `.plan/epics/13-provider-section-reorg/tasks/05-configuracoes-page.md` |
| T-13-06 | Conta e Segurança | done | — | `.plan/epics/13-provider-section-reorg/tasks/06-conta-e-seguranca.md` |
| T-13-07 | Meus Anúncios list | done | — | `.plan/epics/13-provider-section-reorg/tasks/07-meus-anuncios-list.md` |
| T-13-08 | Meus Anúncios detail | done | — | `.plan/epics/13-provider-section-reorg/tasks/08-meus-anuncios-detail.md` |
| T-13-09 | Dashboard slim and sidebar | done | — | `.plan/epics/13-provider-section-reorg/tasks/09-dashboard-slim-and-sidebar.md` |
| T-13-10 | Public page and ADRs | done | — | `.plan/epics/13-provider-section-reorg/tasks/10-public-page-and-adrs.md` |

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update .plan/index.md in the same turn. -->
