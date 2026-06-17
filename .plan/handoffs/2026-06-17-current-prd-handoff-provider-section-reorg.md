---
type: prd-handoff
source-prd: .plan/prds/PRD-v7-provider-section-reorg.md
date: 2026-06-17
status: active
---

# Current PRD Handoff — Provider Section Reorg

## Canonical PRD

- Current PRD: `.plan/prds/PRD-v7-provider-section-reorg.md`
- Legacy source lineage: `.specify/memory/prds/PRD-v7-provider-section-reorg.md`
- Legacy epic lineage: `.specify/memory/epics/13-provider-section-reorg/`

## What this PRD changed

PRD-v7 split the Provider experience into four focused surfaces:

1. Conta e Segurança = User identity only
2. Configurações = Provider Profile only
3. Meus Anúncios = dedicated list + detail page
4. Dashboard = slim at-a-glance view only

It also locked:
- strict User vs Provider Profile split
- full-width layout rule
- provider-only sidebar visibility rule
- no skipped Playwright tests
- public provider page branding expansion

## Current execution state at migration time

Legacy epic 13 was partially complete before the Ralph Loop cutover.

Completed in legacy workflow:
- task 01 schema migrations
- task 02 provider profile backend
- task 03 provider profile router
- task 04 shrink user update and DTOs
- task 05 configurações page
- task 06 conta e segurança
- task 07 meus anúncios list

Remaining after migration:
- task 08 meus anúncios detail
- task 09 dashboard slim and sidebar
- task 10 public page and ADRs

## Next executable work

Start from `.plan/epics/13-provider-section-reorg/tasks/08-meus-anuncios-detail.md`.

That task is the first incomplete dependency-safe item.

## Constraints to preserve

- UI changes require Playwright coverage; no `test.skip()`.
- Full-width layout rule remains active.
- English-in-code rule remains active.
- The Provedor sidebar group must only appear for users with at least one provider assignment with `enabled = true`.
- Root `/PRD.md` is historical/project-level lineage; `.plan/PRD.md` is the active Ralph Loop PRD index after migration.
