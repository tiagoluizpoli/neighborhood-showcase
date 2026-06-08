---
type: feature
epic: 06-panel-layout
status: pending
blocked-by: null
---

## What to Build

Top bar layout: `SidebarTrigger` (hamburger, left) + `ModeToggle` (existing component, right) + new `LanguageSwitcher` component (right). No user menu in top bar — moved to SidebarFooter.

## Context

- Panel header is at `apps/web/src/routes/-header.tsx` (check actual path)
- `ModeToggle` already exists: find it and move it to the panel header
- `SidebarTrigger` comes from `@neighborhood-showcase/ui/components/sidebar`
- `LanguageSwitcher` is new: icon button opening a `Popover` with 🇧🇷 Português and 🇺🇸 English options

## Acceptance Criteria

- [ ] SidebarTrigger (hamburger) appears on left of panel header and toggles sidebar
- [ ] ModeToggle appears on right of panel header and switches light/dark theme
- [ ] LanguageSwitcher opens popover with 🇧🇷 Português and 🇺🇸 English options
- [ ] Selecting a language calls i18n.changeLanguage() and persists to localStorage

## Sub-Tasks

### Sub-task 1: Add SidebarTrigger to panel header

**What to do:** Import `SidebarTrigger` from the sidebar components. Place it on the left side of the panel header. Verify it toggles the sidebar open/closed.

**Files to touch:** `apps/web/src/routes/-header.tsx` (or panel header file)

**Verification:** Hamburger icon appears left. Clicking it opens/closes the sidebar.

### Sub-task 2: Move ModeToggle to panel header

**What to do:** Find the existing `ModeToggle` component. Move it to the panel header (right side). It should already work with `next-themes` `useTheme`.

**Files to touch:** `apps/web/src/routes/-header.tsx`

**Verification:** Moon/sun toggle appears in panel header. Clicking it toggles theme.

### Sub-task 3: Create LanguageSwitcher component

**What to do:** Create `LanguageSwitcher` component:
- Icon button (globe or flag icon)
- Opens a `Popover` with two options: 🇧🇷 Português (value: `pt`) and 🇺🇸 English (value: `en`)
- On select: calls `i18n.changeLanguage(selectedLang)`
- Persists preference via `i18next-browser-languagedetector` in `localStorage` (no backend write)

**Files to touch:** `apps/web/src/components/language-switcher.tsx`, `apps/web/src/routes/-header.tsx`

**Verification:** Popover opens, language changes, preference persists in localStorage.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
