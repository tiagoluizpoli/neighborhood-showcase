---
type: task
id: T-16-04
epic: E-16
status: in-progress
blocked-by: []
default-model: medium
---

## What to Build

Strengthen — not redesign — the panel shell chrome. The sidebar header gains hierarchy beyond brand text: brand plus active section / condo context plus a primary utility affordance. The top bar gains a section title or breadcrumb beyond the bare sidebar trigger and the theme/language toggles. This is polish within the existing shell structure, not a speculative redesign.

## Context

The shell lives in `apps/web/src/routes/panel.tsx`, which already composes `SidebarHeader`, the sidebar groups, and the top-bar row (trigger + `ThemeCycleToggle` + language toggle). This task adds section/condo context and a section title/breadcrumb using the existing primitives. Serialized after T-16-03 (collapse fix) because both edit `panel.tsx`. Keep within the agreed stronger treatment — no full sidebar/top-bar redesign. New visible copy must use i18n keys so T-16-06 localization stays coherent (do not hardcode strings).

## Acceptance Criteria

- [ ] The sidebar header shows brand plus active section / condo context plus a primary utility affordance.
- [ ] The top bar shows a section title or breadcrumb beyond the bare trigger and theme/language toggles.
- [ ] The change is polish within the existing structure — no redesign of sidebar/top-bar layout.
- [ ] New chrome copy flows through i18n keys, not hardcoded strings.
- [ ] Tests assert the shell chrome shows the expected section context.

## Sub-Tasks

### ST-01 - Add hierarchy to the sidebar header

status: done
model: medium
escalate-if:
- Active section / condo context is not available at the shell layer without new data plumbing beyond this packet's scope.

blocked-by: []

what-to-do:
- Extend `SidebarHeader` to show brand plus active section / condo context plus one primary utility affordance.
- Reuse existing sidebar primitives and the active-route/section signal already present in `panel.tsx`.
- Route new visible copy through i18n keys; do not hardcode strings.

files-to-touch:
- `apps/web/src/routes/panel.tsx`

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- No execution notes yet.
- 2026-06-19: Kept the change local to `apps/web/src/routes/panel.tsx` by deriving sidebar header context from the active panel pathname and the already-available visible sidebar groups, rather than introducing new route metadata plumbing.
- 2026-06-19: On moderation routes, the header context now resolves the selected condo from `mod_ctx__cndo` and the approved moderator assignments already loaded by the shell; other sections fall back to the active section/item labels already translated via existing `sidebar.*` keys.
- 2026-06-19: Added a primary sidebar-header utility affordance as an account shortcut (`/panel/account`) reusing the existing `sidebar.user_menu.account` i18n key, so ST-01 strengthens the chrome without introducing hardcoded copy or redesigning the shell.

### ST-02 - Add a section title / breadcrumb to the top bar

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add a section title or breadcrumb to the top-bar row beyond the bare trigger and theme/language toggles.
- Derive the title/breadcrumb from the active route/section already known to the shell.
- Route new visible copy through i18n keys; do not hardcode strings.

files-to-touch:
- `apps/web/src/routes/panel.tsx`

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- 2026-06-19: Kept the change local to `apps/web/src/routes/panel.tsx` by deriving the top-bar eyebrow/title/context from the same active route, translated sidebar labels, and moderation condo context already resolved at the shell layer.
- 2026-06-19: Reused existing `sidebar.*` translation keys and the selected moderation condo name so the top bar gained orientation chrome without introducing new hardcoded copy or widening scope into T-16-06 localization work.

### ST-03 - Test that shell chrome shows section context

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add/extend tests asserting the sidebar header shows section/condo context and the top bar shows the section title/breadcrumb.
- Reuse the panel-route render seam per v8 and v5/v6 prior art.
- Assert section identity, not deep visual detail.

files-to-touch:
- `apps/web/src/routes/-panel.test.tsx`

verification:
- `bun run check`
- `bun run check-types`
- shell-chrome context tests pass

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
