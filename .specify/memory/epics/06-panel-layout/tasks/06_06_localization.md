---
type: feature
epic: 06-panel-layout
status: ready
blocked-by: null
---

## What to Build

Add all sidebar labels to the `sidebar` i18n namespace in both `locales/pt/translation.json` and `locales/en/translation.json`. Labels include: group names, item labels, badge count labels, user menu items, and the language switcher options.

## User Review Findings (reopened)

The previous iteration claimed localization was complete and all checks passed, but the user is seeing **the raw translation keys / paths in the sidebar** — for example `sidebar.provedor` or `sidebar.reports` is being rendered literally instead of the translated string. This means `useTranslation('sidebar')` is not actually wired up to a translation resource under the `sidebar` namespace.

Investigate and fix:

1. Confirm the `sidebar` namespace is registered in `i18n.ts` (resources config) with both `pt` and `en` JSON catalogs.
2. Confirm the translation JSON files are imported and added to the resources under the `sidebar` key.
3. Confirm `panel.tsx` calls `useTranslation('sidebar')` (not `useTranslation()`) and uses the returned `t` function.
4. Confirm the keys referenced in `panel.tsx` exist in both JSON files. Run a quick grep for `sidebar.provedor`, `sidebar.moderacao`, `sidebar.administracao`, `sidebar.spectrum`, etc.
5. Add a smoke test that mounts the sidebar with each role and asserts the visible text comes from i18n (not the raw key).
6. While in here, also rename any `sidebar.reports` keys to `sidebar.spectrum` per PRD rename. (i18n keys too — they should mirror the new PRD naming.)

Re-read RULES.md §6 before implementing.

## Context

- i18n is already set up (Module 20 from earlier PRD work)
- `sidebar` namespace doesn't exist yet — create it
- All sidebar text must come from i18n, not hardcoded strings

## Acceptance Criteria

- [ ] All sidebar labels (group names, item names, badge labels, user menu) exist in pt and en locales under 'sidebar' namespace
- [ ] No hardcoded PT/EN strings remain in sidebar components

## Sub-Tasks

### Sub-task 1: Add sidebar namespace to pt translations

**What to do:** Add the `sidebar` key to `locales/pt/translation.json` with:
- Group labels: `provedor`, `moderacao`, `administracao`, `reports`
- Item labels: `dashboard`, `meus_anuncios`, `configuracoes`, `anuncios`, `moradores`, `visao_geral`, `usuarios`, `providers`, `condominios`
- Badge labels: `pending_announcements`, `pending_residents`, `open_reports`
- User menu: `conta`, `sair`
- Language switcher: `language`, `portuguese`, `english`

**Files to touch:** `locales/pt/translation.json`

**Verification:** All sidebar labels in Portuguese come from i18n.

### Sub-task 2: Add sidebar namespace to en translations

**What to do:** Same structure as pt, translated to English.

**Files to touch:** `locales/en/translation.json`

**Verification:** All sidebar labels in English come from i18n.

### Sub-task 3: Audit for hardcoded sidebar strings

**What to do:** Search `apps/web/src/routes/panel.tsx` and sidebar components for any hardcoded PT/EN strings. Replace with `useTranslation('sidebar')` calls.

**Files to touch:** `apps/web/src/routes/panel.tsx`, sidebar components

**Verification:** No hardcoded sidebar strings remain.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
