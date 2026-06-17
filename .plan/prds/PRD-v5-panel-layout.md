# PRD v5: Panel Layout — Sidebar and Top Bar Redesign

## Problem Statement

The authenticated panel (`/panel/*`) has an outdated, basic sidebar and missing essential controls in the top bar. The sidebar lacks visual depth (no nesting, no badge counts), theme and language toggles are absent, and the user identity lives in the top bar instead of a proper sidebar footer. All visible text must be localized.

---

## Solution

Upgrade the panel layout to use the shadcn Radix Sidebar with a 280px width, nested navigation per group, live badge counts on moderation queues (stubbed to 0), and a SidebarFooter with user identity. The top bar carries the `SidebarTrigger` (hamburger), a theme toggle (moon/sun icon button), and a language toggle (flag popover). All UI labels are i18n-managed.

---

## Sidebar Structure

```
Provedor (Provider Assignment with enabled=true)
  └─ Dashboard (top-level item)
  └─ Meus Anúncios (nested → /panel/dashboard/announcements)
  └─ Configurações (nested → /panel/dashboard/configuration)

Moderação (approved MODERATOR assignment)
  └─ Anúncios (nested)
  └─ Moradores (nested)

Administração (SYSTEM_MANAGER or ADMINISTRATOR role)
  └─ Visão Geral (nested)
  └─ Usuários (nested)
  └─ Providers (nested)
  └─ Condomínios (nested)

Reports (ADMINISTRATOR role only — top-level block)
  └─ (placeholder)
```

**Visibility rules** (checked at render time from session data):
- **Provedor**: visible iff User has a Provider Assignment with `enabled = true`
- **Moderação**: visible iff User has at least one APPROVED MODERATOR assignment
- **Administração**: visible iff `user.role ∈ {SYSTEM_MANAGER, ADMINISTRATOR}`
- **Reports**: visible iff `user.role === ADMINISTRATOR`

---

## User Stories

1. As a Provider, I want my sidebar to show nested items under "Provedor" (Dashboard, Meus Anúncios, Configurações), so that I can navigate to all my provider tools from one place.
2. As a Provider, I want to see badge counts on the "Moderação" section showing pending announcements, pending residents, and open reports (stubbed to 0 for now), so that the structure is ready for live data when the backend endpoints exist.
3. As a Provider, I want the sidebar to persist its collapsed/expanded state across reloads, so that my preferred layout is restored on return.
4. As a Provider, I want my user identity (avatar, name, email) and account actions (Conta, Sair) to appear in the sidebar footer, so that I can access my account without looking in the top bar.
5. As a Provider, I want a theme toggle in the top bar that switches between light and dark mode, so that I can work in my preferred visual theme.
6. As a Provider, I want a language toggle in the top bar that switches between Portuguese and English via a flag popover, so that I can use the platform in my preferred language.
7. As a Provider, I want all sidebar labels and UI text to be localized, so that the platform is fully available in both Portuguese and English.
8. As a Moderator, I want the sidebar to show only the "Moderação" group (Anúncios, Moradores) when I have no provider assignment, so that I see a focused, relevant navigation.
9. As a Moderator, I want badge counts on each moderation queue item (stubbed to 0), so that the structure is ready for live data.
10. As a System Manager, I want the sidebar to show "Administração" (Visão Geral, Usuários, Providers, Condomínios) when I have that role, so that I can access all admin tools.
11. As an Administrator, I want a "Reports" top-level block in the sidebar, so that I can access reporting tools separate from administration.
12. As a System Manager or Administrator, I do NOT want to see the "Provedor" block unless I have a provider assignment, so that my navigation stays scoped to my role.
13. As an authenticated user, I want the sidebar to be 280px wide when expanded, so that labels are fully readable without truncation.
14. As a Visitor (public portal), I want zero changes to my experience, so that the public side remains unaffected by panel improvements.
15. As a Provider who opts out during onboarding, I never want a Provider Assignment created, so that the Provedor section never appears for me.

---

## Implementation Decisions

### Sidebar component
shadcn Radix Sidebar (`@neighborhood-showcase/ui/components/sidebar`) — already present in `packages/ui`. Upgrade usage to support `SidebarMenuSub` nesting, `SidebarFooter` with user identity, and `SidebarGroupLabel` localization.

### Sidebar width
280px (wider than default 256px) to accommodate longer Portuguese labels without truncation.

### Nested menus
Each sidebar group uses `SidebarMenu` > `SidebarMenuItem` > `SidebarMenuButton` (top-level) + `SidebarMenuSub` > `SidebarMenuSubItem` > `SidebarMenuSubButton` (nested). Nested items are indented with the sub-arrow indicator.

### Badge counts
Stubbed to 0 for this PRD. Three new tRPC read-only endpoints will be needed later:
- `announcement.pendingCount(condominiumId?)` → count of PENDING announcements
- `assignment.pendingCount(condominiumId?)` → count of PENDING resident assignments
- `report.openCount(condominiumId?)` → count of OPEN reports

### SidebarFooter
User avatar (initials fallback), name, email, "Conta" link, "Sair" button. Based on sidebar-07 `nav-user` pattern.

### Top bar
`SidebarTrigger` (hamburger, left) + `ModeToggle` (existing component, right) + `LanguageSwitcher` (new, right). No user menu in top bar — moved to SidebarFooter.

### LanguageSwitcher component
Icon button that opens a `Popover` with two options: 🇧🇷 Português (value: `pt`) and 🇺🇸 English (value: `en`). Selection calls `i18n.changeLanguage()`. Preference persisted via `i18next-browser-languagedetector` in `localStorage` only (no backend write for MVP).

### Theme toggle
Existing `ModeToggle` component (moon/sun icon button) reused in header. State managed by `useTheme` from `next-themes`.

### Sidebar collapse persistence
`SidebarProvider` `defaultOpen` prop reads from `localStorage` key `sidebar:state`. Persisted on toggle via `useSidebar` `setOpen` callback.

### Route stubs needed
- `panel/dashboard/announcements` → placeholder for "Meus Anúncios" (future full list page)
- `panel/dashboard/configuration` → placeholder for Provider configuration (future dedicated page)

### Localization
All sidebar group labels (`Provedor`, `Moderação`, `Administração`, `Reports`), item labels, badge count labels, and user menu items added to `locales/pt/translation.json` and `locales/en/translation.json` under a `sidebar` namespace key.

### Routing language
Mixed PT/EN route naming deferred to separate backlog item. Current routes remain as-is for this PRD scope.

---

## Testing Decisions

**What makes a good test**: Test external behavior only — sidebar renders correct groups for a given role/assignment combination, badge counts render (stubbed to 0), theme/language toggles produce the expected state change. Do NOT test internal sidebar component state or i18n library internals.

**Modules to test**:
- `panel.tsx` — visibility rule enforcement (mock session with each role/assignment combination)
- `header.tsx` — theme toggle and language toggle render and respond to interaction
- `LanguageSwitcher` — flag popover opens, language changes, preference persists in localStorage
- `SidebarFooter` — user info renders from session data

**Prior art**: Existing tests in `apps/web/src/routes/-header.test.tsx` and `apps/web/src/routes/-moderation.test.tsx` cover header and session-based rendering patterns. Follow the same `beforeEach` + mock session approach.

---

## Out of Scope

- Backend language preference persistence (per-user, across devices) — deferred to backlog
- Full announcement list page ("Meus Anúncios") — stub route only
- Full provider configuration page — stub route only
- Mixed-language route naming fix (PT → EN) — deferred to backlog
- Branding (name, logo, color palette) — deferred
- Reports section content — placeholder block only
- Admin provider management, admin condominium management — deferred to backlog
- Provider `enabled` flag toggle UI — deferred to provider configuration page
- Live badge counts — stubbed to 0, backend endpoints deferred to backlog

---

## Further Notes

- The `enabled` flag on Provider Assignment is a public visibility toggle (not an approval toggle). Disabled providers are hidden from the public directory but visible to Administrators.
- SYSTEM_MANAGER and ADMINISTRATOR do NOT see the "Provedor" block unless they independently hold a provider assignment. The block is capability-based, not role-based.
- Badge count endpoints must be lightweight (single `COUNT(*)` queries) to avoid sidebar mount overhead.
- Provider Assignment with `enabled = false` means the provider has manually toggled their public availability off. Record is preserved so they can re-enable later. Opt-out during onboarding means no record is created at all.