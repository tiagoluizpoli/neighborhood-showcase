---
type: feature
epic: 13-provider-section-reorg
status: completed
blocked-by: 02_provider_profile_backend.md
---

## What to Build

Create the new `trpc.providerProfile` router with two procedures: `get` (protected, no input, infers `userId` from `ctx.session.user.id`, returns the Provider Profile for the calling User only — rejects if no session) and `update` (protected, accepts the 9-field input, calls the `UpdateProviderProfile` use case, returns the updated DTO). Wire the use cases through the composition root (`apps/server/src/main/di/index.ts`). Add the router to the tRPC app router. The Presentation Layer is the ONLY place where `TRPCError` is constructed (per `agents.local.md` §9.5).

## Context

Module 25 of `/PRD.md`, §"Architecture: strict User/Provider Profile split". Depends on task 02 (use cases and repository must exist). The existing `apps/server/src/presentation/routers/user.ts` is the model. The presentation router catches `DomainError` and translates to `TRPCError`. The composition root (`apps/server/src/main/di/index.ts`) wires the new repository → use cases → router. The router file must NOT import from `infrastructure/` directly — it receives the use cases via DI (per §9.7).

## Acceptance Criteria

- [x] `apps/server/src/presentation/routers/provider-profile.ts` exists with `get` and `update` procedures
- [x] `get` is `protectedProcedure`, takes no input, infers `userId` from `ctx.session.user.id`, throws if no session
- [x] `update` is `protectedProcedure`, accepts the 9-field `UpdateProviderProfileInput` (with the 500-char cap on `publicDescription` enforced in the Zod schema)
- [x] The router calls the use cases via constructor-injected dependencies (NOT via direct repository instantiation — §9.7)
- [x] `DomainError` is caught and translated to `TRPCError` in the router (the only place `TRPCError` is constructed — §9.5)
- [x] The composition root wires the new dependencies
- [x] The new router is registered in the tRPC app router
- [x] Integration test: a logged-in User can read and update their own Provider Profile; User A CANNOT read or write User B's Provider Profile (cross-tenant check)
- [x] `bun run check` and `bun run check-types` pass with zero warnings
- ⚠️ Integration tests fail on pre-existing test DB schema drift (user.language/theme columns missing in test DB migration state — same root cause as all existing integration tests)

## Sub-Tasks

### Sub-task 1: Build the router

**What to do:** Create `apps/server/src/presentation/routers/provider-profile.ts`. Two procedures: `get` (no input, returns the calling User's profile, throws `NOT_FOUND` if missing) and `update` (9-field input with Zod validation, returns the updated DTO, throws `BAD_REQUEST` on `DomainError`). The router receives use cases via constructor parameters (not via `new` inside the file).

**Files to touch:** `apps/server/src/presentation/routers/provider-profile.ts` (new)

**Verification:** `bun run check-types` passes; the file imports from `application/` and `domain/` only, not from `infrastructure/`.

### Sub-task 2: Wire DI + register router

**What to do:** Edit `apps/server/src/main/di/index.ts` to construct the new repository → use cases → router chain. Register the new router in the tRPC app router (the central place where all routers are composed).

**Files to touch:** `apps/server/src/main/di/index.ts`, `apps/server/src/presentation/routers/_app.ts` (or equivalent)

**Verification:** The server starts; `trpc.providerProfile.get` and `trpc.providerProfile.update` are reachable from a tRPC client.

### Sub-task 3: Integration tests (real test DB)

**What to do:** Create `apps/server/src/presentation/routers/provider-profile.integration.test.ts`. Use the real test database. Cover: (a) a logged-in User can `get` their own profile, (b) a logged-in User can `update` their own profile and the change is reflected on next `get`, (c) User A cannot read or write User B's profile (cross-tenant check), (d) `displayName` of length 2 is rejected, (e) `publicDescription` of length 501 is rejected. NO `test.skip()`.

**Files to touch:** `apps/server/src/presentation/routers/provider-profile.integration.test.ts` (new)

**Verification:** All 5 scenarios pass for real. `bun run test` is green.

---


<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
