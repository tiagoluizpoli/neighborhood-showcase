---
type: grill-handoff
source-session: .plan/grilling/2026-06-10-provider-section-reorg-grilling.md
date: 2026-06-17
status: active
---

# Current Grill Handoff — Provider Section Reorg

## Canonical session

- Current grilling session: `.plan/grilling/2026-06-10-provider-section-reorg-grilling.md`

## Why it matters

This session locked the product and UI decisions behind PRD-v7. Ralph Loop should not re-grill these unless the user explicitly changes scope.

## Decisions that still directly constrain unfinished work

For task 08:
- announcement detail page is a real page, not a modal
- inline edit + inline analytics live on the detail page
- route guard redirects not-found/not-mine to the list with a toast

For task 09:
- dashboard is summary-only, no embedded announcement list
- 4 KPI cards + compact chart
- Provedor sidebar group hidden unless provider assignment `enabled = true`
- route guards redirect non-providers to `/panel/account`
- sidebar footer avatar uses `user.image` when present

For task 10:
- public provider page renders banner only when present
- layout order is banner → identity → social links → Sobre → announcements
- rendered public name is `displayName`, not `User.name`
- write ADR 0005 and ADR 0006 as part of the task

## Migration note

The legacy global grilling log was archived to `.plan/archive/legacy-specify-memory/grilling_history.md`. Use it only for historical retrieval, not as the default hot-path planning surface.
