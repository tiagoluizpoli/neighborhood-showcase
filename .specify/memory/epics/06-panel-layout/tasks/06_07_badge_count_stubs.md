---
type: feature
epic: 06-panel-layout
status: ready
blocked-by: null
---

## What to Build

Stub all three badge counts to 0 on the Moderação section. Add the three tRPC read-only endpoints (`announcement.pendingCount`, `assignment.pendingCount`, `report.openCount`) so the frontend has the query hooks ready — currently they return 0, but the wiring is in place for when the backend is implemented.

## User Review Findings (reopened) — CRITICAL

The previous implementation introduced a new tRPC router `apps/server/src/presentation/routers/report.ts` that **directly imports `drizzle-orm` and the `@neighborhood-showcase/db` client** and calls `db.select(...).from(reportSchema)` inside a tRPC query. This is a **blatant Clean Architecture violation** (RULES.md §1.5, FORBIDDEN imports) and was caught by `bun run check:arch` (the new dependency-cruise guardrail added on 2026-06-09).

Even worse, the *concept* was wrong: the user did NOT want a "report" badge count router for the Spectrum sidebar block. The original PRD term "Reports" in Module 23 was ambiguous between the **moderation `report` table** (user-flagged announcements) and the **admin operator analytics block** (later renamed "Spectrum"). The previous implementation conflated the two and built the wrong thing for the right place.

The proper replacement is a new task `06_09_spectrum_top_level_block.md` that builds the Spectrum block using the correct Clean Architecture pattern. For THIS task (badge count stubs), the requirements are:

1. **Remove `apps/server/src/presentation/routers/report.ts` entirely.** It is gone.
2. **Revert the `report.openCount` query added to `panel.tsx` for the Spectrum group badge** — there should be no Spectrum badge count until 06_09 lands a real count.
3. Keep `announcement.pendingCount` and `assignment.pendingCount` (these are real and useful for the Moderação group). BUT they too may be implemented as direct DB calls in the router — refactor them to use the proper layer pattern (Domain → Application → Presentation) if they currently violate it. Grep for `drizzle-orm` and `@neighborhood-showcase/db` imports under `apps/server/src/presentation/` and fix any matches.
4. The new `bun run check:arch` command must pass after this task. The 6 pre-existing tRPC violations in application/use-cases (generate-payment-intent, approve-condominium, request-assignment, reject-assignment, approve-assignment, create-announcement) are tracked separately and are NOT this task's responsibility, but they will block `bun run check` — Ralph must decide: either fix them as part of this pass, OR add a temporary exemption in `.dependency-cruiser.cjs` for the application/use-cases/payment and application/use-cases/condominium subpaths, with a clear note that they are tech debt.

Re-read RULES.md §1 (clean architecture) and §12 (Ralph conduct) before implementing.

## Context

- Badge counts appear next to "Anúncios" and "Moradores" in the Moderação section
- tRPC router is in `apps/api/src/routers/` (check `announcement.ts`, `assignment.ts`, `report.ts`)
- Frontend queries via TanStack Query (check existing tRPC query patterns)

## Acceptance Criteria

- [ ] Badge components show 0 next to Anúncios and Moradores in Moderação section
- [ ] tRPC endpoint announcement.pendingCount returns { count: number }
- [ ] tRPC endpoint assignment.pendingCount returns { count: number }
- [ ] tRPC endpoint report.openCount returns { count: number }
- [ ] Badge components are wired to the three tRPC queries

## Sub-Tasks

### Sub-task 1: Stub badge counts in sidebar to 0

**What to do:** In `panel.tsx`, add `Badge` components next to "Anúncios" and "Moradores" in the Moderação section. Set initial value to `0`. The query hooks will replace these later.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Badge shows "0" next to each item.

### Sub-task 2: Add announcement.pendingCount tRPC endpoint

**What to do:** In `announcement.ts` router, add a public read-only procedure `pendingCount` that returns `COUNT(*)` of PENDING announcements for the given condominium (or global if no condominiumId). Currently returns `0` or a simple query.

**Files to touch:** `apps/api/src/routers/announcement.ts`

**Verification:** Endpoint returns a number. Response is `{ count: number }`.

### Sub-task 3: Add assignment.pendingCount tRPC endpoint

**What to do:** In `assignment.ts` router, add a public read-only procedure `pendingCount` that returns `COUNT(*)` of PENDING resident assignments.

**Files to touch:** `apps/api/src/routers/assignment.ts`

**Verification:** Endpoint returns a number.

### Sub-task 4: Add report.openCount tRPC endpoint

**What to do:** In `report.ts` router, add a public read-only procedure `openCount` that returns `COUNT(*)` of OPEN reports.

**Files to touch:** `apps/api/src/routers/report.ts`

**Verification:** Endpoint returns a number.

### Sub-task 5: Wire badge counts to tRPC queries

**What to do:** In `panel.tsx`, replace the hardcoded `0` badge values with TanStack Query calls to the three new endpoints. Use `trpc.announcement.pendingCount.useQuery()`, etc.

**Files to touch:** `apps/web/src/routes/panel.tsx`

**Verification:** Badge counts render from tRPC (stubbed to 0 for now).

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
