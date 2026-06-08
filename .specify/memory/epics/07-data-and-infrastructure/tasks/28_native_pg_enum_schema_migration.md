---
type: refactor
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Migrate all 11 text-enum columns across 6 database tables to native PostgreSQL `pgEnum` types:
1. Define 11 independent, dedicated enum definitions in the Drizzle schema files (one for each column context, no sharing):
   - `userRoleEnum` in user schema
   - `userStatusEnum` in user schema
   - `condominiumStatusEnum` in condominium schema
   - `providerLocationTypeEnum` in provider location schema
   - `providerLocationStatusEnum` in provider location schema
   - `assignmentTypeEnum` in assignment schema
   - `assignmentStatusEnum` in assignment schema
   - `announcementStatusEnum` in announcement schema
   - `paymentStatusEnum` in payment schema
   - `analyticsEventTypeEnum` in analytics schema
   - `analyticsTargetTypeEnum` in analytics schema
2. Replace all instances of `text({ enum: [...] })` with their respective `pgEnum(...)` references in the Drizzle table schemas.
3. Perform a destructive migration reset: delete the migrations folder under `packages/db/src/migrations/`, run `db:generate` to produce a fresh initial migration schema, and run `db:push` or migration scripts to apply the updated schema to the local and test databases.

## Acceptance Criteria

- [x] All 11 enum columns are converted to independent native `pgEnum` definitions in Drizzle.
- [x] Legacy migrations are deleted, and a new initial migration is cleanly generated.
- [x] Running `bun run db:push` or schema sync completes without error against both dev and test DBs.
- [x] Database validation rules/constraints reject invalid enum inserts directly at the PG level.
- [x] All 134 existing integration tests pass successfully with the native DB enums.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
