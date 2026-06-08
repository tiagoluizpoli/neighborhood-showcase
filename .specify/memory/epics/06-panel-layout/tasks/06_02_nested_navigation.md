---
type: feature
epic: 06-panel-layout
status: pending
blocked-by: null
---

## What to Build

Implement `SidebarMenuSub` nesting for each navigation group. Provedor gets Dashboard (top-level) + Meus Anúncios + Configurações (nested). Moderação gets Anúncios + Moradores (nested). Administração gets Visão Geral + Usuários + Providers + Condomínios (nested). Reports is a placeholder top-level block. Add route stubs for `panel/dashboard/announcements` and `panel/dashboard/configuration`.

## Context

- Depends on Slice1 (Sidebar Foundation)
- `SidebarMenu` > `SidebarMenuItem` > `SidebarMenuButton` (top-level) + `SidebarMenuSub` > `SidebarMenuSubItem` > `SidebarMenuSubButton` (nested)
- Route stubs needed: `/panel/dashboard/announcements` and `/panel/dashboard/configuration`
- Nested items show the sub-arrow indicator via Radix Sidebar

## Acceptance Criteria

- [ ] Provedor group: Dashboard (top-level) + Meus Anúncios + Configurações (nested with sub-arrow)
- [ ] Moderação group: Anúncios + Moradores (nested with sub-arrow)
- [ ] Administração group: all 4 items nested with sub-arrow
- [ ] Reports placeholder block visible only for ADMINISTRATOR role
- [ ] Route stubs /panel/dashboard/announcements and /panel/dashboard/configuration return 200

## Sub-Tasks

### Sub-task 1: Implement Provedor nested navigation

**What to do:** Under the Provedor `SidebarGroup`, add:
- `SidebarMenuButton` for Dashboard (top-level, links to `/panel/dashboard`)
- `SidebarMenuSub` containing `SidebarMenuSubButton` for "Meus Anúncios" (`/panel/dashboard/announcements`) and "Configurações" (`/panel/dashboard/configuration`)

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Dashboard is top-level, nested items are indented with sub-arrow.

### Sub-task 2: Implement Moderação nested navigation

**What to do:** Under the Moderação `SidebarGroup`, add `SidebarMenuSub` with:
- "Anúncios" (`/panel/moderation/announcements`)
- "Moradores" (`/panel/moderation/residents`)

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Both items render as nested under Moderação.

### Sub-task 3: Implement Administração nested navigation

**What to do:** Under the Administração `SidebarGroup`, add `SidebarMenuSub` with:
- "Visão Geral" (`/panel/admin/overview`)
- "Usuários" (`/panel/admin/users`)
- "Providers" (`/panel/admin/providers`)
- "Condomínios" (`/panel/admin/condominiums`)

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** All four items render as nested under Administração.

### Sub-task 4: Add Reports placeholder block

**What to do:** Add a top-level Reports `SidebarGroup` (ADMINISTRATOR only) with a single placeholder `SidebarMenuButton` labeled "Reports" linking to `/panel/reports` (stub — content deferred).

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Reports block visible only for ADMINISTRATOR role.

### Sub-task 5: Create route stubs

**What to do:** Create placeholder route files for:
- `panel/dashboard/announcements.tsx` — simple placeholder page
- `panel/dashboard/configuration.tsx` — simple placeholder page

Both can render a basic `div` with the page title for now.

**Files to touch:** `apps/web/src/routes/panel/dashboard/announcements.tsx`, `apps/web/src/routes/panel/dashboard/configuration.tsx`

**Verification:** Routes navigate without 404.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
