---
type: task
id: T-18-03
epic: E-18
status: ready
blocked-by: [T-18-02]
default-model: medium
---

## What to Build

Rebuild `/panel/provider/announcements/$id` as a pure read-only, facts-first detail page. Title plus key facts (category, price, status, condo, contact) render at the top, above the fold — a provider must not scroll to reach key info. The per-announcement image is demoted from a full-width 4:3 hero to a constrained 4:3 cover (~280–320px max width, rounded, object-cover, no re-crop). The redundant right-rail summary mini-card is removed. The Edit button navigates to the `$id/edit` child route.

## Context

After T-18-02 the edit flow lives on its own route, so `$id` no longer needs inline-edit state. The image is `announcement.imageUrl` (the cropper output); keep its 4:3 aspect so it matches creation and is never re-cropped. The status badge, tag chips, and contact card already carry status/tag/contact information, so the summary mini-card (status / contact-count / tag-count) is redundant and removed. Exact cover cap (280 vs 320px) and beside-vs-above behavior at smaller breakpoints is responsive polish to settle in implementation. Analytics stays on this page but its placement/resize is T-18-04. All visible strings via i18next `t()` with pt + en keys.

## Acceptance Criteria

- [ ] The `$id` route is pure read-only — no inline edit state remains.
- [ ] Title plus key facts (category, price, status, condo, contact) render in the primary block above the analytics block, above the fold.
- [ ] The Edit button navigates to `/panel/provider/announcements/$id/edit`.
- [ ] The image renders as a constrained 4:3 cover (~280–320px max width, rounded, object-cover), not a full-width hero, with no re-crop.
- [ ] The right-rail summary mini-card (status / contact-count / tag-count) is absent.
- [ ] All visible strings route through i18next `t()` with keys in both pt and en.

## Sub-Tasks

### ST-01 - Rebuild the facts-first read-only layout

status: ready
model: medium
escalate-if:
- The existing detail data cannot present category/price/status/condo/contact above the fold without a data change outside scope.

blocked-by:
- T-18-02

what-to-do:
- Make `$id` read-only and lay out title + key facts at the top.
- Wire the Edit button to navigate to the `$id/edit` route.
- Keep the analytics block present below facts (resize is T-18-04).

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`
- announcement detail translation files (pt + en)

verification:
- `bun run check`
- `bun run check-types`
- detail route renders facts-first, read-only, with working Edit navigation

### ST-02 - Demote the image and remove the summary mini-card

status: ready
model: medium
escalate-if:
- Keeping the 4:3 aspect at the constrained size requires re-cropping or a new image pipeline.

blocked-by:
- ST-01

what-to-do:
- Replace the full-width 4:3 hero with a constrained 4:3 cover (~280–320px max width, rounded, object-cover, no re-crop).
- Remove the right-rail summary mini-card.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`

verification:
- `bun run check`
- `bun run check-types`
- image is a constrained cover; summary mini-card absent

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
