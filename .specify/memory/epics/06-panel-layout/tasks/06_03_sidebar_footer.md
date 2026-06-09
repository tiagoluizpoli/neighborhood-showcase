---
type: feature
epic: 06-panel-layout
status: ready
blocked-by: null
---

## What to Build

Add `SidebarFooter` with user identity: avatar (initials fallback), name, email, "Conta" link, and "Sair" (sign out) button. Based on sidebar-07 `nav-user` pattern. User data comes from the session.

## User Review Findings (reopened)

The previous implementation put user info in the footer but treated the user row as plain text and put a logout button NEXT to it that signs out without confirmation. The user explicitly wants:

- **The whole user row is a single clickable surface** (avatar + name + email all together). It should NOT look visually like a button (no border, no background), but the entire row must be clickable.
- **Clicking the user row opens a popover** containing: "Conta" link to `/panel/conta`, "Sair" (sign out) action.
- **Sign-out must prompt for confirmation** before calling the sign-out API (use a confirm dialog or two-step popover action — NOT a native `confirm()`).
- **No inline "Sair" button next to the user row** in the footer. The popover is the only place sign-out lives.

Re-read RULES.md §10 before implementing.

## Context

- Depends on Slice 1 (Sidebar Foundation)
- SidebarFooter placed inside `Sidebar` below `SidebarContent`
- User session data available via `useSession()` or `useUser()` hook
- Avatar: shadcn `Avatar` with initials fallback (e.g., "TP" from "Tiago Poli")
- "Conta" links to `/panel/conta`
- "Sair" triggers sign-out flow

## Acceptance Criteria

- [ ] SidebarFooter shows user avatar (initials fallback) + name + email from session
- [ ] "Conta" link points to /panel/conta
- [ ] "Sair" button triggers sign-out and redirects to auth page

## Sub-Tasks

### Sub-task 1: Add SidebarFooter with avatar and user info

**What to do:** Add `SidebarFooter` component inside `Sidebar`. Use shadcn `Avatar` with initials fallback. Show `user.name`, `user.email`. Include "Conta" link and "Sair" button.

**Files to touch:** `apps/web/src/routes/panel.tsx`, `packages/ui/components/sidebar/sidebar-footer.tsx`

**Verification:** User info renders from session. Avatar shows initials when no photo.

### Sub-task 2: Implement sign-out action

**What to do:** Wire "Sair" button to the existing sign-out logic (check how sign-out is done elsewhere in the app, likely `signOut()` from `next-auth/react` or a similar auth utility).

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Clicking "Sair" redirects to the auth page.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
