---
type: feature
epic: 13-provider-section-reorg
status: ready
blocked-by: 07_meus_anuncios_list.md
---

## What to Build

Create the new detail route at `/panel/dashboard/announcements/:id` with view mode (default) + inline edit mode + inline analytics section. View mode: full announcement presentation (image, title, subtitle, description, price, category, tags, contact links, status, dates, payment/expiry info). Edit mode: toggled by an "Editar" button; view fields become editable form fields; "Salvar" and "Cancelar" buttons appear; "Cancelar" reverts the form to the loaded data; "Salvar" calls the existing `announcement.update` tRPC procedure (no change to the procedure). Analytics section: same KPIs + small chart + period selector that the deleted dashboard modal had, but inline. Back link: "← Voltar para Meus Anúncios". Route guard: if the user is not a Provider, redirect to `/panel/account`; if the announcement is not found or not owned by the calling user, redirect to `/panel/dashboard/announcements` with a toast. DELETE the two modals from the dashboard: `-provider-dashboard-edit-modal.tsx` and `-provider-dashboard-analytics-modal.tsx`. Add a Playwright E2E test for the view → edit → save → reload flow and for the 404/not-mine redirect.

## Context

Module 25 of `/PRD.md`, §"Frontend: Meus Anúncios detail page". Depends on task 07 (the list page that links to this detail route must exist). The detail page's edit flow reuses the existing `announcement.update` tRPC procedure — NO change to the backend. The analytics section reuses the existing `announcement.getAnalytics` query and the chart component that was in the deleted modal — refactor the chart out of the modal into a shared component if it isn't already. Per the user's rule: no test.skip, Playwright tests for every UI change. The modals being deleted means the dashboard (in its current form) loses its edit + analytics affordances — task 09 rebuilds the dashboard as a slim view that no longer embeds the list.

## Acceptance Criteria

- [ ] New file `apps/web/src/routes/panel/dashboard/announcements/$id.tsx` (or equivalent) exists at the new URL `/panel/dashboard/announcements/:id`
- [ ] View mode shows: image, title, subtitle, description, price, category, tags, contact links, status, dates, payment/expiry info
- [ ] Edit mode toggles via an "Editar" button; fields become editable; "Salvar" + "Cancelar" appear; "Cancelar" reverts to loaded data
- [ ] "Salvar" calls the EXISTING `announcement.update` tRPC procedure (no backend change)
- [ ] Inline analytics section renders below the announcement: KPIs + small chart + period selector (7d/30d/12m)
- [ ] Back link "← Voltar para Meus Anúncios" navigates to `/panel/dashboard/announcements`
- [ ] Route guard: non-Provider → redirect to `/panel/account`; not-found or not-mine → redirect to `/panel/dashboard/announcements` with a toast
- [ ] The two modals `apps/web/src/routes/panel/-provider-dashboard-edit-modal.tsx` and `-provider-dashboard-analytics-modal.tsx` are DELETED
- [ ] Page uses full-width layout
- [ ] Playwright E2E test covers: log in as provider, navigate to a detail page, edit a field, save, reload, assert persistence; navigate to a non-existent id, assert redirect to list with a toast; navigate to another provider's ad, assert redirect to list with a toast
- [ ] NO `test.skip()`
- [ ] `bun run check` and `bun run check-types` pass with zero warnings

## Sub-Tasks

### Sub-task 1: Refactor the chart out of the deleted modal

**What to do:** Before deleting the modals, extract the chart component and the analytics KPI strip from `-provider-dashboard-analytics-modal.tsx` into a reusable component (e.g. `apps/web/src/components/announcement-analytics.tsx`). The detail page will use this new component for its inline analytics section. The dashboard slim view (task 09) will reuse it for the chart card.

**Files to touch:** new component file (create), `-provider-dashboard-analytics-modal.tsx` (refactor to use the new component)

**Verification:** The new component renders correctly in isolation; the modal still works before deletion.

### Sub-task 2: Build the detail page

**What to do:** Create the new route file at the `announcements/$id.tsx` (or equivalent) path. View mode fetches the announcement via the existing tRPC procedure. Edit mode toggles local state; the form fields are bound to the loaded data. On save, call `trpc.announcement.update`. On cancel, reset the form to the loaded data. Analytics section uses the refactored component from sub-task 1. Back link. Route guards per Module 25 §"Frontend: Meus Anúncios detail page". Full-width layout.

**Files to touch:** the new route file

**Verification:** Page renders correctly in dev; edit flow works; route guards redirect correctly on not-found and not-mine.

### Sub-task 3: Delete the two modals

**What to do:** Delete `apps/web/src/routes/panel/-provider-dashboard-edit-modal.tsx` and `apps/web/src/routes/panel/-provider-dashboard-analytics-modal.tsx`. Search the codebase for any other consumer of these modals and remove the imports. The dashboard (in its current form) will lose its edit + analytics affordances — task 09 rebuilds it as a slim view.

**Files to touch:** the two modal files (delete), any consumers (update)

**Verification:** `bun run check-types` passes; no broken imports.

### Sub-task 4: Playwright E2E test

**What to do:** Create `apps/web/tests/announcement-detail.spec.ts`. Tests: (1) log in as provider, navigate to a detail page, click "Editar", change `title`, click "Salvar", reload, assert the new title persists; (2) navigate to `/panel/dashboard/announcements/non-existent-id`, assert redirect to list with a toast; (3) as Provider A, try to access Provider B's announcement, assert redirect to list with a toast. NO `test.skip()`.

**Files to touch:** `apps/web/tests/announcement-detail.spec.ts` (new), the test seed file (extend if needed)

**Verification:** `bun run test:e2e` is green; all 3 scenarios pass for real.

---


<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
