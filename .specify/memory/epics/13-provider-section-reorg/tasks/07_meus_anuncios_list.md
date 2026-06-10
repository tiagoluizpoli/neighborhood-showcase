---
type: feature
epic: 13-provider-section-reorg
status: ready
blocked-by: 06_conta_e_seguranca.md
---

## What to Build

Replace the placeholder at `/panel/dashboard/announcements` with the real Meus Anúncios list page. Header: "Meus Anúncios" + "+ Criar Anúncio" primary button (links to the existing PT create route — per the "act on PT names" rule, that route will be translated to `/panel/dashboard/announcements/new` in this task too, since the page that links to it is being rewritten). 4 tabs: Ativos / Rascunhos & Pendentes / Expirados / Suspensos, each with a count badge. State is component-local (no URL state in this pass). Reuse the existing announcement card component. Each card is a `<Link>` to the detail page. Empty state per tab with "Criar Anúncio" button. Apply full-width layout. Add a Playwright E2E test that asserts the 4 tabs and the count badges and that clicking a card navigates to the detail page.

## Context

Module 25 of `/PRD.md`, §"Frontend: Meus Anúncios list". Depends on task 05 (the Configurações route guard / sidebar group is in place; the dashboard slim view comes in task 09 and removes the announcement list from the dashboard). Existing placeholder route: `apps/web/src/routes/panel/dashboard/announcements.tsx`. Existing card component: `apps/web/src/routes/panel/-provider-dashboard-announcement-list.tsx` (reuse, not rewrite). Per `agents.local.md` §4 (full-width), §5 (English in all code). The create route is `/panel/dashboard/anuncios/novo` (PT) — translate to `/panel/dashboard/announcements/new` as part of this task (the placeholder page links to it; if it's not translated, the empty-state CTA and the header CTA will be broken after this task lands). Per the user's rule: no test.skip, Playwright tests for every UI change.

## Acceptance Criteria

- [ ] `apps/web/src/routes/panel/dashboard/announcements.tsx` is replaced with the real Meus Anúncios list page
- [ ] Page header is "Meus Anúncios" + "+ Criar Anúncio" primary button on the right
- [ ] 4 tabs render in order: Ativos / Rascunhos & Pendentes / Expirados / Suspensos, each with a count badge
- [ ] Each tab is a `Tabs.Trigger` from shadcn with the count as a `Badge`
- [ ] `activeTab` is component-local state (`useState`), NOT a URL search param
- [ ] Existing card component is reused (no rewrite of the card visual or DOM)
- [ ] Each card is a `<Link>` to `/panel/dashboard/announcements/:id` (the new detail page from task 08)
- [ ] Empty state per tab: "Nenhum anúncio ativo" + "Criar Anúncio" button (links to the create route)
- [ ] Create route is translated: `/panel/dashboard/anuncios/novo` → `/panel/dashboard/announcements/new` (file rename + URL + import graph update)
- [ ] All UI labels come from the `meus_anuncios` i18n namespace (keys English, values pt + en)
- [ ] Page uses full-width layout; no `mx-auto max-w-*` on the top-level wrapper
- [ ] Playwright E2E test covers: log in as a provider with announcements in 3 of 4 buckets → assert all 4 tabs render with correct counts → assert clicking a card navigates to `/panel/dashboard/announcements/:id`
- [ ] NO `test.skip()`; the test extends the seed to have announcements in all 4 buckets
- [ ] `bun run check` and `bun run check-types` pass with zero warnings

## Sub-Tasks

### Sub-task 1: Add `meus_anuncios` i18n namespace

**What to do:** Add a new `meus_anuncios` top-level key to both `apps/web/src/locales/en/translation.json` and `apps/web/src/locales/pt/translation.json`. Namespace contains: page title + subtitle, 4 tab labels, the "Criar Anúncio" button label, 4 empty-state messages (one per tab), count badge label format.

**Files to touch:** `apps/web/src/locales/en/translation.json`, `apps/web/src/locales/pt/translation.json`

**Verification:** `bun run check-types` passes; both files are valid JSON.

### Sub-task 2: Translate the create route to English

**What to do:** Rename the existing PT create route file and URL. The current file is `apps/web/src/routes/panel/dashboard/anuncios/novo.tsx` (or similar) with URL `/panel/dashboard/anuncios/novo`. Rename to `panel/dashboard/announcements/new.tsx` with URL `/panel/dashboard/announcements/new`. Update all consumers (imports, sidebar links, redirects). Log any other PT-named items found in the touched area as new `deferred` rows in `.specify/memory/backlog.md`.

**Files to touch:** the create route file (rename), any internal consumers

**Verification:** `bun run check-types` passes; no broken imports; the route is reachable at the new URL.

### Sub-task 3: Build the list page

**What to do:** Replace `apps/web/src/routes/panel/dashboard/announcements.tsx` placeholder with the real list page. Reuse the existing card component. Filter announcements by status client-side (4 buckets: active, draft+pending, expired, suspended — per the existing `announcement.status` enum). Each card wraps in a `<Link to={...}>`. Tabs use shadcn `Tabs`. `activeTab` is local state. Header has a "+ Criar Anúncio" button linking to the (now-translated) create route. Empty state per tab. Apply full-width layout. Route guard: if the calling user has no Provider Assignment with `enabled = true`, redirect to `/panel/account` (per Module 25 §"Sidebar" Q10).

**Files to touch:** `apps/web/src/routes/panel/dashboard/announcements.tsx`

**Verification:** Page renders correctly in dev; the 4 tabs work; clicking a card navigates to the (yet-to-be-built) detail page route.

### Sub-task 4: Playwright E2E test

**What to do:** Create `apps/web/tests/meus-anuncios.spec.ts`. Tests: (1) log in as a provider with announcements in all 4 buckets → assert all 4 tabs render → assert each tab's count badge shows the correct number; (2) click a card → assert URL changes to `/panel/dashboard/announcements/:id` (the detail route can be a placeholder for now — task 08 will fill it in; the redirect for the not-yet-built detail can be a `404` for the test); (3) switch to the "Rascunhos" tab → assert only draft cards are shown. NO `test.skip()` — extend the seed to have at least one announcement in each of the 4 buckets.

**Files to touch:** `apps/web/tests/meus-anuncios.spec.ts` (new), the test seed file (extend)

**Verification:** `bun run test:e2e` is green; all 3 scenarios pass for real.

---


<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
