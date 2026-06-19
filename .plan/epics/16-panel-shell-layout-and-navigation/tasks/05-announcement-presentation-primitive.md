---
type: task
id: T-16-05
epic: E-16
status: in-progress
blocked-by: []
default-model: medium
---

## What to Build

Introduce one shared announcement presentation primitive with three explicit variant slots — `dashboard-card`, `detail-header`, and `public-card` — so the same announcement domain object stops looking like three different components across the dashboard, the detail header, and the public profile. This packet owns the primitive's existence and its variant boundaries only. Deep card/detail/edit/analytics tuning is deferred to packets 03/04/05 and must not be pre-empted.

## Context

Announcement presentation currently forks across surfaces: `apps/web/src/components/announcement-card.tsx`, `apps/web/src/routes/panel/-provider-dashboard-announcement-card.tsx`, the detail route `panel.provider.announcements.$id.tsx`, and the public grid `apps/web/src/routes/portal/-public-vitrine-announcement-grid.tsx` (with `_portal.providers.$id.tsx` as the public profile). The primitive consolidates the variant boundary; it does not deep-tune any surface. Independent of the container and shell-chrome work, so this task is unblocked.

## Acceptance Criteria

- [ ] One shared announcement presentation primitive exists with `dashboard-card`, `detail-header`, and `public-card` variant slots.
- [ ] The dashboard card, detail header, and public profile card render through the shared primitive's correct variant.
- [ ] The primitive stops at variant boundaries; no deep card/detail/edit/analytics tuning is introduced.
- [ ] The variant boundaries are documented so later packets do not violate the contract.
- [ ] Tests assert each surface renders its correct variant without asserting deep visual detail.

## Sub-Tasks

### ST-01 - Build the shared announcement primitive with three variant slots

status: done
model: medium
escalate-if:
- The three existing surfaces cannot share one primitive without pulling in deep per-surface tuning reserved for packets 03/04/05.

blocked-by: []

what-to-do:
- Create one shared announcement presentation primitive exposing `dashboard-card`, `detail-header`, and `public-card` variant slots.
- Define and document the variant boundaries; the primitive owns existence and boundaries only.
- Do not absorb deep authoring/detail/edit/analytics behavior.

files-to-touch:
- `apps/web/src/components/announcement-card.tsx`
- `apps/web/src/components/` (shared announcement presentation primitive)

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Created `components/announcement-dashboard-card.tsx`: `AnnouncementDashboardCardData` interface + `AnnouncementDashboardCard` component (dashboard variant rendering, no dep on routes/).
- Created `components/announcement-presentation-primitive.tsx`: `AnnouncementPresentationVariant` type, three variant prop interfaces, `AnnouncementPresentationPrimitive` dispatch component, `AnnouncementDetailHeader` slot renderer.
- Exported `AnnouncementCardProps` from `announcement-card.tsx` so the primitive can extend it for the `public-card` variant.
- `bun run check` and `bun run check-types` both pass; `announcement-card.test.tsx` 10/10.

### ST-02 - Adopt the primitive in the three surfaces at variant boundaries

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Render the dashboard card, the detail header, and the public profile card through the shared primitive's correct variant.
- Replace forked presentation logic at the variant boundary only; preserve existing per-surface data and behavior.
- Do not redesign any surface.

files-to-touch:
- `apps/web/src/routes/panel/-provider-dashboard-announcement-card.tsx`
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`
- `apps/web/src/routes/portal/-public-vitrine-announcement-grid.tsx`

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- No execution notes yet.

### ST-03 - Test the primitive at its variant boundaries

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add/extend tests asserting `dashboard-card`, `detail-header`, and `public-card` render the correct variant in their respective surfaces.
- Do not assert deep visual details reserved for later packets.
- Reuse the route/component render seam per v8 and v5/v6 prior art.

files-to-touch:
- `apps/web/src/components/announcement-card.test.tsx`
- `apps/web/src/routes/` (surface-level variant tests)

verification:
- `bun run check`
- `bun run check-types`
- announcement variant-boundary tests pass

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
