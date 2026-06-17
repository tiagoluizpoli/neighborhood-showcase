# PRD-v6 — Panel i18n, Navigation Hierarchy & Moderation Condo Context

## Problem Statement

Ralph Loop iteration 37 left four classes of defects in the panel:

1. **i18n returns raw keys.** `useTranslation('sidebar')` requests a namespace that doesn't exist. The `translation` namespace is registered, not `sidebar`. All sidebar labels render as `sidebar.group.provedor`, `sidebar.item.dashboard`, etc.
2. **Hardcoded Portuguese strings** in `panel/dashboard/announcements.tsx` and `panel/dashboard/configuration.tsx`.
3. **Wrong navigation hierarchy.** Provider group nests Announcements + Configuration inside a `SidebarMenuSub` (collapsible) while Dashboard is top-level — all three should be siblings. Spectrum's item is at root level instead of inside the Spectrum group.
4. **Missing Moderation pages.** No "Condominium Info" page exists for moderators. Multi-condo switching has no UI.
5. **No frontend E2E testing.** No Playwright setup exists. Every UI change lacks automated verification.

## Solution

Fix the i18n namespace, flatten the Provider navigation, add the Moderation Condominium Info page and condo context selector, fix Spectrum hierarchy, and establish Playwright as mandatory for all UI work.

## User Stories

1. As a panel user, I want all sidebar labels to display in my language (Portuguese or English), not raw i18n keys, so I can navigate correctly.
2. As a moderator, I want to see information about the condominium I moderate (name, address, contact), so I can verify and share it.
3. As a moderator assigned to multiple condominiums, I want to switch between them from inside the Moderation nav group, so I can work on any condo without logging in and out.
4. As a moderator assigned to a single condominium, I want to see the condo name as context inside the Moderation nav group, so I always know which condo I'm working in.
5. As a provider, I want Dashboard, Announcements, and Configuration to be equally visible as siblings in the Provider nav group, so navigation is flat and predictable.
6. As an administrator, I want the Spectrum item to appear only inside the Spectrum group, not at the top level of the sidebar.
7. As a developer, I want every UI change to have a Playwright test, so regressions are caught before delivery.

## Implementation Decisions

### 1. i18n namespace fix

**Root cause:** `i18n.ts` registers resources under namespace `translation`:
```ts
const resources = {
  en: { translation: translationEN },
  pt: { translation: translationPT },
};
```
Every panel component calls `useTranslation('sidebar')` — requesting namespace `sidebar` which doesn't exist.

**Fix:** Change all `useTranslation('sidebar')` calls to `useTranslation()` (default namespace `translation`). The `sidebar` top-level key already exists in both JSON files.

**Files to touch:**
- `apps/web/src/routes/panel.tsx`
- `apps/web/src/routes/panel/spectrum.tsx`
- `apps/web/src/components/language-switcher.tsx`
- All panel route components using i18n

### 2. Hardcoded Portuguese removal

- `panel/dashboard/announcements.tsx` line 10: `<h1>Meus Anúncios</h1>` → `useTranslation()` + `t('...')`
- `panel/dashboard/configuration.tsx`: check for same pattern and fix

### 3. Provider navigation — flatten sub-menu

**Current:**
```
Provider group
├── Dashboard           ← top-level SidebarMenuButton
└── [Announcements, Configuration]  ← SidebarMenuSub (collapsible)
```

**Target:**
```
Provider group
├── Dashboard           ← SidebarMenuButton (sibling)
├── Announcements      ← SidebarMenuButton (sibling)
└── Configuration      ← SidebarMenuButton (sibling)
```

Remove `SidebarMenuSub` wrapper. All three become `SidebarMenuItem` > `SidebarMenuButton` siblings.

### 4. Spectrum item hierarchy fix

**Current:** `SidebarMenuButton` for Spectrum exists at the `SidebarMenu` level (outside any group), in addition to the correct one inside the `SidebarGroup`.

**Target:** Only one `SidebarMenuButton` for Spectrum — inside the `SpectrumGroup`, as a child of it.

### 5. Moderation — Condominium Info page

**Route:** `/panel/moderation/condominium`

**Component:** `panel/moderation/condominium.tsx`

**Position in nav:** First item in the Moderation group (before Announcements and Residents).

**Display (read-only):** name, city, state, CEP, contactInfo (email, phone, website).

**Backend:** No new endpoint needed — the existing `getMyAssignments` tRPC procedure already returns `condominium` attached. However, `AssignmentWithCondo` only exposes `{ name, city, state }`. A new tRPC procedure `getCondominiumInfo` will be created (Option B per user decision) that takes `condominiumId` and returns full condominium details.

### 6. Moderation — Condo context selector

**Position:** First item inside the Moderation nav group. Visually distinct from nav items (not a nav link — a context display/selector).

**UI behavior:**
- One condo assigned: display condo name (no dropdown indicator — not interactive)
- Two+ condos assigned: display condo name + dropdown chevron → opens condo list
- Zero condos: selector does not render (Moderation group itself won't render if no assignments)

**localStorage:** key = `mod_ctx__cndo`, value = `condominiumId` string.
- Written on every selection change.
- On init: if stored `condominiumId` not in current assignments → fall back to first assignment, overwrite localStorage.
- On assignment removal: if selected condo is removed from all assignments → fall back to first remaining assignment, overwrite localStorage.
- If no assignments remain → delete `mod_ctx__cndo` from localStorage entirely.

### 7. Moderation nav group — order

**New order:** Condominium Info (first), Announcements, Residents.

### 8. Backend — new tRPC procedure for condominium details

**Router:** `assignmentRouter`
**Procedure:** `getCondominiumInfo`
**Input:** `{ condominiumId: string }`
**Output:** Full condominium object (name, city, state, cep, contactInfo, addressId, number, latitude, longitude, status).
**Authorization:** Caller must have an approved MODERATOR or RESIDENT assignment for that `condominiumId`.

## Testing Decisions

- **i18n smoke test:** Playwright test mounts the sidebar (as each role variant) and asserts that visible text is NOT any i18n key pattern (`sidebar.*`, `moderation.*`, etc.) — it must be actual Portuguese or English strings.
- **Navigation structure test:** Playwright asserts Provider group has exactly 3 direct child buttons (Dashboard, Announcements, Configuration) with correct labels.
- **Condo selector test:** Playwright creates a user with 1 condo assignment → asserts selector shows condo name. Creates user with 2 assignments → asserts dropdown appears and switching updates the selector display and localStorage.
- **Hardcoded string test:** Playwright asserts the announcements page heading is NOT `Meus Anúncios` hardcoded — it should match the translated value from i18n.

## Out of Scope

- Síndico (person in charge) field — not in the Condominium entity. Added to backlog.
- Multi-provider context switching (provider assigned to multiple places) — added to backlog.
- Editing condominium data by moderators — read-only for now.
- Full Spectrum dashboard content — placeholder only. Backend routes exist; frontend placeholder is sufficient.
- Playwright setup for anything beyond the web app.

## Further Notes

- The `sidebar.reports` → `sidebar.spectrum` rename was partially done in prior iterations. Confirm all keys use `spectrum` and no `reports` references remain in sidebar i18n keys.
- The condo context selector styling must be distinct from nav items — consider a card-like treatment or subtle separator. The responsibility is on the implementer to make it look good.
- All translation keys must be in English (e.g., `sidebar.group.spectrum`, not `sidebar.group.espectro`). Values are in the respective language.
