---
type: task
id: T-18-02
epic: E-18
status: ready
blocked-by: [T-18-01]
default-model: high
---

## What to Build

Introduce the dedicated edit route `/panel/provider/announcements/$id/edit` and wire it to the shared `AnnouncementForm` in edit mode: fetch the announcement by id, prefill every field, and submit via `update` carrying the id. Then delete the duplicate `panel.dashboard.*` new form and the narrow `-provider-dashboard-edit-form-fields.tsx`, making `panel.provider.*` the single canonical authoring namespace. The identity-lock acceptance criterion is exercised here through the field-policy seam from T-18-01.

## Context

`AnnouncementForm` and its field-policy seam land in T-18-01. The current `panel.provider.announcements.$id.tsx` edits in-place by toggling `isEditing` and swapping the right column to `-provider-dashboard-edit-form-fields.tsx`; that inline-edit path is removed here (the detail page becomes pure read-only in T-18-03, but this slice stops routing edit through the old narrow component). Routes in this app are flat-named (`panel.provider.announcements.$id.tsx`), so the edit route file is `panel.provider.announcements.$id.edit.tsx`. The duplicate `panel.dashboard.announcements.new.tsx` and `-provider-dashboard-edit-form-fields.tsx` are deleted. Edit must reuse the exact same inputs, positions, and validation as create — no second experience.

## Acceptance Criteria

- [ ] A `/panel/provider/announcements/$id/edit` route exists and renders `AnnouncementForm` in edit mode.
- [ ] Edit mode fetches the announcement by id, prefills every field from the fetched record, and submits via `update` carrying the id; create still submits via `create`.
- [ ] Edit exposes the same inputs in the same positions with the same validation rules as create (full PRD-v10 field set preserved).
- [ ] Identity fields (id) are non-editable in edit mode via the field-policy seam; all other fields including category remain editable.
- [ ] `panel.dashboard.announcements.new.tsx` and `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx` are deleted with no dangling references.
- [ ] All visible strings route through i18next `t()` with keys in both pt and en.

## Sub-Tasks

### ST-01 - Add the dedicated edit route in edit mode

status: ready
model: high
escalate-if:
- Edit-mode fetch/prefill cannot reuse the shared form without diverging inputs or validation from create.
- The router cannot express the `$id/edit` child without restructuring the existing `$id` route beyond adding the child.

blocked-by:
- T-18-01

what-to-do:
- Create the `$id/edit` route file and render `AnnouncementForm` with the id.
- Fetch the announcement by id, prefill all fields, and submit via `update` carrying the id.
- Confirm create-vs-edit parity of inputs, positions, and validation.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.$id.edit.tsx`
- `apps/web/src/routes/panel/provider/-announcement-form.tsx`

verification:
- `bun run check`
- `bun run check-types`
- edit route prefills and submits via update

### ST-02 - Exercise the identity-lock policy in edit mode

status: ready
model: medium
escalate-if:
- Identity-lock cannot be enforced through the existing field-policy seam without a structural change.

blocked-by:
- ST-01

what-to-do:
- Apply the field-policy so identity fields (id) are non-editable in edit mode.
- Keep category and all other fields editable for MVP.

files-to-touch:
- `apps/web/src/routes/panel/provider/-announcement-form.tsx`

verification:
- `bun run check`
- `bun run check-types`

### ST-03 - Delete duplicate dashboard new form and narrow edit-fields component

status: ready
model: medium
escalate-if:
- A deleted file is still imported by a surface outside this epic's scope.

blocked-by:
- ST-01

what-to-do:
- Delete `panel.dashboard.announcements.new.tsx` and `-provider-dashboard-edit-form-fields.tsx`.
- Remove or redirect any references so `panel.provider.*` is the single authoring namespace.
- Stop routing the `$id` page through the old inline-edit/narrow component.

files-to-touch:
- `apps/web/src/routes/panel.dashboard.announcements.new.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-edit-form-fields.tsx`
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`

verification:
- `bun run check`
- `bun run check-types`
- no dangling imports to deleted files

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
