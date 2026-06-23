---
type: task
id: T-19-06
epic: E-19
status: ready
blocked-by: [T-19-04, T-19-05]
default-model: medium
---

## What to Build

Close the packet with two cross-surface guards. First, a pt/en parity pass over all strings touched by this epic (reorganized config sections, image-field actions, public hero/fallback) — issue #3 is resolved, so this is a parity check, not a re-plan: every new/visible key resolves in BOTH pt and en, no raw keys leak. Second, a seeded Playwright E2E matrix covering the end-to-end config-edit flow (identity edit + image Replace/Re-crop/Remove + visibility toggle + contact) and the public-view flow (single identity mark, hero → announcements → contact, sparse fallback) on a seeded provider.

## Context

Locale files: `apps/web/src/locales/pt/translation.json` and `apps/web/src/locales/en/translation.json` — all visible strings go through i18next `t()` and keys must exist in both. Prior E2E art: follow existing Playwright patterns used by the authoring/detail epics with seeded provider data. This task runs after T-19-04 (config IA) and T-19-05 (public page) so the surfaces under test are final. When reading a full `bun test` run, verify suspicious failures per-file due to known cross-file `mock.module` leakage.

## Acceptance Criteria

- [ ] Every visible string added/changed by E-19 resolves in BOTH pt and en; no raw keys leak on the reorganized config sections, image-field actions, or public hero/fallback.
- [ ] A seeded Playwright spec covers the config-edit flow: identity edit, image Replace/Re-crop/Remove, visibility toggle auto-save, contact channels.
- [ ] A seeded Playwright spec covers the public-view flow: exactly one identity mark, hero → announcements → contact, sparse-branding fallback, width cap.
- [ ] The E2E specs assert the announcement-card link/grid contract is unchanged on the public page.
- [ ] All gates pass.

## Sub-Tasks

### ST-01 - pt/en parity pass on E-19 strings

status: ready
model: medium
escalate-if:
- A key added this epic has no sensible counterpart in one locale (would indicate a missed extraction, not a parity gap).

blocked-by: []

what-to-do:
- Audit every string touched by T-19-03/04/05 for a matching key in both pt and en; add missing counterparts.
- Confirm no raw i18n keys render on config sections, image-field actions, or public hero/fallback.

files-to-touch:
- `apps/web/src/locales/pt/translation.json`
- `apps/web/src/locales/en/translation.json`

verification:
- `bun run check`
- `bun run check-types`

### ST-02 - Seeded Playwright config-edit and public-view matrix

status: ready
model: medium
escalate-if:
- The re-crop or auto-save interaction cannot be driven reliably in Playwright against seeded data.

blocked-by:
- ST-01

what-to-do:
- Add a seeded config-edit spec: identity edit, image Replace/Re-crop/Remove, visibility toggle auto-save, contact channels.
- Add a seeded public-view spec: one identity mark, hero → announcements → contact, sparse fallback, width cap; assert card link/grid contract unchanged.
- Follow existing Playwright patterns and seeded-provider fixtures.

files-to-touch:
- `apps/web/tests/`

verification:
- run the new Playwright specs (project E2E command)
- `bun run check-types`

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
