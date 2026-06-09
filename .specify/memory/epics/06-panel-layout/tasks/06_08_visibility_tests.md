---
type: feature
epic: 06-panel-layout
status: completed
blocked-by: null
---

## What to Build

Test the panel layout: visibility rule enforcement per role/assignment, `LanguageSwitcher` popover + localStorage persistence, `SidebarFooter` renders from session, `ModeToggle` responds to interaction. Follow existing test patterns from `-header.test.tsx` and `-moderation.test.tsx`.

## Context

- Test patterns: `beforeEach` + mock session via `mockSession()` helper
- Existing tests at `apps/web/src/routes/-header.test.tsx`, `apps/web/src/routes/-moderation.test.tsx`
- Tests are black-box: verify external behavior, not internal state

## Acceptance Criteria

- [ ] Each role/assignment combination shows only the groups it should see (Provider, Moderator, SysAdmin, Admin)
- [ ] LanguageSwitcher: popover opens, language changes, preference persists in localStorage
- [ ] SidebarFooter renders user info from session correctly
- [ ] ModeToggle switches theme and persists across reload

## Sub-Tasks

### Sub-task 1: Test visibility rules for each role/assignment combo

**What to do:** Write tests in `apps/web/src/routes/-panel.test.tsx` covering:
- Provider with enabled assignment: Provedor group visible, others depend on role
- Moderator (no provider): Moderação group visible only
- System Manager: Administração group visible
- Administrator: Reports group visible
- User with no special assignment: no panel groups (redirect or empty)

Use `renderWithRouter` or the existing mock session approach.

**Files to touch:** `apps/web/src/routes/-panel.test.tsx`

**Verification:** All tests pass. Each role/combo shows correct groups.

### Sub-task 2: Test LanguageSwitcher popover and localStorage

**What to do:** Write tests for `LanguageSwitcher`:
- Popover opens on click
- Selecting a language calls `i18n.changeLanguage()`
- Preference is stored in localStorage under the i18next detector key

**Files to touch:** `apps/web/src/components/language-switcher.test.tsx`

**Verification:** All tests pass.

### Sub-task 3: Test SidebarFooter renders from session

**What to do:** Write tests for `SidebarFooter`:
- Renders user name and email from session
- Avatar shows initials when no photo
- "Conta" link points to `/panel/conta`
- "Sair" button triggers sign-out

**Files to touch:** `apps/web/src/routes/-panel.test.tsx`

**Verification:** All tests pass.

### Sub-task 4: Test ModeToggle theme toggle

**What to do:** Write or verify existing tests for `ModeToggle`:
- Toggle switches between light and dark
- Theme persists across page reload

**Files to touch:** `apps/web/src/routes/-header.test.tsx` (extend if tests exist)

**Verification:** All tests pass.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
