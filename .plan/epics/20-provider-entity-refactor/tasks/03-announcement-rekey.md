---
type: task
id: T-20-03
epic: E-20
status: in-progress
blocked-by: []
default-model: high
---

## What to Build

Re-key the announcement read/write paths onto `provider.id` and enforce soft-delete exclusion of providers AND their announcements. After T-20-01 the `announcement.providerId` column references `provider.id`; this slice makes every announcement use-case correct under the new model: public list/detail, the provider dashboard/panel list and create/update paths, and moderation reads, all keyed by `provider.id`, and none of them leaking announcements that belong to a soft-deleted provider. This is the announcement half of the per-path re-key (the profile half is T-20-02).

## Context

Public read repo `apps/server/src/infrastructure/db/announcement-repository/public/list-public-announcements.ts` + `find-public-announcement-by-id.ts`. Use-cases under `apps/server/src/application/use-cases/announcement/`: `list-public-announcements.ts`, `get-public-announcement.ts`, `create-announcement.ts`, `update-announcement.ts`, `get-provider-dashboard-data.ts`, plus moderation reads (`list-announcements-for-moderation.ts`, `list-reported-announcements.ts`). Routers `apps/server/src/presentation/routers/announcement/` (incl. `provider.ts`, `moderation.ts`). Soft-delete obligation: a soft-deleted provider's announcements must be excluded from every public AND panel/moderation query, even if the announcement row itself is live. `announcement.showVerifiedBadge` already exists (consumed later by E-21's card gate). Verify per-file due to known cross-file `mock.module` leakage.

## Acceptance Criteria

- [ ] Public list/detail, panel create/update/list, dashboard, and moderation reads key announcements on `provider.id`.
- [ ] Every announcement read (public + panel + moderation) excludes announcements belonging to a soft-deleted provider (`provider.deletedAt` set).
- [ ] Announcement create/update associates the announcement with the active `provider.id`.
- [ ] Integration tests assert keying on `provider.id` and soft-deleted-provider announcement exclusion across public + panel read paths.
- [ ] Gates pass; tests verified per-file.

## Sub-Tasks

### ST-01 - Re-key public announcement read paths + soft-delete exclusion

status: done
model: high
escalate-if:
- Excluding a soft-deleted provider's announcements requires a join the public repo cannot express without a contract change beyond this slice.

blocked-by: []

what-to-do:
- Key `list-public-announcements` + `find-public-announcement-by-id` on `provider.id`; join provider and exclude `provider.deletedAt IS NOT NULL`.
- Thread the same through the public use-cases.

files-to-touch:
- `apps/server/src/infrastructure/db/announcement-repository/public/list-public-announcements.ts`
- `apps/server/src/infrastructure/db/announcement-repository/public/find-public-announcement-by-id.ts`
- `apps/server/src/application/use-cases/announcement/list-public-announcements.ts`
- `apps/server/src/application/use-cases/announcement/get-public-announcement.ts`

verification:
- `bun run check-types`
- `bun run check`

### ST-02 - Re-key panel/dashboard/moderation announcement paths + soft-delete exclusion

status: done
model: high
escalate-if:
- A panel write path needs the active-provider routing context owned by T-20-05 to resolve `provider.id`.

blocked-by:
- ST-01

what-to-do:
- Key create/update/list and dashboard data on the active `provider.id`; exclude soft-deleted providers' announcements from panel + moderation reads.

files-to-touch:
- `apps/server/src/application/use-cases/announcement/create-announcement.ts`
- `apps/server/src/application/use-cases/announcement/update-announcement.ts`
- `apps/server/src/application/use-cases/announcement/get-provider-dashboard-data.ts`
- `apps/server/src/application/use-cases/announcement/list-announcements-for-moderation.ts`
- `apps/server/src/presentation/routers/announcement/`

verification:
- `bun run check-types`
- `bun run check`

### ST-03 - Integration tests for re-key + soft-delete exclusion

status: ready
model: medium
escalate-if:
- Soft-delete exclusion cannot be asserted within the existing integration-test harness.

blocked-by:
- ST-02

what-to-do:
- Update/extend announcement integration tests to assert keying on `provider.id` and that a soft-deleted provider's announcements are excluded from public + panel reads.
- Verify per-file (cross-file `mock.module` leakage).

files-to-touch:
- `apps/server/src/application/use-cases/announcement/list-public-announcements.integration.test.ts`
- `apps/server/src/application/use-cases/announcement/get-public-announcement.integration.test.ts`
- `apps/server/src/application/use-cases/announcement/get-provider-dashboard-data.integration.test.ts`

verification:
- `bun test apps/server/src/application/use-cases/announcement/list-public-announcements.integration.test.ts`
- `bun test apps/server/src/application/use-cases/announcement/get-public-announcement.integration.test.ts`

#### Execution Notes

- ST-02 (done): panel/dashboard/moderation announcement paths re-keyed on
  `provider.id` + provider soft-delete exclusion.
  - `update-announcement.ts`: ownership now keys on `input.providerId`
    (`announcement.providerId === providerId`) instead of the broken
    `actorId` (user id) comparison left over from the re-key.
  - `routers/announcement/provider.ts`: `create`, `getDashboardData`, and
    `update` accept an optional `providerId` and feed the active provider PK
    into the use-cases, falling back to `ctx.session.user.id` for legacy
    single-provider callers (their `provider.id === user.id` in the seed)
    until T-20-05 wires panel URLs onto `$providerId`. Same seam as T-20-02.
  - Infra soft-delete exclusion (provider inner-joined, `provider.deletedAt
    IS NULL`): `announcement-repository/provider.ts`
    (`findDashboardAnnouncementsByProviderId`,
    `findActiveAnnouncementsByProviderId`) and
    `announcement-repository/moderation.ts` (`listAnnouncementsForModeration`
    + `listReportedAnnouncements`).
  - `create-announcement.ts` + `list-announcements-for-moderation.ts`
    use-cases needed no change (create already keys on `input.providerId`;
    moderation read exclusion lives in the repo).
  - Gates: `bun run --filter server check-types` clean; root `bun run check`
    clean (pre-existing optional-chain warning + broken-symlink info only).
  - The announcement panel integration tests (`get-provider-dashboard-data`,
    `update-announcement`) still fail at seed time on the T-20-01 provider-row
    FK gap (`provider_profile_provider_id_provider_id_fk` /
    `provider_location_provider_id_provider_id_fk`) — fixtures seed
    profiles/locations without first inserting `provider` rows. This is
    pre-existing (the untouched dashboard test fails identically) and is
    exactly ST-03's fixture rebuild scope, not an ST-02 regression.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
