---
type: feature
epic: 12-moderation-condo-context
status: ready
blocked-by: 10-playwright-setup
---

## What to Build

New tRPC procedure `getCondominiumInfo` in a new `condominium` router. Input: `{ condominiumId: string }`. Output: full condominium object (name, city, state, cep, contactInfo, addressId, number, latitude, longitude, status). Authorization: caller must have an approved MODERATOR or RESIDENT assignment for that condominiumId.

## Context

PRD-v6 Slice 5. The existing `getMyAssignments` returns only `{ name, city, state }`. The Condominium Info page and condo context selector both need full condominium data. This is the backend half of the feature — frontend is epic12 task 02.

## Acceptance Criteria

- [ ] New router file `apps/server/src/presentation/routers/condominium.ts` exists and exports a tRPC router
- [ ] New procedure `getCondominiumInfo` accepts `{ condominiumId: string }` and returns the full Condominium entity data
- [ ] Authorization check: caller must have an approved MODERATOR or RESIDENT assignment for the requested `condominiumId` — throw `UNAUTHORIZED` otherwise
- [ ] Procedure is registered in the main tRPC app router
- [ ] Unit test covers: authorized caller gets full data, unauthorized caller gets error
- [ ] `bun run check` and `bun run check-types` pass with no errors

## Sub-Tasks

### Sub-task 1: Create condominium router

**What to do:** Create `apps/server/src/presentation/routers/condominium.ts`. Implement a tRPC router with a `getCondominiumInfo` procedure:
- Input: `z.object({ condominiumId: z.string() })`
- Output: full Condominium DTO (all fields from the entity)
- Use the existing `getMyAssignments` logic to verify the caller has an approved MODERATOR or RESIDENT assignment for the requested `condominiumId`
- Throw `TRPCError` with code `UNAUTHORIZED` if the caller is not assigned to that condominium

**Files to touch:** `apps/server/src/presentation/routers/condominium.ts`

**Verification:** Router file exists and exports a valid tRPC router.

### Sub-task 2: Register router in app router

**What to do:** Import and register the new `condominium` router in the main tRPC app router (`apps/server/src/presentation/routers/root.ts` or similar).

**Files to touch:** `apps/server/src/presentation/routers/root.ts` (or the main router file)

**Verification:** `bun run check` passes. Router is accessible via tRPC.

### Sub-task 3: Add unit test for getCondominiumInfo

**What to do:** Add a test file for `getCondominiumInfo` that covers:
1. Caller with approved MODERATOR assignment for the condo → gets full data
2. Caller with approved RESIDENT assignment for the condo → gets full data
3. Caller with no assignment for the condo → throws UNAUTHORIZED
4. Caller with PENDING assignment → throws UNAUTHORIZED

**Files to touch:** `apps/server/src/presentation/routers/condominium.test.ts` (or similar)

**Verification:** `bun run test` passes for the new test file.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step.</!-->
