---
type: task
id: T-18-02
epic: E-18
status: in-progress
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

status: done
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

status: done
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

- ST-02 (done): exercised the identity-lock policy in edit mode.
  - `resolveAnnouncementFieldPolicy` renamed `_mode` → `mode` (now actively used).
  - `id` policy made explicitly mode-conditional: `mode === 'edit' ? LOCKED_FIELD : EDITABLE_FIELD`.
    In edit mode identity is locked (the enforced case); in create mode `id` doesn't exist as an
    authorable field (vacuously editable). All other fields remain `EDITABLE_FIELD` for MVP.
  - No rendered UI element for `id`, so behavior is unchanged — this change formalizes the seam
    and removes the `_mode` placeholder, making the function meaningful.
  - Gates: `bun run check-types` clean (4/4); `bun run check` clean (pre-existing biome-config
    deprecation warning + broken-symlink info only).

- ST-01 (done): wired edit mode into the shared `AnnouncementForm` and added the
  dedicated `$id/edit` route — no input/validation divergence from create, so no
  escalation needed.
  - `apps/web/src/routes/panel.provider.announcements.$id.edit.tsx` (new): thin
    route rendering `<AnnouncementForm mode="edit" announcementId={id} />`.
    TanStack route tree auto-regenerated (`/panel/provider/announcements/$id/edit`).
  - `-announcement-form.tsx`: edit mode fetches via
    `announcement.getDashboardData` (`enabled: isEditMode`), flattens + finds by
    id, and prefills every field once (guarded by `prefilledRef`): location,
    category, title, subtitle, description, price, tags, contact mode +
    custom phone/call, cta (`withCtaIds`), verified badge, and existing image
    URL. Not-found after load → toast + redirect to the list (mirrors detail).
  - Submit branches on mode: edit calls `announcement.update` carrying `id`
    (no `providerAssignmentId` — location is fixed on update), create still calls
    `announcement.create`. Shared validation (title/description/contact/cta).
  - Image: new `existingImageUrl` state. Edit shows the saved cover with a
    "Change" button (no forced re-crop); submit reuses the existing URL unless a
    new image was cropped, in which case it uploads as before. Image-required
    guard now passes in edit when an existing URL is present. Create behavior
    byte-for-byte unchanged.
  - Header/submit copy is mode-aware: new keys `new_announcement.edit_title`,
    `edit_subtitle`, `submit.update`, `submit.updating` added to both en + pt;
    update toasts reuse `meus_anuncios.detail.update_success/update_error`.
  - On update success: invalidate `getDashboardData` and navigate to the detail
    page (`$id`).
  - Detail-page Edit button is NOT yet repointed to the route and the old inline
    edit / narrow component are NOT deleted — that is ST-03 (touches
    `panel.provider.announcements.$id.tsx`). Identity-lock is ST-02 (the seam
    already locks `id`, which is non-rendered, so behavior is already correct;
    ST-02 will formalize/verify).
  - Gates: `bun run check-types` clean (4/4); `bun run check` clean (pre-existing
    biome-config deprecation warning + broken-symlink info only);
    `-panel.provider.announcements.test.tsx` 6/6 pass (create flow unchanged).

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
