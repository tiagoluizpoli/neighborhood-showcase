---
type: task
id: T-20-04
epic: E-20
status: done
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

status: done
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

status: done
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

- ST-02 done. **Action classification (the pinned split, enforced at the
  procedure/guard layer):**

  | Action | Class | Enforced by |
  | --- | --- | --- |
  | `admin.listProviders` / `listUsers` / `banProvider` / `listBlacklist` / `addBlacklist` / `removeBlacklist` / `promoteToSystemManager` / `assignModerator` / `toggleProviderVisibility` | platform-admin (global `user.role`) | `adminProcedure` |
  | `assignment.listPending` / `approve` / `reject` / `pendingCount` | condo-moderator (APPROVED MODERATOR assignment in that condo) | `checkModerator` |
  | `providerProfile.get` / `update` | provider-scoped, ownership only | `assertProviderOwnership` |
  | `announcement(provider).getDashboardData` / `update` | provider-scoped, ownership only | `assertProviderOwnership` |
  | `announcement(provider).create` | provider-scoped, ownership + APPROVED standing | `assertProviderApprovedStanding` |
  | `assignment.request` / `getMyAssignments` / `registerExternal`; `announcement(provider).getPaymentDetails` / `getPaymentStatus` / `getAnalytics` | self-scoped (operate on the session user's own data; key on `session.user.id`) | session + use-case-level announcement ownership |

  Rationale for the self-scoped row: `assignment.request` is the onboarding
  entry point (the user may not yet own a provider; `$providerId` threading is
  owned by T-20-05), and the payment/analytics announcement procedures resolve
  the provider from `session.user.id` with announcement ownership already
  enforced inside their use cases. Threading these onto `$providerId` + the
  guard is deferred to T-20-05; they are not currently a cross-provider leak
  because they only ever read the caller's own session identity.

- Changes applied:
  - `admin.ts`: every procedure converted from `protectedProcedure` +
    per-handler `checkGlobalAdmin(...)` branches to `adminProcedure`. The
    `checkGlobalAdmin` helper and its inline `FORBIDDEN` throws were removed;
    the role gate now lives in the procedure layer (identical
    `SYSTEM_MANAGER | ADMINISTRATOR` semantics).
  - `provider-profile.ts`: `get` + `update` call `assertProviderOwnership`
    on the resolved `providerId` (`input?.providerId ?? session.user.id`)
    before invoking the use case.
  - `announcement/provider.ts`: `create` calls
    `assertProviderApprovedStanding`; `update` + `getDashboardData` call
    `assertProviderOwnership`. All resolve the same transitional `providerId`
    seam.
  - `assignment.ts`: closed a permission leak — `pendingCount` was ungated
    (any authenticated user could count any condo's pending queue). Now gated
    by `checkModerator`, matching `listPending`/`approve`/`reject`.
- `context.ts` again left unchanged (same reasoning as ST-01: guards are wired
  at module scope via the composition root, not the request context).
- Existing router tests: `admin-role-management.integration.test.ts` already
  asserts non-admin callers are rejected — `adminProcedure` preserves that
  (still throws `FORBIDDEN`). No router-level test currently exercises
  `announcement(provider).create/update/getDashboardData` or
  `assignment.request/registerExternal`, so those guards do not regress
  existing suites. `provider-profile.integration.test.ts` (tests a/b) does not
  seed `provider` rows and will fail the ownership guard until ST-03 rebuilds
  its fixtures — that file is explicitly ST-03's to-touch. ST-02 gates are
  type/lint only.
- Gates: `bun run --filter server check-types` clean; root `bun run check`
  clean (pre-existing optional-chain warning + broken-symlink info only).

- ST-03 done. **Authorization integration tests added (14 + 8 = 22 per-file passes).**

  `admin-role-management.integration.test.ts` (14 pass):
  - Added `provider` table import and two provider rows (`{ id: userId, ownerId: userId }`,
    `{ id: user2Id, ownerId: user2Id }`) in `beforeAll` to satisfy the
    `providerAssignment.providerId → provider.id` FK used by `assignModerator` (legacy
    pattern: moderator userId === providerId). Also satisfies the
    `provider_profile.providerId → provider.id` FK used by `toggleProviderVisibility`
    (`updateProviderVisibility` upserts a `provider_profile` row).
  - The three "rejects non-global-admin callers" tests upgraded from `.rejects.toThrow()`
    to `.rejects.toMatchObject({ code: 'FORBIDDEN' })`, explicitly asserting `adminProcedure`
    returns the correct error code.

  `provider-profile.integration.test.ts` (8 pass):
  - Complete rewrite. Distinct `userId` / `providerId` identities:
    `userAId='ppr-user-a-id'`, `providerAId='ppr-provider-a-id'`
    (ownerId=userA); `userBId='ppr-user-b-id'`, `providerBId='ppr-provider-b-id'`
    (ownerId=userB). `provider` rows seeded before `condominium` and `providerAssignment`.
  - Condo `ppr-condo-id` + APPROVED RESIDENT assignment (`assignmentId`, `unitInfo: 'Apt 101'`)
    seeded for providerA; providerB has NO assignment.
  - Tests (a)–(b): owner `get`/`update` with explicit `providerId` → verify persistence.
  - Tests (c)–(d): non-owner `get`/`update` with providerBId under callerA → `FORBIDDEN`.
  - Test (e): providerB (no assignment) calls `announcement.create` → `FORBIDDEN`
    from `assertProviderApprovedStanding`.
  - Test (f): providerA (APPROVED assignment) calls `announcement.create` with
    `contact: { mode: 'inherit', custom: null }` → resolves; `result.providerId === providerAId`.
  - Tests (g)–(h): Zod validation (displayName < 3 → BAD_REQUEST; publicDescription > 500
    → BAD_REQUEST). These fire before the guard.
  - `afterAll` cascade-deletes via `db.delete(condominium)` + `db.delete(user)`.

- Gates: 14/14 (admin-role-management), 8/8 (provider-profile) per-file.
  `bun run --filter server check-types` clean; `bun run check` clean (pre-existing
  optional-chain warning + broken-symlink info only).
- T-20-04 fully done (all 3 STs complete). Next: T-20-05.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
