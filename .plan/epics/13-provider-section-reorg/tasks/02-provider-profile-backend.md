---
type: task
id: T-13-02
epic: E-13
status: done
blocked-by: []
default-model: medium
---

## What to Build

Implement the ProviderProfile entity, repository contract, mapper, repository implementation, and use cases required by PRD-v7. This task was completed before the Ralph Loop migration.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/02_provider_profile_backend.md` during the Ralph Loop cutover.

## Acceptance Criteria

- [ ] Legacy intent preserved in the migrated task notes below.
- [ ] Verification commands and UI/test constraints remain explicit.
- [ ] No `test.skip()` for UI coverage.

## Sub-Tasks

### ST-01 - Legacy completion snapshot

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Preserve the fact that the Provider Profile backend seam was completed before cutover.
- Keep downstream router and UI tasks dependent on this work.

files-to-touch:
- `apps/server/src/domain/entities/provider-profile.entity.ts`
- `apps/server/src/domain/repositories/provider-profile.repository.ts`
- `apps/server/src/application/use-cases/provider-profile/`
- `apps/server/src/infrastructure/db/provider-profile-repository.ts`
- `apps/server/src/infrastructure/db/mappers/provider-profile.mapper.ts`

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Completed in legacy `.specify/memory` workflow before `.plan` cutover.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
