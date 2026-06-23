---
type: task
id: T-19-04
epic: E-19
status: done
blocked-by: [T-19-01, T-19-03]
default-model: medium
---

## What to Build

Reorganize the provider configuration page identity-first. New section order: (1) **Identity & branding** (avatar/logo/banner + display/company/trade names) WITH a small live preview rendering the precedence winner via the shared helper; (2) a **compact Public-visibility toggle ROW** promoted near the top — the heavyweight `VisibilitySection` Card is removed; (3) **Contact channels**. The visibility toggle keeps its existing debounced auto-save behavior unless that conflicts with the compact placement. The contact-channels MODEL is unchanged (PRD-v10); only its position in the IA moves.

## Context

`apps/web/src/routes/panel/provider/configuration.tsx` composes `-configuration-public-profile-section.tsx` → `-configuration-contact-channels-section.tsx` → `-configuration-visibility-section.tsx`, with visibility last behind a heavyweight Card. This task reorders to identity → visibility row → contact, swaps the visibility Card for a compact toggle row, and adds a live preview to the identity section that renders the precedence winner using the T-19-01 helper (`resolveProviderIdentity`). The identity section already consumes the role-parameterized `ImageUploadField` from T-19-03 (which provides the per-role preview + Replace/Re-crop/Remove). Preserve the debounced auto-save the visibility section uses today. All visible strings via i18next `t()` in both pt and en. Route/component test prior art: `apps/web/src/routes/-provider-profile.test.tsx`.

## Acceptance Criteria

- [x] Config section order is: identity & branding → compact visibility toggle row → contact channels.
- [x] The identity section shows a small live preview rendering the precedence winner via the shared helper (T-19-01).
- [x] The heavyweight visibility Card is removed and replaced by a compact toggle ROW near the top.
- [x] The visibility toggle preserves its existing debounced auto-save behavior.
- [x] The contact-channels model is unchanged; only its position moves.
- [x] A route/component test asserts the section order, that the live preview renders the precedence winner, and that visibility is the compact row (not the old Card) with auto-save preserved.
- [x] All visible strings route through i18next `t()` with keys in both pt and en.

## Sub-Tasks

### ST-01 - Reorder sections and replace the visibility Card with a compact row

status: done
model: medium
escalate-if:
- The visibility toggle's debounced auto-save cannot be preserved when moved into a compact row near the top.

blocked-by: []

what-to-do:
- Reorder `configuration.tsx` to render identity & branding → visibility row → contact channels.
- Replace the heavyweight `VisibilitySection` Card with a compact toggle row near the top; preserve debounced auto-save.

files-to-touch:
- `apps/web/src/routes/panel/provider/configuration.tsx`
- `apps/web/src/routes/panel/provider/-configuration-visibility-section.tsx`

verification:
- `bun run check`
- `bun run check-types`

### ST-02 - Add the identity live preview via the shared helper

status: done
model: medium
escalate-if:
- The live preview cannot consume `resolveProviderIdentity` without duplicating precedence logic in the section.

blocked-by:
- ST-01

what-to-do:
- Add a small live preview to the identity & branding section that renders the precedence winner using the T-19-01 helper.
- Keep the role-parameterized `ImageUploadField` (T-19-03) wired for avatar/logo/banner + names.

files-to-touch:
- `apps/web/src/routes/panel/provider/-configuration-public-profile-section.tsx`

verification:
- `bun run check`
- `bun run check-types`

### ST-03 - Route/component test for IA order, preview, and visibility row

status: done
model: medium
escalate-if:
- Section order or the compact-row vs Card distinction is not assertable from the rendered route.

blocked-by:
- ST-02

what-to-do:
- Add/extend a route or component test asserting: section order identity → visibility row → contact; live preview renders the precedence winner; visibility is the compact row (not the old Card); auto-save preserved.
- Verify suspicious failures per-file due to cross-file `mock.module` leakage.

files-to-touch:
- `apps/web/src/routes/-provider-profile.test.tsx`

verification:
- `bun test apps/web/src/routes/-provider-profile.test.tsx`
- `bun run check-types`

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
