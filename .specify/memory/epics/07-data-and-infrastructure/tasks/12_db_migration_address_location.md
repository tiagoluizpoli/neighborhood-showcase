---
type: task
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Refactor the database schema to support decoupled locations and addresses:
1. Create the `address` table containing: `id`, `cep`, `street`, `neighborhood`, `city`, `state`.
2. Rename or refactor `assignment` to `provider_location` table containing: `id`, `providerId` (FK to user), `type` (RESIDENT | MODERATOR | EXTERNAL), `status` (PENDING | APPROVED | REJECTED), `condominiumId` (nullable FK to condo), `addressId` (nullable FK to address), `number` (nullable text), `complement` (nullable text), `proofFile` (nullable text).
3. Update `condominium` table: add `addressId` (FK to address) and `number` (text), and make old city/state/cep columns redundant or drop them.
4. Update `announcement` table: add `providerLocationId` (FK to `provider_location`) and remove `condominiumId`.
5. Write and verify Drizzle migrations.

## Acceptance Criteria

- [x] Drizzle migrations generated and applied successfully.
- [x] Verification tests for the new database schemas.
- [x] Database relationships and foreign keys correctly configured.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
