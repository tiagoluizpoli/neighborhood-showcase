---
type: feature
epic: 06-panel-layout
status: ready
blocked-by: null
---

## What to Build

Top bar layout: `SidebarTrigger` (hamburger, left) + `ModeToggle` (existing component, right) + new `LanguageSwitcher` component (right). No user menu in top bar — moved to SidebarFooter.

## User Review Findings (reopened)

Two concrete defects in the current implementation:

### 1. Theme toggle is a popover — wrong shape

The user wants a single button that **cycles through three states on click**, NOT a popover. Cycle order:
- `system` (monitor/desktop icon) → on click → `light` (sun icon) → on click → `dark` (moon icon) → on click → `system` …
- Each state has a distinct lucide-react icon: `Monitor` (or `Laptop`), `Sun`, `Moon`.
- The button itself is the only UI — no popover, no dropdown, no "System / Light / Dark" menu.
- This is a behavior change from the existing `ModeToggle` shape. Reuse the same `next-themes` `useTheme` hook but build a cycle action instead of a popover.

### 2. Language switcher trigger is wrong, and popover got removed

- The current `LanguageSwitcher` uses a Globe icon as the trigger — wrong. The trigger must show the **flag of the currently selected language** (`🇧🇷` for `pt`, `🇺🇸` for `en`). Use the `CircleFlag` (or similar) component for round flags, or emoji flags for the MVP.
- The popover was removed at some point but it is needed. Restore the popover that lists both languages with their flags.
- Inside the popover: both options `🇧🇷 Português` and `🇺🇸 English` with their respective flag emoji or component.
- On select: calls `i18n.changeLanguage(lang)` and persists via `i18next-browser-languagedetector` in `localStorage` (no backend write for MVP).

Re-read RULES.md §10 before implementing.

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
