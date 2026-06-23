---
type: task
id: T-19-02
epic: E-19
status: in-progress
blocked-by: []
default-model: high
---

## What to Build

Carry original-image retention as its own backend slice so re-crop-from-original is backed by real data, not a UI illusion. `provider_profile` today stores only the final cropped URLs (`avatar_url`, `logo_url`, `banner_url`). Persist an original-source reference per image role alongside the derived crop, add the upload/storage strategy for that original, and extend the profile read/write contract so the UI can both save the original and read it back to re-crop from. This slice is sequenced BEFORE the re-crop UI (T-19-03) that depends on it.

## Context

Schema: `packages/db/src/schema/showcase.ts`, table `provider_profile` (`avatar_url`, `logo_url`, `banner_url`). Migrations are additive over the single base migration `packages/db/src/migrations/0000_concerned_violations.sql`; rebuilding the base migration drops embedded postgis + category-seed SQL that drizzle will not regenerate, so an ADDITIVE migration is required — never rebuild the base. The server stack to extend: `apps/server/src/domain/entities/provider-profile.entity.ts`, `apps/server/src/domain/repositories/provider-profile.repository.ts`, `apps/server/src/infrastructure/db/provider-profile-repository.ts`, `apps/server/src/infrastructure/db/mappers/provider-profile.mapper.ts`, the use-cases under `apps/server/src/application/use-cases/provider-profile/` (get/update) and `apps/server/src/application/use-cases/user/get-public-provider-profile.ts`, and the router `apps/server/src/presentation/routers/provider-profile.ts`. Follow the existing upload/storage path the current cropped URLs use; add the original alongside it. Per the dev-server gotcha, `db:push` blocks on postgis — apply schema changes to dev + test DBs directly when needed.

## Acceptance Criteria

- [x] An additive migration adds an original-source reference column per image role (avatar/logo/banner) to `provider_profile`; the base migration is NOT rebuilt.
- [ ] The provider-profile entity, repository, mapper, and DTOs carry the original-source reference per role alongside the cropped URL.
- [ ] The update contract persists BOTH the cropped URL and the original-source reference when an image is saved.
- [ ] The read contract returns the original-source reference so the UI can re-crop from the original.
- [ ] An upload/storage strategy stores the original full-resolution asset (following the existing cropped-asset path).
- [ ] A server test asserts saving an image persists both the cropped URL and the original-source reference, and that the read contract returns the original.
- [ ] All gates pass; schema applied to dev + test DBs (no `db:push` postgis block).

## Sub-Tasks

### ST-01 - Additive schema migration for original-source columns

status: done
model: high
escalate-if:
- The additive migration cannot be generated without drizzle attempting to rebuild the base migration (which would drop postgis/seed SQL).

blocked-by: []

what-to-do:
- Add original-source reference columns per role (avatar/logo/banner) to the `provider_profile` table definition.
- Generate an additive migration only; if drizzle regenerates the base, hand-author the additive SQL and re-add nothing from the base.
- Apply the change to dev + test DBs directly (db:push blocks on postgis).

files-to-touch:
- `packages/db/src/schema/showcase.ts`
- `packages/db/src/migrations/`

verification:
- `bun run check-types`
- additive migration file present; base migration unchanged

### ST-02 - Extend entity, repository, mapper, and DTOs

status: ready
model: high
escalate-if:
- Adding the original-source field forces a breaking change to an unrelated consumer of the profile contract.

blocked-by:
- ST-01

what-to-do:
- Thread the original-source reference per role through the provider-profile entity, repository interface, db repository, and mapper.
- Update the get/update use-cases and the public-profile read use-case to carry the original-source reference.
- Keep `avatar_url` / `logo_url` / `banner_url` semantics unchanged (derived crop).

files-to-touch:
- `apps/server/src/domain/entities/provider-profile.entity.ts`
- `apps/server/src/domain/repositories/provider-profile.repository.ts`
- `apps/server/src/infrastructure/db/provider-profile-repository.ts`
- `apps/server/src/infrastructure/db/mappers/provider-profile.mapper.ts`
- `apps/server/src/application/use-cases/provider-profile/get-provider-profile.ts`
- `apps/server/src/application/use-cases/provider-profile/update-provider-profile.ts`
- `apps/server/src/application/use-cases/user/get-public-provider-profile.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-03 - Wire router contract and original-asset storage

status: ready
model: high
escalate-if:
- The existing upload/storage path cannot store an original alongside the crop without changing the cropped-asset contract.

blocked-by:
- ST-02

what-to-do:
- Extend the provider-profile router input/output to accept and return the original-source reference per role.
- Store the original full-resolution asset via the existing upload/storage strategy used for cropped assets.

files-to-touch:
- `apps/server/src/presentation/routers/provider-profile.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-04 - Backend test for original retention round-trip

status: ready
model: medium
escalate-if:
- The round-trip cannot be asserted without standing up infrastructure beyond the existing integration-test harness.

blocked-by:
- ST-03

what-to-do:
- Add/extend a server test: saving an image persists both the cropped URL and the original-source reference.
- Assert the read contract (private + public) returns the original-source reference.
- Verify suspicious failures per-file due to known cross-file `mock.module` leakage.

files-to-touch:
- `apps/server/src/application/use-cases/provider-profile/update-provider-profile.integration.test.ts`
- `apps/server/src/application/use-cases/provider-profile/get-provider-profile.integration.test.ts`

verification:
- `bun test apps/server/src/application/use-cases/provider-profile/update-provider-profile.integration.test.ts`
- `bun test apps/server/src/application/use-cases/provider-profile/get-provider-profile.integration.test.ts`

#### Execution Notes

- 2026-06-23 ST-01 DONE: Added 3 nullable original-source columns to
  `provider_profile` in `packages/db/src/schema/showcase.ts` —
  `avatarOriginalUrl` (`avatar_original_url`), `logoOriginalUrl`
  (`logo_original_url`), `bannerOriginalUrl` (`banner_original_url`), each
  placed next to its cropped `*_url`. Semantics: `*_url` stays the derived
  crop; `*_original_url` is the untouched full-res upload for re-crop.
- `bun run db:generate` produced ADDITIVE migration
  `0001_outgoing_ozymandias.sql` (3× `ALTER TABLE ... ADD COLUMN ... text`)
  + `meta/0001_snapshot.json`; journal appended idx 1. Base migration
  `0000_concerned_violations.sql` UNCHANGED — no postgis/seed SQL dropped,
  no escalation needed.
- Applied directly to dev (`neighborhood_showcase`) + test
  (`neighborhood_showcase_test`) DBs via `docker exec ... psql` with
  `ADD COLUMN IF NOT EXISTS` (db:push blocks on postgis). Verified all 3
  columns present in both via information_schema.
- Gates: `bun run check-types` — db package clean (only pre-existing web
  TS5103 `ignoreDeprecations` error, unrelated). `bun run check` — clean
  (pre-existing biome-config warning + broken-symlink info only).
- Next: ST-02 — thread original-source per role through entity / repository
  / mapper / DTOs + get/update + public-profile use-cases.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
