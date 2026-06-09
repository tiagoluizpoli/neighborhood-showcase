---
type: feature
epic: 06-panel-layout
status: completed
blocked-by: 06_07_badge_count_stubs
---

## What to Build

The "Spectrum" top-level sidebar block — the ADMINISTRATOR-only application-level reporting/analytics surface. Originally called "Reports" in PRD Module 23; renamed to "Spectrum" to disambiguate from the moderation `report` table in Module 6.

This task creates the **real** Spectrum implementation that the previous `report.ts` router shortcut was a misnamed, misarchitected stand-in for. Follow Clean Architecture per RULES.md §1 — domain entity + repository interface + Drizzle repository + mapper + use case + tRPC procedure. No direct DB calls from tRPC. No raw Drizzle in presentation.

## Context

- Disambiguation: see PRD Module 23 — Spectrum = operator analytics (charts, KPIs, audit-trail exploration, CSV/PDF exports). NOT moderation reports.
- The previous `apps/server/src/presentation/routers/report.ts` (which did `db.select` from a tRPC router) was deleted in 06_07. Do NOT recreate that pattern.
- The previous `panel.reports.tsx` placeholder (which had hardcoded Portuguese text) was also removed. Do NOT recreate that pattern.
- For this MVP iteration, the Spectrum page content can stay a placeholder. The point of this task is to establish the **proper layered architecture** for the block, not to deliver charts yet.
- The actual content (first chart, first KPI) is a separate, future task that builds on this scaffolding.

## Acceptance Criteria

- [ ] **Domain entity** `SpectrumSnapshot` (or similar) in `apps/server/src/domain/entities/spectrum/`. Subclass of `AuditableEntity<TProps>`. Read-only getters. Constructor validation. No framework imports.
- [ ] **Repository interface** `SpectrumRepository` in `apps/server/src/domain/repositories/`. Methods: `getOpenReportCount()`, `getAnnouncementCountSince(date)`, `getActiveProviderCount()`, `getUserSignupsSince(date)`. (Real list — pick the 3–5 most useful MVP queries.) Returns domain entities or primitives. No Drizzle types.
- [ ] **Drizzle repository** `DrizzleSpectrumRepository` in `apps/server/src/infrastructure/db/`. Implements `SpectrumRepository`. Uses an `EntityMapper<SpectrumSnapshotRow, SpectrumSnapshot>` in `infrastructure/db/mappers/`. Translates any `DomainError` subclasses correctly.
- [ ] **Use case** `GetSpectrumOverview` in `apps/server/src/application/use-cases/spectrum/`. Receives the `SpectrumRepository` via constructor injection. Returns a value object or list of entities. Throws only `DomainError` subclasses.
- [ ] **tRPC procedure** `spectrum.overview` in `apps/server/src/presentation/routers/spectrum.ts` (NEW file, replacing the bad `report.ts`). Marked `protectedProcedure` with `ADMINISTRATOR` role guard. Calls `GetSpectrumOverview` use case via constructor injection. Catches `DomainError` and translates to `TRPCError`. Maps the result entity to a plain JSON DTO. NO `drizzle-orm` or `@neighborhood-showcase/db` imports.
- [ ] **Wiring** at the composition root: `spectrumRouter` is registered in `app-router.ts`. Repository and use case are instantiated there and passed into the router.
- [ ] **Frontend route** `apps/web/src/routes/panel/spectrum.tsx` (NEW file, replacing the deleted `panel.reports.tsx`). Renders a placeholder panel with a title, a one-line description, and a "Em construção" / "Under construction" notice. Title and description come from the `sidebar.spectrum` i18n key. Hardcoded PT strings are forbidden.
- [ ] **Sidebar wiring** in `panel.tsx` updated to link to `/panel/spectrum` (not `/panel/reports`) and to use the i18n key `sidebar.spectrum` (not `sidebar.reports`).
- [ ] **Tests** (integration for the use case, unit for the mapper, snapshot for the route). All pass.
- [ ] **`bun run check:arch` passes** with no new violations. The Spectrum implementation must not introduce any new boundary violation. The 6 pre-existing tRPC violations in application/use-cases are a separate concern (track in deferred backlog) and Ralph should NOT need to fix them in this task; if they block `bun run check`, add a narrowly-scoped exemption in `.dependency-cruiser.cjs` and document it.

## Sub-Tasks

### Sub-task 1: Domain entity + repository interface

Define the `SpectrumSnapshot` domain entity (or whatever value object name fits) and the `SpectrumRepository` interface in `apps/server/src/domain/`. No infrastructure imports allowed in this sub-task.

**Files to touch:** `apps/server/src/domain/entities/spectrum/`, `apps/server/src/domain/repositories/spectrum-repository.ts`

**Verification:** `bun run check:arch` clean on the new files.

### Sub-task 2: Drizzle implementation + mapper

Implement `DrizzleSpectrumRepository` in `infrastructure/db/`. Add the `EntityMapper` for the row→entity translation. Wire the schema imports correctly. Throw `DomainError` subclasses, not framework errors.

**Files to touch:** `apps/server/src/infrastructure/db/spectrum-repository.ts`, `apps/server/src/infrastructure/db/mappers/spectrum-mapper.ts`

**Verification:** `bun run check:arch` clean.

### Sub-task 3: Use case

Implement `GetSpectrumOverview` in `application/use-cases/spectrum/`. Use a parameter object for inputs (RULES.md §5: no loose parameters). Constructor-inject the repository.

**Files to touch:** `apps/server/src/application/use-cases/spectrum/get-spectrum-overview.ts`

**Verification:** `bun run check:arch` clean.

### Sub-task 4: tRPC procedure + wiring

Create `apps/server/src/presentation/routers/spectrum.ts` with a `protectedProcedure` guarded to `ADMINISTRATOR`. Inject the use case at the composition root. Map entity → DTO at the edge. Translate `DomainError` → `TRPCError` here only.

**Files to touch:** `apps/server/src/presentation/routers/spectrum.ts`, `apps/server/src/main/app-router.ts`

**Verification:** `bun run check:arch` clean. The new router has zero `drizzle-orm` or `@neighborhood-showcase/db` imports. `bun x depcruise` does not flag it.

### Sub-task 5: Frontend route

Create `apps/web/src/routes/panel/spectrum.tsx` with a placeholder page. All strings via i18n (`sidebar.spectrum.title`, `sidebar.spectrum.description`, `sidebar.spectrum.under_construction`). Add the matching keys to `locales/pt/translation.json` and `locales/en/translation.json` under the `sidebar` namespace.

**Files to touch:** `apps/web/src/routes/panel/spectrum.tsx`, `locales/pt/translation.json`, `locales/en/translation.json`

**Verification:** Page renders, no hardcoded PT/EN strings, no raw i18n keys in the rendered output.

### Sub-task 6: Sidebar link update

Update `panel.tsx` to link the Spectrum group to `/panel/spectrum` (not `/panel/reports`) and to use `t('sidebar.spectrum')` for the label.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Sidebar link works, label is translated, icon is present (see 06_02 reopen notes).

### Sub-task 7: Tests

Add focused unit tests for the mapper, integration tests for the use case, and a smoke test for the frontend route. Run `bun run test` and confirm green.

**Files to touch:** as needed under `apps/server/src/**/__tests__/` and `apps/web/src/`

**Verification:** all tests pass; `bun run check`, `bun run check-types`, `bun run check:arch` all clean.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
