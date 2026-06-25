---
type: task
id: T-20-03
epic: E-20
status: ready
blocked-by: [T-20-01]
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

status: ready
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

status: ready
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

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
