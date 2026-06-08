---
type: feature
epic: 06-panel-layout
status: pending
blocked-by: null
---

## What to Build

Stub all three badge counts to 0 on the Moderação section. Add the three tRPC read-only endpoints (`announcement.pendingCount`, `assignment.pendingCount`, `report.openCount`) so the frontend has the query hooks ready — currently they return 0, but the wiring is in place for when the backend is implemented.

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
