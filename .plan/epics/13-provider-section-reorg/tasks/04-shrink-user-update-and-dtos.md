---
type: task
id: T-13-04
epic: E-13
status: done
blocked-by: []
default-model: medium
---

## What to Build

Shrink `trpc.user.update` to User identity only and update related DTOs/public profile fields per the strict User vs Provider Profile split. This task was completed before the Ralph Loop migration.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/04_shrink_user_update_and_dtos.md` during the Ralph Loop cutover.

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
- Preserve the completed DTO/API split between User identity and Provider Profile fields.

files-to-touch:
- `apps/server/src/application/use-cases/user/`
- `apps/server/src/domain/repositories/user.repository.ts`
- `apps/server/src/presentation/routers/user.ts`
- shared DTO/client files

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Completed in legacy `.specify/memory` workflow before `.plan` cutover.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
