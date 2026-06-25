---
type: task
id: T-20-02
epic: E-20
status: ready
blocked-by: [T-20-01]
default-model: high
---

## What to Build

Re-key the provider-profile read/write paths onto `provider.id` and enforce soft-delete exclusion. After T-20-01 the schema and repositories already key on `provider.id`; this slice makes the provider-profile use-cases (get, update, and the public read) correct under the new model — one profile per provider, looked up by `provider.id`, and never returned for a soft-deleted provider. This is the profile half of the per-path re-key; the announcement half is T-20-03. It also stabilizes the public-profile read so the verified-stamp condo contract (E-21 / T-21-01) can extend it without re-keying churn.

## Context

Use-cases: `apps/server/src/application/use-cases/provider-profile/get-provider-profile.ts`, `update-provider-profile.ts`, and the public read `apps/server/src/application/use-cases/user/get-public-provider-profile.ts` (result shape `PublicProviderProfileResult.provider`). Repo + mapper already re-keyed in T-20-01: `apps/server/src/infrastructure/db/provider-profile-repository.ts`, `apps/server/src/infrastructure/db/mappers/provider-profile.mapper.ts`, interface `apps/server/src/domain/repositories/provider-profile.repository.ts`. Router `apps/server/src/presentation/routers/provider-profile.ts`. Soft-delete obligation: a provider with `deletedAt` set must not return a profile on any public OR panel read. Existing integration tests in `provider-profile/*.integration.test.ts` and `user/get-public-provider-profile.integration.test.ts` must be updated to assert keying on `provider.id`. Verify per-file due to known cross-file `mock.module` leakage.

## Acceptance Criteria

- [ ] `get-provider-profile`, `update-provider-profile`, and `get-public-provider-profile` resolve the profile by `provider.id` (not `user.id`).
- [ ] Every provider-profile read (public + panel) excludes soft-deleted providers (`deletedAt` set → no profile returned).
- [ ] The router contract for provider-profile is keyed by `provider.id`.
- [ ] Integration tests assert keying on `provider.id` and that a soft-deleted provider returns no profile on public + panel reads.
- [ ] Gates pass; tests verified per-file (no cross-file mock leakage red).

## Sub-Tasks

### ST-01 - Re-key provider-profile use-cases + soft-delete filter

status: ready
model: high
escalate-if:
- A read path cannot exclude soft-deleted providers without a repository query change that conflicts with T-20-01's repo contract.

blocked-by: []

what-to-do:
- Key get/update provider-profile and the public read on `provider.id`.
- Add the `deletedAt IS NULL` exclusion to every provider-profile read (public + panel); a soft-deleted provider returns no profile.

files-to-touch:
- `apps/server/src/application/use-cases/provider-profile/get-provider-profile.ts`
- `apps/server/src/application/use-cases/provider-profile/update-provider-profile.ts`
- `apps/server/src/application/use-cases/user/get-public-provider-profile.ts`
- `apps/server/src/infrastructure/db/provider-profile-repository.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-02 - Re-key provider-profile router contract

status: ready
model: medium
escalate-if:
- The router input/output cannot be keyed by `provider.id` without breaking a panel caller owned by T-20-05.

blocked-by:
- ST-01

what-to-do:
- Update the provider-profile router so input/output is keyed by `provider.id`.

files-to-touch:
- `apps/server/src/presentation/routers/provider-profile.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-03 - Integration tests for re-key + soft-delete exclusion

status: ready
model: medium
escalate-if:
- The soft-delete exclusion cannot be asserted within the existing integration-test harness.

blocked-by:
- ST-02

what-to-do:
- Update/extend integration tests to assert profile reads key on `provider.id` and that a soft-deleted provider returns no profile (public + panel).
- Verify per-file (cross-file `mock.module` leakage).

files-to-touch:
- `apps/server/src/application/use-cases/provider-profile/get-provider-profile.integration.test.ts`
- `apps/server/src/application/use-cases/provider-profile/update-provider-profile.integration.test.ts`
- `apps/server/src/application/use-cases/user/get-public-provider-profile.integration.test.ts`

verification:
- `bun test apps/server/src/application/use-cases/provider-profile/get-provider-profile.integration.test.ts`
- `bun test apps/server/src/application/use-cases/user/get-public-provider-profile.integration.test.ts`

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
