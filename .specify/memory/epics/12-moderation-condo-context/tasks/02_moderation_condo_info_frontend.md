---
type: feature
epic: 12-moderation-condo-context
status: ready
blocked-by: 01_moderation_condo_info_backend
---

## What to Build

New route `/panel/moderation/condominium` with a read-only page that displays condominium information (name, city/state, CEP, contact info). First item in the Moderation nav group, before Announcements and Residents.

## Context

PRD-v6 Slice 6. Backend procedure `getCondominiumInfo` exists (epic 12 task 01). This task builds the frontend page and adds it to the navigation.

## Acceptance Criteria

- [ ] Route `/panel/moderation/condominium` renders a page (not a 404)
- [ ] Page displays read-only condominium info: name, city/state, CEP, contactInfo (email, phone, website)
- [ ] Page is the first item in the Moderation nav group (before Announcements)
- [ ] Page fetches data from `getCondominiumInfo` tRPC procedure
- [ ] Loading state shown while data is fetching
- [ ] Error state shown if the call fails
- [ ] Playwright test verifies the page renders with condo info and no raw i18n keys
- [ ] `bun run check` and `bun run check-types` pass with no errors

## Sub-Tasks

### Sub-task 1: Create condominium.tsx page component

**What to do:** Create `apps/web/src/routes/panel/moderation/condominium.tsx`. The component should:
1. Use `useTranslation()` for all labels
2. Read the selected `condominiumId` from `mod_ctx__cndo` in localStorage (fall back to first assignment if not set)
3. Call `getCondominiumInfo` tRPC procedure with that `condominiumId`
4. Render a read-only info card with: name, city/state, CEP, contactInfo (email, phone, website)
5. Show a loading skeleton while fetching
6. Show an error message if the call fails

**Files to touch:** `apps/web/src/routes/panel/moderation/condominium.tsx`

**Verification:** Page renders at `/panel/moderation/condominium` with condo data visible.

### Sub-task 2: Add route to panel router

**What to do:** Add the new route to the panel router configuration so `/panel/moderation/condominium` is recognized.

**Files to touch:** `apps/web/src/routes/panel.tsx` (or the router config)

**Verification:** Route navigates without404.

### Sub-task 3: Add Playwright test for Condominium Info page

**What to do:** Add `tests/moderation-condo-info.spec.ts` that:
1. Logs in as a moderator with at least one condo assignment
2. Navigates to `/panel/moderation/condominium`
3. Asserts the page loads without error
4. Asserts the condo name is visible on the page
5. Asserts no raw i18n key patterns are visible

**Files to touch:** `apps/web/tests/moderation-condo-info.spec.ts`

**Verification:** `bun run test:e2e` passes.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step.</!-->
