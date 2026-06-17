---
type: task
id: T-13-01
epic: E-13
status: done
blocked-by: []
default-model: medium
---

## What to Build

Add the provider-profile and user preference schema changes required by PRD-v7. This task was completed before the Ralph Loop migration.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/01_schema_migrations.md` during the Ralph Loop cutover.

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
- Record that the additive Drizzle schema work for PRD-v7 was completed in the legacy workflow before cutover.
- Preserve the dependency ordering for downstream backend and UI tasks.

files-to-touch:
- `packages/db/src/schema/showcase.ts`
- `packages/db/src/schema/auth.ts`
- `packages/db/src/migrations/`

verification:
- `bun run db:generate`
- `bun run db:migrate`

#### Execution Notes

- Completed in legacy `.specify/memory` workflow before `.plan` cutover.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
