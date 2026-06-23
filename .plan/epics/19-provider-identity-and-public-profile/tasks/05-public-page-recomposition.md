---
type: task
id: T-19-05
epic: E-19
status: done
blocked-by: []
default-model: medium
---

## What to Build

Recompose the public provider page identity-hero first, consuming the shared helper. Desktop priority: **identity hero (banner as background, single identity mark) → active announcements as the full-width main body → contact as persistent secondary**. Render exactly ONE identity mark via the T-19-01 helper and REMOVE the always-on second avatar. Sparse-branding fallback collapses the hero to a compact centered identity band (initials + name + description) with a full-width announcement grid, and the whole page is capped in a max-width container so it never stretches edge-to-edge. This is composition/width/fallback only — the announcement-card link/grid contract is left unchanged.

## Context

`apps/web/src/routes/_portal.providers.$id.tsx` currently renders logo-OR-avatar (lines ~216–230) AND then an always-on second avatar (lines ~232–237) — the duplicate identity mark this task removes. It imports `Avatar`/`AvatarImage`/`AvatarFallback` from the UI package and reads `provider.bannerUrl` / `provider.logoUrl` / `provider.avatarUrl`. Swap the ad-hoc identity decision for the T-19-01 helper (`resolveProviderIdentity`). The existing announcement-card link/grid behavior must stay byte-identical — only page composition, width, and the sparse fallback change. All visible strings via i18next `t()` in both pt and en.

## Acceptance Criteria

- [ ] Exactly one identity mark renders (the always-on second avatar is removed), chosen via the shared helper (T-19-01).
- [ ] Desktop composition is hero → active announcements (full-width main body) → contact (persistent secondary), with banner as the hero background.
- [ ] Sparse-branding fallback renders a compact centered identity band (initials + name + description) with a full-width grid.
- [ ] The whole page is capped in a max-width container (no edge-to-edge stretch).
- [ ] The announcement-card link/grid contract is unchanged.
- [ ] A test asserts: one identity mark; hero → announcements → contact composition; sparse fallback renders the centered band with full-width grid; page is width-capped; card link/grid contract unchanged.
- [ ] All visible strings route through i18next `t()` with keys in both pt and en.

## Sub-Tasks

### ST-01 - Replace identity rendering with the shared helper and remove the second avatar

status: done
model: medium
escalate-if:
- The helper's identity-mark result cannot drive the hero without re-introducing a logo-AND-avatar path.

blocked-by: []

what-to-do:
- Replace the inline logo-OR-avatar decision with `resolveProviderIdentity` (T-19-01) to render exactly one identity mark.
- Remove the always-on second avatar block.
- Keep banner as the hero background only.

files-to-touch:
- `apps/web/src/routes/_portal.providers.$id.tsx`

verification:
- `bun run check`
- `bun run check-types`

### ST-02 - Recompose layout, sparse fallback, and max-width cap

status: done
model: medium
escalate-if:
- The full-width announcement body or max-width cap cannot be achieved without touching the announcement-card link/grid contract.

blocked-by:
- ST-01

what-to-do:
- Order the page hero → active announcements (full-width main body) → contact (persistent secondary).
- Add the sparse-branding fallback: compact centered identity band (initials + name + description) + full-width grid.
- Cap the page in a max-width container; leave the announcement-card link/grid contract untouched.

files-to-touch:
- `apps/web/src/routes/_portal.providers.$id.tsx`

verification:
- `bun run check`
- `bun run check-types`

### ST-03 - Test composition, single mark, fallback, and width cap

status: done
model: medium
escalate-if:
- The composition order or single-identity-mark guarantee is not assertable from the rendered route.

blocked-by:
- ST-02

what-to-do:
- Add/extend a test asserting one identity mark, hero → announcements → contact, sparse fallback centered band + full-width grid, width-cap, and unchanged card link/grid contract.
- Verify suspicious failures per-file due to cross-file `mock.module` leakage.

files-to-touch:
- `apps/web/src/routes/-provider-profile.test.tsx`

verification:
- `bun test apps/web/src/routes/-provider-profile.test.tsx`
- `bun run check-types`

#### Execution Notes

- ST-01, ST-02, ST-03 all done in single iteration. 21/21 tests pass per-file.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
