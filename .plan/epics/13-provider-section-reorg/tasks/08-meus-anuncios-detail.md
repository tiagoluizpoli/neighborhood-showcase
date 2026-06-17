---
type: task
id: T-13-08
epic: E-13
status: ready
blocked-by: []
default-model: medium
---

## What to Build

Create the provider-facing announcement detail page with inline edit mode, inline analytics, back navigation to the list, and real ownership/not-found guarding.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/08_meus_anuncios_detail.md` during the Ralph Loop cutover.

## Acceptance Criteria

- [ ] Legacy intent preserved in the migrated task notes below.
- [ ] Verification commands and UI/test constraints remain explicit.
- [ ] No `test.skip()` for UI coverage.

## Sub-Tasks

### ST-01 - Extract reusable inline analytics surface

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Refactor the analytics chart/KPI rendering out of the old dashboard analytics modal into a reusable component that can live inline on the detail page.
- Keep the component reusable for the future slim dashboard work in task 09.

files-to-touch:
- `apps/web/src/routes/panel/-provider-dashboard-analytics-modal.tsx`
- new shared analytics component file

verification:
- `bun run check-types`
- confirm the extracted component renders correctly before the modal is deleted

#### Execution Notes

- Legacy subtasks called for extracting the analytics surface before deleting the modal.

### ST-02 - Build the announcement detail route

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Create the `/panel/dashboard/announcements/:id` route.
- Default to view mode with full announcement presentation.
- Add inline edit mode with Save/Cancel using the existing `announcement.update` procedure.
- Add route-guard behavior: non-owner or not-found redirects back to the list with a toast.

files-to-touch:
- `apps/web/src/routes/panel/dashboard/announcements/$id.tsx`
- supporting route-local components as needed

verification:
- `bun run check`
- `bun run check-types`
- manual/browser verification of view, edit, save, cancel, redirect behavior

#### Execution Notes

- The route must be full-width and must not reintroduce modal-based edit flow.

### ST-03 - Delete obsolete dashboard modals

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Remove the old edit and analytics modals from the dashboard flow once the detail page owns those behaviors.
- Remove any imports/usages that become dead after the shift to the detail page.

files-to-touch:
- `apps/web/src/routes/panel/-provider-dashboard-edit-modal.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-analytics-modal.tsx`
- consumers of those modals

verification:
- `bun run check-types`
- no broken imports remain

#### Execution Notes

- Task 09 assumes these modals are gone.

### ST-04 - Add Playwright coverage for the detail page flow

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add E2E coverage for provider detail view → edit → save → reload.
- Add coverage for not-found and not-mine redirect flows.
- Do not use `test.skip()`; extend seeds if needed.

files-to-touch:
- `apps/web/tests/announcement-detail.spec.ts`
- relevant test seed/setup files

verification:
- `bun run test:e2e`
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Visual correctness matters, not just runtime success.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
