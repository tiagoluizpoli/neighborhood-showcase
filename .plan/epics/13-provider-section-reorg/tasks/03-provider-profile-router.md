---
type: task
id: T-13-03
epic: E-13
status: done
blocked-by: []
default-model: medium
---

## What to Build

Add and wire the `trpc.providerProfile` router for authenticated self-read and update of the provider profile. This task was completed before the Ralph Loop migration.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/03_provider_profile_router.md` during the Ralph Loop cutover.

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
- Preserve the completed router/DI seam that exposes provider profile get/update behavior.

files-to-touch:
- `apps/server/src/presentation/routers/provider-profile.ts`
- `apps/server/src/main/di/index.ts`
- router registration files

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Completed in legacy `.specify/memory` workflow before `.plan` cutover.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
