---
type: task
id: T-20-04
epic: E-20
status: in-progress
blocked-by: [T-20-01]
default-model: high
---

## What to Build

Layer the authorization model so platform-level actions and provider-scoped actions are cleanly separated and no user can act on a provider they do not own. Keep a minimal global `user.role` for platform level (admin vs ordinary user). Gate every provider-scoped action (manage announcements/profile, soft-delete a provider, etc.) by BOTH ownership (`provider.ownerId === user.id`) AND the active provider's APPROVED assignment where the action requires standing. Pin down explicitly which actions are platform-admin vs provider-scoped to avoid permission leaks across a single user's own providers. This must land before panel routing (T-20-05), which relies on the gating to protect `$providerId`-scoped routes.

## Context

Global role: `packages/db/src/schema/auth.ts`. Auth/procedure plumbing: `apps/server/src/presentation/trpc.ts`, `apps/server/src/presentation/context.ts`. Existing protected procedures + admin routers: `apps/server/src/presentation/routers/admin.ts`, and provider-scoped routers `provider-profile.ts`, `announcement/provider.ts`, `assignment.ts`. The `Provider` entity/repository (T-20-01) carries `ownerId` + the ownership helper. Ownership = `provider.ownerId === user.id`; provider-scoped standing = active provider's `provider_location` (providerAssignment) status APPROVED. Open tension from the PRD: pin platform-admin vs provider-scoped actions to avoid cross-provider permission leaks.

## Acceptance Criteria

- [ ] A minimal global `user.role` distinguishes admin from ordinary user and gates platform-admin actions.
- [ ] Provider-scoped actions are gated by ownership (`provider.ownerId === user.id`) AND, where standing is required, the active provider's APPROVED assignment.
- [ ] A user cannot read/mutate a provider they do not own (cross-owner access denied); a user cannot use one of their providers' standing to act on another.
- [ ] The platform-admin vs provider-scoped action split is written down (in this task's notes or a short doc) and enforced by the procedure layer.
- [ ] Integration tests cover: admin-only action denied to ordinary user; provider-scoped action denied to non-owner; provider-scoped action denied without APPROVED assignment; owner with APPROVED assignment allowed.
- [ ] Gates pass; tests verified per-file.

## Sub-Tasks

### ST-01 - Provider-scoped authorization helper (ownership + approved assignment)

status: done
model: high
escalate-if:
- Resolving the active provider for gating requires the URL `$providerId` context owned by T-20-05 in a way that blocks server-side enforcement.

blocked-by: []

what-to-do:
- Add a reusable provider-scoped guard/procedure: resolves the target `provider.id`, asserts `provider.ownerId === user.id`, and (where the action requires standing) asserts the provider's assignment is APPROVED.
- Distinguish a check that requires only ownership from one that also requires APPROVED standing.

files-to-touch:
- `apps/server/src/presentation/trpc.ts`
- `apps/server/src/presentation/context.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-02 - Pin platform-admin vs provider-scoped actions and apply guards

status: ready
model: high
escalate-if:
- An existing action cannot be cleanly classified as platform-admin vs provider-scoped without a product decision.

blocked-by:
- ST-01

what-to-do:
- Enumerate each mutating/reading action as platform-admin (global `user.role`) vs provider-scoped (ownership ± approved assignment); record the split in the execution notes.
- Apply the global-role guard to admin actions and the provider-scoped guard to provider actions across the relevant routers.

files-to-touch:
- `apps/server/src/presentation/routers/admin.ts`
- `apps/server/src/presentation/routers/provider-profile.ts`
- `apps/server/src/presentation/routers/announcement/provider.ts`
- `apps/server/src/presentation/routers/assignment.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-03 - Authorization integration tests

status: ready
model: medium
escalate-if:
- The non-owner / no-approved-assignment denial cannot be exercised within the existing test harness.

blocked-by:
- ST-02

what-to-do:
- Add integration tests: admin-only denied to ordinary user; provider-scoped denied to non-owner; provider-scoped denied without APPROVED assignment; owner+APPROVED allowed.
- Verify per-file (cross-file `mock.module` leakage).

files-to-touch:
- `apps/server/src/presentation/routers/admin-role-management.integration.test.ts`
- `apps/server/src/presentation/routers/provider-profile.integration.test.ts`

verification:
- `bun test apps/server/src/presentation/routers/admin-role-management.integration.test.ts`
- `bun test apps/server/src/presentation/routers/provider-profile.integration.test.ts`

#### Execution Notes

- ST-01 done. Provider-scoped guard added in
  `apps/server/src/presentation/trpc.ts`:
  - `assertProviderScopedAccess(input)` — core guard. Resolves the concrete
    target `provider.id` via `ProviderRepository.findById` (already excludes
    soft-deleted), throws `NOT_FOUND` if missing, `FORBIDDEN` if
    `!provider.isOwnedBy(userId)`, and — when
    `requireApprovedAssignment: true` — `FORBIDDEN` if
    `AssignmentRepository.hasApprovedResidentAssignment(providerId)` is false.
    Returns the resolved `Provider` for callers that need it.
  - `assertProviderOwnership(input)` — ownership-only wrapper
    (`requireApprovedAssignment: false`).
  - `assertProviderApprovedStanding(input)` — ownership + APPROVED-standing
    wrapper. This is the explicit distinction required by the sub-task: reads
    and ownership-only mutations use the former; standing-requiring actions
    (e.g. publishing announcements) use the latter.
- Repositories wired through a new composition-root factory
  `apps/server/src/main/di/auth-guard.ts`
  (`createAuthGuardDependencies()` → `{ providerRepository, assignmentRepository }`),
  re-exported from `main/di/index.ts`. `trpc.ts` instantiates the deps once at
  module scope, so the presentation layer never imports infrastructure
  directly (same composition-root seam the routers already use).
- `context.ts` left unchanged: an earlier attempt added the repos to the tRPC
  request context, but that widened the `Context` type and broke ~8 existing
  integration-test call sites that hand-build `{ auth, session }` contexts for
  `createCaller`. Module-scope wiring in `trpc.ts` keeps the guard injectable
  via the composition root without forcing every test caller to supply repos.
  The `filesToTouch` hint listed `context.ts`; it was evaluated and
  intentionally not modified.
- Guards are defined but not yet applied to routers (that is ST-02) and not yet
  tested (ST-03).
- Gates: `bun run --filter server check-types` clean; root `bun run check`
  clean (pre-existing optional-chain warning + broken-symlink info only).

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
