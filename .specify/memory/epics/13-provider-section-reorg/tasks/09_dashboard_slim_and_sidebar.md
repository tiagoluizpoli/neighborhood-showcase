---
type: feature
epic: 13-provider-section-reorg
status: ready
blocked-by: 08_meus_anuncios_detail.md
---

## What to Build

Slim the dashboard (`/panel/dashboard`) to a true "at a glance" view. Header (provider name, existing). 4-card KPI strip (Visualizações / Interações / Taxa de Conversão / Anúncios combined card with 4 sub-buckets Ativos → Rascunhos → Expirados → Suspensos in lifecycle order, small colored dots). Chart card (180px tall, full width, 3 series incl. conversion, period selector 7d/30d/12m). NO announcement list, NO edit modal, NO analytics modal on this page. Fix the Provedor sidebar group: change `GROUP_PROVEDOR.condition` from `true` to `hasProviderAssignmentWithEnabledTrue(session, assignments)`. Add route guards on `/panel/dashboard/configuration` and `/panel/dashboard/announcements` so direct-URL access by a non-Provider redirects to `/panel/account`. Update the sidebar footer avatar to show `user.image` if set (the existing `AvatarImage` automatically falls back to `AvatarFallback` for initials). Apply the full-width layout rule. Add a Playwright E2E test that asserts the slim view (no announcement list), the 4 cards, the chart, the sidebar visibility rule, and the route guard.

## Context

Module 25 of `/PRD.md`, §"Frontend: Dashboard (slim view)" and §"Sidebar". Depends on tasks 05 + 06 + 07 + 08 (the new pages exist; the modals are deleted from task 08; the sidebar's Provedor group only routes to real pages after this task). Existing route file: `apps/web/src/routes/panel/-provider-dashboard-content.tsx` (and its sub-components `-provider-dashboard-performance-overview.tsx`, `-provider-dashboard-announcement-list.tsx`). The Provedor sidebar group condition is in `apps/web/src/routes/panel.tsx`. Per `agents.local.md` §4 (full-width layout), §6 (role-based navigation). Per the user's rule: no test.skip, Playwright tests for every UI change.

## Acceptance Criteria

- [ ] Dashboard renders: header (provider name) + 4-card KPI strip + chart card (180px tall, full width, period selector)
- [ ] KPI Card 4 (Anúncios combined) shows 4 sub-buckets in order: Ativos → Rascunhos → Expirados → Suspensos, with small colored dots
- [ ] Dashboard has NO announcement list, NO edit modal, NO analytics modal
- [ ] Dashboard fits in a 1280×1024 viewport with no scroll (page height ≤ ~880px in the panel main area) — Playwright test asserts the body scrollHeight is within bounds
- [ ] `GROUP_PROVEDOR.condition` in `panel.tsx` is changed from `true` to `hasProviderAssignmentWithEnabledTrue(session, assignments)`
- [ ] `/panel/dashboard/configuration` and `/panel/dashboard/announcements` redirect to `/panel/account` if the user has no Provider Assignment with `enabled = true`
- [ ] Sidebar footer avatar shows `user.image` if set; falls back to initials otherwise (existing `AvatarImage` + `AvatarFallback`)
- [ ] Page uses full-width layout; no `mx-auto max-w-*` on the top-level wrapper
- [ ] Playwright E2E test covers: log in as provider with announcements in all 4 buckets → assert the 4 cards + chart render → assert no announcement list is visible → assert the page fits in a 1280×1024 viewport; log in as a non-provider user → assert the Provedor sidebar group is NOT visible; log in as non-provider, direct-URL access to `/panel/dashboard/configuration`, assert redirect to `/panel/account`
- [ ] NO `test.skip()`; the test extends the seed if needed
- [ ] `bun run check` and `bun run check-types` pass with zero warnings

## Sub-Tasks

### Sub-task 1: Rebuild the KPI strip + chart sub-components

**What to do:** Refactor `apps/web/src/routes/panel/-provider-dashboard-performance-overview.tsx` into a 4-card KPI strip (Visualizações / Interações / Taxa de Conversão / Anúncios combined). The Anúncios combined card renders 4 sub-buckets in lifecycle order. Extract the chart into a reusable sub-component (or reuse the one extracted in task 08). Strip the announcement list (`-provider-dashboard-announcement-list.tsx`) from this page — it now lives on `/panel/dashboard/announcements` (task 07).

**Files to touch:** the dashboard content and performance overview files

**Verification:** The dashboard renders the 4 cards + chart in dev; no announcement list is visible.

### Sub-task 2: Fix the Provedor sidebar group condition

**What to do:** Edit `apps/web/src/routes/panel.tsx`. Find `GROUP_PROVEDOR.condition` (currently `true`) and change it to `hasProviderAssignmentWithEnabledTrue(session, assignments)` — a function that checks the user's assignments (a query that already exists) and returns `true` iff the user has at least one Provider Assignment with `enabled = true`. The other groups (Moderação, Administração, Spectrum) keep their existing conditions. Update the sidebar footer avatar: show `user.image` if set, fall back to initials (the standard shadcn `AvatarImage` + `AvatarFallback` pattern).

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** A non-provider user does not see the Provedor group; a provider with `enabled = false` does not see it either; a provider with `enabled = true` does.

### Sub-task 3: Add route guards for the new Provider pages

**What to do:** Edit `/panel/dashboard/configuration` and `/panel/dashboard/announcements` route files (the real pages built in tasks 05 and 07) to add a route guard: if the calling user has no Provider Assignment with `enabled = true`, redirect to `/panel/account` with a toast. Reuse the same guard function from sub-task 2.

**Files to touch:** the two route files

**Verification:** Direct-URL access by a non-provider redirects to `/panel/account` with a visible toast.

### Sub-task 4: Playwright E2E test

**What to do:** Create `apps/web/tests/dashboard.spec.ts`. Tests: (1) log in as a provider with announcements in all 4 buckets → assert 4 cards + chart render → assert NO announcement list is visible → assert the body scrollHeight is within the 1280×1024 viewport bound; (2) log in as a non-provider user → assert the Provedor sidebar group is NOT visible; (3) log in as non-provider, direct-URL access to `/panel/dashboard/configuration`, assert redirect to `/panel/account` with a visible toast; (4) as a provider with `user.image` set, log in, navigate to dashboard, assert the sidebar footer shows the image; (5) as a provider without `user.image`, assert the footer shows initials. NO `test.skip()`.

**Files to touch:** `apps/web/tests/dashboard.spec.ts` (new), the test seed file (extend)

**Verification:** `bun run test:e2e` is green; all 5 scenarios pass for real.

---


<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
