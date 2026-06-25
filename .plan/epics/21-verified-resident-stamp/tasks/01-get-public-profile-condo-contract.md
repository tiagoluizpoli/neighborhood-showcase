---
type: task
id: T-21-01
epic: E-21
status: ready
blocked-by: [T-20-02]
default-model: high
---

## What to Build

Give the verified stamp a stable backend data contract. Extend `get-public-profile` (keyed by `provider.id` after E-20) to return the provider's approved-RESIDENT condo as `{condoId, condoName} | null`, sourced via the existing assignment→condominium join. The field is non-null ONLY when the provider has an assignment of type RESIDENT with status APPROVED; EXTERNAL, MODERATOR, or no-approved-assignment providers return `null`. This is the data seam the profile hero and announcement-card stamp (T-21-02) consume; assert the contract here so the UI rides on settled data.

## Context

Use-case `apps/server/src/application/use-cases/user/get-public-provider-profile.ts` — result `PublicProviderProfileResult.provider` already carries `isVerified: boolean`; add the condo contract `{condoId, condoName} | null`. The provider→assignment→condominium join already exists (assignment repository + `condominium` table). Eligibility = assignment type RESIDENT + status APPROVED only. After E-20 this read keys on `provider.id` and already excludes soft-deleted providers (T-20-02). Repositories: `apps/server/src/domain/repositories/user.repository.ts` / `assignment.repository.ts` and their db implementations. Verify per-file (cross-file `mock.module` leakage).

## Acceptance Criteria

- [ ] `get-public-profile` returns `verifiedCondo: {condoId, condoName} | null` (or equivalently named field) on the provider result.
- [ ] The field is non-null ONLY for an assignment type RESIDENT + status APPROVED; EXTERNAL, MODERATOR, and no-approved-assignment providers return `null`.
- [ ] The condo name/id come from the existing assignment→condominium join; soft-deleted providers still return no profile (inherited from T-20-02).
- [ ] Integration tests cover: APPROVED RESIDENT → `{condoId, condoName}`; EXTERNAL → null; MODERATOR → null; PENDING/REJECTED RESIDENT → null; no assignment → null.
- [ ] Gates pass; tests verified per-file.

## Sub-Tasks

### ST-01 - Extend the public-profile read contract with the condo field

status: ready
model: high
escalate-if:
- The approved-RESIDENT condo cannot be resolved through the existing assignment→condominium join without a new query path that conflicts with E-20's repo contract.

blocked-by: []

what-to-do:
- Add `verifiedCondo: {condoId, condoName} | null` to `PublicProviderProfileResult.provider`, resolved from the provider's RESIDENT + APPROVED assignment's condominium.
- Return `null` for EXTERNAL/MODERATOR/non-approved/no-assignment.
- Thread any needed field through the user/assignment repository read.

files-to-touch:
- `apps/server/src/application/use-cases/user/get-public-provider-profile.ts`
- `apps/server/src/domain/repositories/user.repository.ts`
- `apps/server/src/infrastructure/db/user-repository.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-02 - Integration tests for the condo contract

status: ready
model: medium
escalate-if:
- The eligibility matrix cannot be exercised within the existing integration-test harness.

blocked-by:
- ST-01

what-to-do:
- Add integration tests asserting the full eligibility matrix: APPROVED RESIDENT → `{condoId, condoName}`; EXTERNAL/MODERATOR/PENDING/REJECTED/no-assignment → null.
- Verify per-file (cross-file `mock.module` leakage).

files-to-touch:
- `apps/server/src/application/use-cases/user/get-public-provider-profile.integration.test.ts`

verification:
- `bun test apps/server/src/application/use-cases/user/get-public-provider-profile.integration.test.ts`

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
