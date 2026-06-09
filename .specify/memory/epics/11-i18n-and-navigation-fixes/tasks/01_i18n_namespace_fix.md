---
type: feature
epic: 11-i18n-and-navigation-fixes
status: completed
blocked-by: 10-playwright-setup
---

## What to Build

Fix the i18n namespace mismatch and remove hardcoded Portuguese strings in panel components. All `useTranslation('sidebar')` calls must become `useTranslation()` (default namespace `translation`). Hardcoded `<h1>Meus Anúncios</h1>` in announcements.tsx and any same pattern in configuration.tsx must be replaced with i18n `t()` calls. Ralph Loop flags additional hardcoded strings as they're encountered during other tasks.

## Context

PRD-v6 Slice 2. `i18n.ts` registers resources under namespace `translation` (not `sidebar`). The `sidebar` key is a top-level key inside the `translation` namespace JSON. All panel components currently call `useTranslation('sidebar')` which requests a non-existent namespace.

## Acceptance Criteria

- [ ] No `useTranslation('sidebar')` calls remain in any panel component
- [ ] All panel components use `useTranslation()` (no argument)
- [ ] `panel/dashboard/announcements.tsx` uses `t('sidebar.item.announcements')` or equivalent — NOT the hardcoded string `<h1>Meus Anúncios</h1>`
- [ ] `panel/dashboard/configuration.tsx` uses i18n `t()` — NOT a hardcoded Portuguese string
- [ ] Sidebar group labels and item labels render in Portuguese (or English) — NOT as raw i18n key paths
- [ ] Playwright smoke test (from epic 10) passes — no `sidebar.*` key patterns visible in the rendered sidebar
- [ ] `bun run check` and `bun run check-types` pass with no errors

## Sub-Tasks

### Sub-task 1: Fix useTranslation calls in panel.tsx

**What to do:** In `apps/web/src/routes/panel.tsx`, find all `useTranslation('sidebar')` calls and replace with `useTranslation()`. Add a `t` function variable from the hook and update all sidebar label references to use `t('sidebar.*')` calls.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** `bun run check` passes. Sidebar labels render as translated text, not key paths.

### Sub-task 2: Fix useTranslation calls in spectrum.tsx

**What to do:** Same fix as sub-task 1 for `apps/web/src/routes/panel/spectrum.tsx`.

**Files to touch:** `apps/web/src/routes/panel/spectrum.tsx`

**Verification:** `bun run check` passes. Spectrum item label renders as translated text.

### Sub-task 3: Fix useTranslation calls in language-switcher.tsx

**What to do:** Same fix for `apps/web/src/components/language-switcher.tsx`.

**Files to touch:** `apps/web/src/components/language-switcher.tsx`

**Verification:** `bun run check` passes.

### Sub-task 4: Fix hardcoded Portuguese in announcements.tsx

**What to do:** In `apps/web/src/routes/panel/dashboard/announcements.tsx`, replace the hardcoded `<h1>Meus Anúncios</h1>` with `<h1>{t('sidebar.item.announcements')}</h1>` (or the correct i18n key). Use `useTranslation()` at the top of the file.

**Files to touch:** `apps/web/src/routes/panel/dashboard/announcements.tsx`

**Verification:** Page heading renders from i18n, not a hardcoded string.

### Sub-task 5: Fix hardcoded Portuguese in configuration.tsx

**What to do:** Check `apps/web/src/routes/panel/dashboard/configuration.tsx` for any hardcoded Portuguese strings. Replace with `useTranslation()` + `t()` calls.

**Files to touch:** `apps/web/src/routes/panel/dashboard/configuration.tsx`

**Verification:** Page renders from i18n, not hardcoded strings.

### Sub-task 6: Run Playwright smoke test

**What to do:** Run `bun run test:e2e` and confirm the sidebar smoke test passes. If it fails, self-correct until it passes.

**Files to touch:** None (verification only)

**Verification:** `bun run test:e2e` exits with code 0.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step.</!-->
