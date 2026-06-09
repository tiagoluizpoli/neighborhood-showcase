---
type: feature
epic: 11-i18n-and-navigation-fixes
status: ready
blocked-by: 10-playwright-setup
---

## What to Build

Flatten the Provider navigation group. Currently Dashboard is a top-level `SidebarMenuButton` while Announcements and Configuration are wrapped in a `SidebarMenuSub` (collapsible). All three must be direct `SidebarMenuButton` siblings under the Provider group — no sub-menu wrapper.

## Context

PRD-v6 Slice 3. Ralph Loop iteration 37 nested Announcements and Configuration inside `SidebarMenuSub` while Dashboard stayed top-level. The correct structure is all three as flat siblings.

## Acceptance Criteria

- [ ] Provider group contains exactly 3 `SidebarMenuButton` items: Dashboard, Announcements, Configuration
- [ ] No `SidebarMenuSub` wrapper exists inside the Provider group
- [ ] All three items are visible without clicking any expand/collapse toggle
- [ ] Each item links to its correct route (`/panel/dashboard`, `/panel/dashboard/announcements`, `/panel/dashboard/configuration`)
- [ ] Playwright test verifies the Provider group has exactly 3 direct child buttons with correct labels
- [ ] `bun run check` and `bun run check-types` pass with no errors

## Sub-Tasks

### Sub-task 1: Flatten Provider navigation in panel.tsx

**What to do:** In `apps/web/src/routes/panel.tsx`, find the Provider `SidebarGroup`. Remove the `SidebarMenuSub` wrapper around Announcements and Configuration. Convert all three items to direct `SidebarMenuItem` > `SidebarMenuButton` siblings under the group. Dashboard stays as-is (no `SidebarMenuSub` used anywhere in the Provider group).

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Provider group renders 3 flat buttons. No sub-arrow indicators. All routes navigate correctly.

### Sub-task 2: Add Playwright test for Provider navigation

**What to do:** Add `tests/provider-nav.spec.ts` (or append to `smoke.spec.ts`) that:
1. Logs in as a provider user
2. Navigates to `/panel`
3. Finds the Provider group
4. Asserts it has exactly 3 visible buttons
5. Asserts each button's label matches the expected i18n-translated text (Dashboard, Announcements, Configuration)
6. Asserts each button links to the correct route

**Files to touch:** `apps/web/tests/provider-nav.spec.ts`

**Verification:** `bun run test:e2e` passes.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step.</!-->
