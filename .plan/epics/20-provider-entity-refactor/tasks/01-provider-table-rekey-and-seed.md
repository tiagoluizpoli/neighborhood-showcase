---
type: task
id: T-20-01
epic: E-20
status: in-progress
blocked-by: []
default-model: high
---

## What to Build

The load-bearing foundation slice for the whole provider-entity refactor. Introduce `provider` as a first-class table (`id`, `ownerId → user.id`, soft-delete `deletedAt`), re-key `provider_profile.providerId`, `provider_location.providerId` (providerAssignment), and `announcement.providerId` from `user.id` → `provider.id`, thread a `Provider` domain entity + repository through the stack so the build stays GREEN, and rebuild the seed to the new model. A user owns MANY providers; each provider is bound to exactly ONE condo; there is NO unique constraint on `(ownerId, condominiumId)` — provider is a business identity, not a membership, so two providers in the same condo are allowed. This slice must compile and pass gates end-to-end; the per-path read/write re-key refinements (profile T-20-02, announcement T-20-03), auth (T-20-04), and panel routing (T-20-05) build on top of it.

## Context

Schema `packages/db/src/schema/showcase.ts`: `providerAssignment` (`provider_location`) `providerId` FK→user (line 124), `providerProfile` (`provider_profile`) `providerId` FK→user (line 149), `announcement` `providerId` FK→user (line 248), plus their `relations(...)` blocks. Global role schema `packages/db/src/schema/auth.ts`. Migration is ADDITIVE over base `packages/db/src/migrations/0000_concerned_violations.sql` — never rebuild the base (drops postgis + category-seed SQL drizzle won't regenerate). `db:push` blocks on postgis; apply schema directly to dev + test DBs. Seed: `apps/server/src/infrastructure/db/seed.ts` — rebuild to three states (per AC), NO data-row migration. Domain/repo stack to extend: entities under `apps/server/src/domain/entities/`, repository interfaces under `apps/server/src/domain/repositories/`, db repositories + mappers under `apps/server/src/infrastructure/db/`. Soft-delete adds a `deletedAt IS NULL` obligation everywhere a provider or its announcements are read.

## Acceptance Criteria

- [ ] An additive migration creates the `provider` table (`id`, `ownerId → user.id`, `deletedAt`) and re-keys `provider_profile.providerId`, `provider_location.providerId`, `announcement.providerId` to FK `provider.id`; base migration is NOT rebuilt; re-key SQL is hand-fixed.
- [ ] NO unique constraint on `(ownerId, condominiumId)` — two providers in the same condo are allowed.
- [ ] A `Provider` domain entity + repository (with `ownerId`, `deletedAt`, ownership helper `provider.ownerId === user.id`) exist and are wired through the infrastructure layer.
- [ ] `provider_profile`, `provider_location`, and `announcement` stay SEPARATE tables, each now keyed by `provider.id`; each provider owns exactly one profile and one assignment.
- [ ] The build compiles and gates pass with every consumer threaded to `provider.id` (no dangling `user.id` keying).
- [ ] The seed is rebuilt to THREE states: (1) a user owning 2 providers in 2 different condos (verified in both), (2) a single-provider verified user, (3) a provider with no approved assignment.
- [ ] Schema applied to dev + test DBs (no `db:push` postgis block).

## Sub-Tasks

### ST-01 - Provider table + re-key schema + additive migration

status: done
model: high
escalate-if:
- The additive migration cannot be generated without drizzle attempting to rebuild the base migration (which would drop postgis/seed SQL).
- Re-keying a column requires destructive data loss the additive path cannot express cleanly.

blocked-by: []

what-to-do:
- Add a `provider` table to `showcase.ts`: `id`, `ownerId` FK→`user.id`, soft-delete `deletedAt`; add its relations.
- Re-key `providerProfile.providerId`, `providerAssignment.providerId`, `announcement.providerId` to reference `provider.id`; update each `relations(...)` block accordingly. NO `(ownerId, condominiumId)` unique constraint.
- Generate an ADDITIVE migration; if drizzle regenerates the base, hand-author the additive + re-key SQL and leave the base untouched.
- Apply the change to dev + test DBs directly (db:push blocks on postgis).

files-to-touch:
- `packages/db/src/schema/showcase.ts`
- `packages/db/src/migrations/`

verification:
- `bun run check-types`
- additive migration present; base migration `0000_concerned_violations.sql` unchanged

### ST-02 - Provider domain entity + repository

status: done
model: high
escalate-if:
- An existing consumer assumes a 1:1 user↔provider relation in a way that cannot be threaded to `provider.id` without a contract break beyond this slice.

blocked-by:
- ST-01

what-to-do:
- Add a `Provider` domain entity (`id`, `ownerId`, `deletedAt`, ownership helper) and a `ProviderRepository` interface (create, find-by-id excluding soft-deleted, list-by-owner excluding soft-deleted, soft-delete).
- Implement the db repository + mapper following existing provider-profile/announcement repo prior art.

files-to-touch:
- `apps/server/src/domain/entities/provider.entity.ts`
- `apps/server/src/domain/repositories/provider.repository.ts`
- `apps/server/src/infrastructure/db/provider-repository.ts`
- `apps/server/src/infrastructure/db/mappers/provider.mapper.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-03 - Thread provider.id through existing repos/mappers to keep build green

status: ready
model: high
escalate-if:
- Threading `provider.id` forces a behavioral change to a read/write path that belongs in T-20-02 / T-20-03 / T-20-04 rather than this foundation slice.

blocked-by:
- ST-02

what-to-do:
- Update provider-profile, providerAssignment, and announcement repositories + mappers so their `providerId` is `provider.id`, keeping existing behavior intact (full per-path re-key/soft-delete refinement is deferred to T-20-02/03).
- Resolve every compile error introduced by the re-key so the build is green; do not yet add the soft-delete read filters owned by T-20-02/03 beyond what is needed to compile.

files-to-touch:
- `apps/server/src/infrastructure/db/provider-profile-repository.ts`
- `apps/server/src/infrastructure/db/mappers/provider-profile.mapper.ts`
- `apps/server/src/infrastructure/db/announcement-repository/`
- `apps/server/src/infrastructure/db/mappers/`

verification:
- `bun run check-types`
- `bun run check`

### ST-04 - Rebuild seed to the three required states

status: ready
model: medium
escalate-if:
- The three states cannot be expressed without a schema gap that points back to ST-01.

blocked-by:
- ST-03

what-to-do:
- Rebuild `seed.ts` to the new model: create `provider` rows owned by users; key profiles/assignments/announcements off `provider.id`.
- Exercise THREE states: (1) one user owning 2 providers in 2 different condos, both APPROVED RESIDENT; (2) a single-provider verified user; (3) a provider with no approved assignment.
- NO data-row migration of legacy rows.

files-to-touch:
- `apps/server/src/infrastructure/db/seed.ts`

verification:
- run the seed against dev DB; assert the three states exist (2-provider user, single verified, no-approved)
- `bun run check-types`

#### Execution Notes

- ST-01 (2026-06-24): Added first-class `provider` table to `showcase.ts` (`id`,
  `ownerId → user.id` cascade, `createdAt`, `updatedAt`, soft-delete `deletedAt`)
  + `providerRelations` (owner→user, one profile, many assignments, many
  announcements). Re-keyed `providerProfile.providerId`,
  `providerAssignment.providerId`, `announcement.providerId` from `user.id` →
  `provider.id` and re-pointed their three `relations(...)` blocks to `provider`.
  NO `(ownerId, condominiumId)` unique constraint.
- `bun run db:generate` produced ADDITIVE migration `0003_nasty_pyro.sql`
  (+ `meta/0003_snapshot.json`, journal idx 3): CREATE TABLE provider, DROP the 3
  old `*_provider_id_user_id_fk` constraints, ADD the 4 new provider FKs. Base
  `0000_concerned_violations.sql` UNCHANGED (postgis + category-seed SQL intact)
  → no rebuild, no escalation.
- Applied to dev (`neighborhood_showcase`) + test (`neighborhood_showcase_test`)
  via `docker exec ... psql` (db:push blocks on postgis). Truncated
  `announcement`/`provider_location`/`provider_profile` CASCADE first (legacy rows
  held user-ids; seed rebuild in ST-04 repopulates) so the new FK constraints add
  cleanly. Verified provider table cols + all 4 new constraints in dev DB.
- Gates: server + db `check-types` clean (cache-hit); web fails only on
  pre-existing TS5103 `--ignoreDeprecations` (untouched by this slice).
- Next: ST-02 (Provider domain entity + repository).

- ST-02 (2026-06-24): Added `Provider` domain entity
  (`apps/server/src/domain/entities/provider.entity.ts`) extending
  `AuditableEntity` — getters `ownerId`, `deletedAt`, `isDeleted`, ownership
  helper `isOwnedBy(userId)` (`ownerId === userId`); plus `ProviderNotFoundError`
  (`DomainError`). `ProviderRepository` interface
  (`apps/server/src/domain/repositories/provider.repository.ts`): `create`,
  `findById` (excludes soft-deleted), `listByOwner` (excludes soft-deleted),
  `softDelete`; `CreateProviderInput` param object (`id?`, `ownerId`).
- `DrizzleProviderRepository`
  (`apps/server/src/infrastructure/db/provider-repository.ts`) + `ProviderMapper`
  (`apps/server/src/infrastructure/db/mappers/provider.mapper.ts`) follow
  provider-profile/assignment prior art. `findById`/`listByOwner` filter
  `and(eq(id|ownerId), isNull(deletedAt))`; `create` generates `crypto.randomUUID()`
  when `id` absent; `softDelete` sets `deletedAt = new Date()`.
- Composition-root wiring of existing consumers to `provider.id` is ST-03; this
  slice only adds the entity + repo (no consumer assumed 1:1 user↔provider in a
  way needing a contract break beyond the slice → no escalation).
- Gates: server + db `check-types` clean; web fails only on pre-existing TS5103.
  `bun run check` clean (pre-existing biome-config migrate warning + broken-symlink
  info only; biome auto-collapsed the mapper `implements` line).
- Next: ST-03 (thread `provider.id` through existing repos/mappers).

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
