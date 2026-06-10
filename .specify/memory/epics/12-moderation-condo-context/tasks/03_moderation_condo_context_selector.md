---
type: feature
epic: 12-moderation-condo-context
status: completed
blocked-by: 01_moderation_condo_info_backend
---

## What to Build

Condo context selector as the first item in the Moderation nav group. Visually distinct from nav items. Single condo: display name only (non-interactive, no chevron). Two+ condos: display name + dropdown to switch. localStorage key `mod_ctx__cndo`. Init fallback: localStorage → first assignment → nothing. Cleanup: delete key if zero assignments.

## Context

PRD-v6 Slice 7. Depends on `getCondominiumInfo` (epic 12 task 01) to resolve condo names for the dropdown. The selector is a custom UI component, not a `SidebarMenuButton`.

## Acceptance Criteria

- [ ] Selector is the first item in the Moderation nav group, visually distinct from nav items
- [ ] Single condo assigned: displays condo name only, non-interactive, no dropdown chevron
- [ ] Two+ condos assigned: displays condo name + dropdown chevron, clicking opens a list of condo names
- [ ] Switching condos writes the new `condominiumId` to `mod_ctx__cndo` in localStorage
- [ ] On init: if stored `condominiumId` is not in current assignments, fall back to first assignment and overwrite localStorage
- [ ] On zero assignments: the Moderation group does not render (no condo to show, no selector to show)
- [ ] Playwright test covers: single condo display, multi-condo dropdown + switching, localStorage write on switch
- [ ] `bun run check` and `bun run check-types` pass with no errors

## Sub-Tasks

### Sub-task 1: Create CondoSelector component

**What to do:** Create `apps/web/src/components/condo-selector.tsx`. The component:
1. Reads `mod_ctx__cndo` from localStorage on mount
2. Fetches the moderator's assignments (from `getMyAssignments` or a dedicated query)
3. If stored ID not in assignments: fall back to first assignment, overwrite localStorage
4. If zero assignments: return null (don't render anything)
5. If one condo: render a display-only element showing the condo name (no chevron, non-interactive)
6. If 2+ condos: render the condo name + a chevron, clicking opens a dropdown list of condo names
7. On selection: update localStorage `mod_ctx__cndo` with the new `condominiumId`
8. Uses `useTranslation()` for all labels

**Files to touch:** `apps/web/src/components/condo-selector.tsx`

**Verification:** Component renders correctly in both single and multi condo scenarios.

### Sub-task 2: Integrate CondoSelector into panel.tsx Moderation group

**What to do:** In `apps/web/src/routes/panel.tsx`, add the `CondoSelector` as the first item inside the Moderation `SidebarGroup`, before the Announcements and Residents nav items.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Selector appears as first item in Moderation group, before Announcements.

### Sub-task 3: Add Playwright test for CondoSelector

**What to do:** Add `tests/condo-selector.spec.ts` that:
1. Logs in as a moderator with exactly 1 condo assignment → asserts selector shows condo name, no dropdown chevron
2. Logs in as a moderator with 2 condo assignments → asserts dropdown chevron is visible, clicking shows a list of 2 condos
3. Switches to the second condo → asserts localStorage `mod_ctx__cndo` is updated
4. Reloads the page → asserts the previously selected condo is still displayed

**Files to touch:** `apps/web/tests/condo-selector.spec.ts`

**Verification:** `bun run test:e2e` passes.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step.</!-->
