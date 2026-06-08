---
type: feature
epic: 06-panel-layout
status: pending
blocked-by: null
---

## What to Build

Install and configure the shadcn Radix Sidebar as the panel's navigation foundation, with 280px width, correct CSS variable scoping for `[data-theme="panel"]`, and all four navigation groups stubbed with their visibility rules in place (Provedor, Moderação, Administração, Reports).

## Context

- Panel layout is at `apps/web/src/routes/panel.tsx`
- shadcn Sidebar components already exist in `packages/ui/components/sidebar/`
- Need to upgrade from basic sidebar to Radix Sidebar with proper `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`
- Four groups: Provedor (Provider Assignment enabled=true), Moderação (approved MODERATOR assignment), Administração (SYSTEM_MANAGER or ADMINISTRATOR), Reports (ADMINISTRATOR only)
- Visibility rules are checked at render time from session data

## Acceptance Criteria

- [ ] Sidebar components (SidebarProvider, Sidebar, SidebarGroup, SidebarGroupLabel) render without errors
- [ ] Sidebar is 280px wide with no label overflow
- [ ] Four nav groups render with correct visibility conditions per role/assignment
- [ ] Group labels are sourced from i18n ('sidebar' namespace), not hardcoded

## Sub-Tasks

### Sub-task 1: Install/upgrade shadcn sidebar components

**What to do:** Run `npx shadcn@latest add sidebar` in `apps/web` if not already present. Verify `packages/ui/components/sidebar/` has all required sub-components: `sidebar.tsx`, `sidebar-menu.tsx`, `sidebar-header.tsx`, `sidebar-content.tsx`, `sidebar-group.tsx`, `sidebar-group-label.tsx`, `sidebar-footer.tsx`, `sidebar-trigger.tsx`.

**Files to touch:** `packages/ui/components/sidebar/`, `apps/web/src/routes/panel.tsx`

**Verification:** `pnpm build` succeeds with sidebar components imported.

### Sub-task 2: Set280px sidebar width

**What to do:** Set `--sidebar-width: 280px` in the panel's CSS or theme config. Override the default 256px. Verify Portuguese labels (e.g. "Configurações") fit without truncation.

**Files to touch:** `apps/web/src/routes/panel.tsx`, `apps/web/src/app.css` or theme file

**Verification:** Visual check: sidebar at 280px, no label overflow.

### Sub-task 3: Stub four nav groups with visibility rules

**What to do:** In `panel.tsx`, render all four `SidebarGroup` blocks (Provedor, Moderação, Administração, Reports) with visibility conditions:
- Provedor: `hasProviderAssignmentWithEnabledTrue(session)`
- Moderação: `hasApprovedModeratorAssignment(session)`
- Administração: `user.role === 'SYSTEM_MANAGER' || user.role === 'ADMINISTRATOR'`
- Reports: `user.role === 'ADMINISTRATOR'`

Use placeholder `SidebarMenuButton` items for now — nesting comes in the next slice.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Each role/assignment combination shows the correct groups (tested in Slice 8).

### Sub-task 4: Add SidebarGroupLabel localization hook

**What to do:** Add `SidebarGroupLabel` with i18n key `sidebar.group.provedor`, `sidebar.group.moderacao`, `sidebar.group.administracao`, `sidebar.group.reports`. Use `useTranslation('sidebar')`.

**Files to touch:** `apps/web/src/routes/panel.tsx`, `locales/pt/translation.json`, `locales/en/translation.json`

**Verification:** Group labels render from i18n, not hardcoded.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
