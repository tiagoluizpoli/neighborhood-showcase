---
type: task
id: T-18-01
epic: E-18
status: ready
blocked-by: []
default-model: high
---

## What to Build

Lift the all-inline create form in `panel.provider.announcements.new.tsx` into one canonical `AnnouncementForm` component on the `panel.provider.*` namespace, and migrate the create route onto it with zero behavior change. Build the per-field lockability seam into the form here (a field-policy/config map or mode-aware disabled flags) so a specific field can be frozen later with a minimal, localized change. This slice is the foundation: it must be sequenced before edit wiring so the create flow is never regressed while edit lands.

## Context

`apps/web/src/routes/panel.provider.announcements.new.tsx` (~629 lines) already composes the shared authoring pieces: `./panel/provider/-announcement-contact-section`, `./panel/provider/-announcement-cta-section`, `@/components/announcement-category-combobox`, `@/components/announcement-price-input`, `@/components/announcement-tags-input`, and the `react-easy-crop` image cropper via `@/utils/crop-image`. The PRD requires create and edit to share ONE form branching on id-presence, preserving the full PRD-v10 authoring field set (provider contact defaults/overrides, CTA targets, structured category, structured tags, money-aware price, image cropper). Consolidation must not narrow that set. The field-lock seam is an explicit acceptance criterion, not an aspiration.

## Acceptance Criteria

- [ ] A single `AnnouncementForm` component exists on the `panel.provider.*` namespace and accepts an optional `id` (or mode prop) to branch create vs edit; this slice wires create only.
- [ ] The create route renders `AnnouncementForm` and is functionally identical to before: same inputs, same positions, same validation rules, cropper + contact section + CTA section + category/tags/money primitives all intact.
- [ ] The form carries an explicit per-field policy seam (field-policy/config map or mode-aware disabled flags) such that freezing a named field later is a minimal localized change with no wide refactor.
- [ ] Identity fields (e.g. `id`) are expressible as non-editable through the seam; for MVP all other fields including category remain editable.
- [ ] All visible strings route through i18next `t()` with keys present in both pt and en locale files.

## Sub-Tasks

### ST-01 - Extract the shared AnnouncementForm from the create route

status: ready
model: high
escalate-if:
- The create form's state shape cannot be lifted without changing inputs, positions, or validation rules visible to the user.
- Extraction forces a change to a shared section component (`-announcement-contact-section`, `-announcement-cta-section`) beyond import wiring.

blocked-by: []

what-to-do:
- Move the inline create form body into a new `AnnouncementForm` component under the `panel.provider.*` namespace.
- Keep all existing authoring sections (cropper, contact, CTA, category, tags, price) composed exactly as today.
- Expose a clean props contract that will support both create and edit (optional `id`/mode, submit handler branch points) without yet wiring edit.

files-to-touch:
- `apps/web/src/routes/panel/provider/-announcement-form.tsx`
- `apps/web/src/routes/panel.provider.announcements.new.tsx`

verification:
- `bun run check`
- `bun run check-types`
- create route renders unchanged inputs/positions

### ST-02 - Build the per-field lockability seam

status: ready
model: high
escalate-if:
- A per-field policy map cannot represent identity-lock without restructuring how fields render.

blocked-by:
- ST-01

what-to-do:
- Add an explicit field-policy/config map (or mode-aware disabled flags) inside `AnnouncementForm` keyed by field.
- Default policy: identity fields (id) non-editable; all other fields including category editable in MVP.
- Ensure freezing one more field later is a single localized map entry, not a structural change.

files-to-touch:
- `apps/web/src/routes/panel/provider/-announcement-form.tsx`

verification:
- `bun run check`
- `bun run check-types`

### ST-03 - Migrate the create route and lock parity

status: ready
model: medium
escalate-if:
- Create-flow behavior cannot be preserved after migration without a visible change.

blocked-by:
- ST-01
- ST-02

what-to-do:
- Point the create route fully at `AnnouncementForm` (create mode, submit via `create`).
- Remove now-dead inline form code from the create route.
- Confirm cropper, contact, and CTA sections remain wired and functional.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.new.tsx`

verification:
- `bun run check`
- `bun run check-types`
- existing create-flow route tests pass

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
