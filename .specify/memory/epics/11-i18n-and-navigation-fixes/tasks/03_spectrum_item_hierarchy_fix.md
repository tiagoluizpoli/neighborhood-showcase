---
type: feature
epic: 11-i18n-and-navigation-fixes
status: ready
blocked-by: 10-playwright-setup
---

## What to Build

Fix the Spectrum item hierarchy. Currently a `SidebarMenuButton` for Spectrum exists at the root level of the sidebar (outside any group), in addition to the correct one inside the `SpectrumGroup`. Remove the root-level one — Spectrum item must only exist as a child inside the Spectrum group.

## Context

PRD-v6 Slice 4. The Spectrum group label is correct. Only the item placement is wrong.

## Acceptance Criteria

- [ ] No `SidebarMenuButton` for Spectrum exists outside the Spectrum group
- [ ] Spectrum item appears only as a child of the Spectrum group
- [ ] ADMINISTRATOR role can see the Spectrum item inside the Spectrum group
- [ ] Playwright test verifies Spectrum item is NOT a top-level sidebar item and IS visible inside the Spectrum group
- [ ] `bun run check` and `bun run check-types` pass with no errors

## Sub-Tasks

### Sub-task 1: Remove root-level Spectrum item from panel.tsx

**What to do:** In `apps/web/src/routes/panel.tsx`, find any `SidebarMenuButton` for Spectrum that is a direct child of `SidebarMenu` (not inside a `SidebarGroup`). Remove it. The Spectrum item inside the `SpectrumGroup` remains untouched.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Spectrum item is only visible inside the Spectrum group, not at the top level.

### Sub-task 2: Add Playwright test for Spectrum hierarchy

**What to do:** Add `tests/spectrum-nav.spec.ts` that:
1. Logs in as an ADMINISTRATOR user
2. Navigates to `/panel`
3. Asserts the Spectrum group label is visible
4. Asserts the Spectrum item is visible INSIDE the Spectrum group
5. Asserts NO top-level (root-level) Spectrum item exists

**Files to touch:** `apps/web/tests/spectrum-nav.spec.ts`

**Verification:** `bun run test:e2e` passes.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step.</!-->
