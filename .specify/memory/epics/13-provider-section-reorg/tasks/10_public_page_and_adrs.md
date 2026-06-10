---
type: feature
epic: 13-provider-section-reorg
status: ready
blocked-by: 09_dashboard_slim_and_sidebar.md
---

## What to Build

Update the public Provider page at `apps/web/src/routes/_portal.prestadores.$id.tsx` (or equivalent) to render the full branding set. Layout flow: hero banner (16:9, only when `bannerUrl` is set; NO placeholder, gradient, or broken image when missing) → identity card (logo + `displayName` + `companyName`/`tradeName` + verified badge) → social links → "Sobre" section (the `publicDescription` paragraph) → active announcements list. Replace `name` with `displayName` in the rendered output. Apply the full-width layout rule (no `mx-auto max-w-*`). Write the two ADRs: `docs/adr/0005-user-vs-provider-profile-strict-split.md` and `docs/adr/0006-no-centered-content-full-width-layout.md`. Add a Playwright E2E test for the public page rendering with the new branding set and the banner-omitted-when-missing behavior.

## Context

Module 25 of `/PRD.md`, §"Frontend: Public provider page" and §"ADRs". Depends on task 04 (the extended public DTO with the 4 new fields and `displayName` is live). Existing public page: `apps/web/src/routes/_portal.prestadores.$id.tsx` (TanStack Router convention; the file is likely PT-named — per the "act on PT names" rule, the file is renamed as part of this task: `_portal.prestadores.$id.tsx` → `_portal.providers.$id.tsx`, URL `/prestadores/:id` → `/providers/:id`). Per the user's rule: no test.skip, Playwright tests for every UI change. The ADRs are formal decisions; the implementation work writes them, not just follows the rules. The full-width visual rule is project-wide (not just panel).

## Acceptance Criteria

- [ ] Public Provider page renders the full branding set: hero banner (16:9, when present), logo, `displayName`, `companyName`, `tradeName`, verified badge, social links, "Sobre" section with `publicDescription`, active announcements
- [ ] When `bannerUrl` is null, NO banner block is rendered at all (no placeholder, no gradient, no broken image)
- [ ] The rendered name is `displayName` (from the Provider Profile), NOT the User's `name`
- [ ] Existing public filters are preserved: BANNED users, soft-deleted users, and `isProviderVisible = false` users are hidden
- [ ] The public route file is renamed to English: `_portal.prestadores.$id.tsx` → `_portal.providers.$id.tsx`; URL `/prestadores/:id` → `/providers/:id`; the `prestadores.*` i18n key prefix is renamed to `providers.*`
- [ ] Page uses full-width layout; no `mx-auto max-w-*` on the top-level wrapper
- [ ] `docs/adr/0005-user-vs-provider-profile-strict-split.md` is written: context, decision, alternatives considered (soft split, Company Provider as separate entity), consequences
- [ ] `docs/adr/0006-no-centered-content-full-width-layout.md` is written: context, decision, alternatives considered (keep centered, per-page opt-in, per-route-group opt-out), consequences
- [ ] Playwright E2E test covers: visit `/providers/:id` for a Provider with banner + logo + displayName + companyName + tradeName + publicDescription + social links + active announcements → assert all elements render in the locked order (banner → identity → social links → Sobre → announcements); visit a Provider without a banner → assert the banner block is NOT rendered; visit a BANNED Provider → assert the page returns 404 or not-found
- [ ] NO `test.skip()`; the test extends the seed with a Provider that has the full branding set AND a Provider without a banner
- [ ] `bun run check` and `bun run check-types` pass with zero warnings

## Sub-Tasks

### Sub-task 1: Translate the public route to English

**What to do:** Rename the public Provider page file and URL. The current file is `apps/web/src/routes/_portal.prestadores.$id.tsx` (or similar) with URL `/prestadores/:id`. Rename to `_portal.providers.$id.tsx` with URL `/providers/:id`. Update all consumers (internal links, the public shell header if it links to a Provider profile, any redirect targets). Rename the `prestadores.*` i18n key prefix to `providers.*` in both locale files. Log any other PT-named items found in the touched area as new `deferred` rows in `.specify/memory/backlog.md`.

**Files to touch:** the public route file (rename), any consumers, the i18n files

**Verification:** `bun run check-types` passes; no broken imports; the route is reachable at the new URL.

### Sub-task 2: Rebuild the public page

**What to do:** Replace the public Provider page body. The layout flow is: hero banner (16:9, only when `bannerUrl` is set; if null, NO banner block is rendered) → identity card (logo + `displayName` + `companyName`/`tradeName` + verified badge) → social links → "Sobre" section (the `publicDescription` paragraph) → active announcements list. The name rendered is `displayName` (from the Provider Profile), NOT the User's `name`. Existing public filters preserved (BANNED, soft-deleted, `isProviderVisible = false`). Full-width layout.

**Files to touch:** the public route file

**Verification:** The page renders the new branding set in dev; the banner-omitted-when-missing behavior works; a BANNED Provider is hidden.

### Sub-task 3: Write ADR 0005 (User vs Provider Profile strict split)

**What to do:** Create `docs/adr/0005-user-vs-provider-profile-strict-split.md`. Sections per the existing ADR format (look at `docs/adr/0004-layered-clean-architecture-supersedes-feature-sliced-backend.md` for the template): Status (Accepted), Context (the codebase conflated User identity and Provider Profile fields), Decision (separate the two concepts in code with separate tRPC procedures; the Conta page exposes User identity only; the Configurações page exposes Provider Profile only), Alternatives Considered (soft split — rejected; Company Provider as a separate entity — rejected as out of scope), Consequences (positive + negative).

**Files to touch:** `docs/adr/0005-user-vs-provider-profile-strict-split.md` (new)

**Verification:** The ADR follows the existing template; the decision section is unambiguous; the alternatives section names the rejected options and why.

### Sub-task 4: Write ADR 0006 (No centered content — full-width layout by default)

**What to do:** Create `docs/adr/0006-no-centered-content-full-width-layout.md`. Sections: Status (Accepted), Context (the original panel pages used `mx-auto max-w-*`, creating side margins on wide monitors), Decision (every page fills the available width; documented exceptions for auth, legal/printable, modals, intentionally-constrained marketing sections), Alternatives Considered (keep centered — rejected; per-page opt-in — rejected; per-route-group opt-out — rejected), Consequences (positive + negative). Cross-reference `agents.local.md` §4.

**Files to touch:** `docs/adr/0006-no-centered-content-full-width-layout.md` (new)

**Verification:** The ADR follows the existing template; the exceptions are explicitly enumerated.

### Sub-task 5: Playwright E2E test

**What to do:** Create `apps/web/tests/public-provider.spec.ts`. Tests: (1) visit `/providers/:id` for a Provider with banner + logo + displayName + companyName + tradeName + publicDescription + social links + active announcements → assert all elements render in the locked order; (2) visit a Provider without a banner → assert the banner block is NOT in the DOM; (3) visit a BANNED Provider's URL → assert the page returns 404 or a not-found state (NOT the profile page). NO `test.skip()` — extend the seed with both kinds of Providers.

**Files to touch:** `apps/web/tests/public-provider.spec.ts` (new), the test seed file (extend)

**Verification:** `bun run test:e2e` is green; all 3 scenarios pass for real.

---


<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
