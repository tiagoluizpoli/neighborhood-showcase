---
type: task
id: T-16-06
epic: E-16
status: ready
blocked-by: [T-16-04]
default-model: medium
---

## What to Build

Localize the called-out shell- and navigation-adjacent copy so the sidebar and top bar stop mixing PT and EN and the hardcoded Portuguese strings flow through the i18n system. Scope is strictly: the sidebar, the top bar, the New Announcement route copy, and the public provider-profile copy (loading state and back-to-showcase link). A full PT/EN codebase sweep is explicitly out of scope and routed to a dedicated i18n task.

## Context

i18n is wired through `apps/web/src/i18n.ts` and `apps/web/src/locales`. Sidebar group/item labels already reference `sidebar.*` i18n keys in `panel.tsx`; remaining hardcoded labels and any new chrome copy from T-16-04 must be added as keys. The New Announcement route (`panel.provider.announcements.new.tsx`) and the public provider profile (`_portal.providers.$id.tsx`) still render hardcoded Portuguese. Serialized after T-16-04 because the sidebar/top-bar portion shares `panel.tsx`.

## Acceptance Criteria

- [ ] Sidebar and top-bar visible copy resolves through i18n with no mixed PT/EN labels.
- [ ] New Announcement title/subtitle and route copy resolve through i18n, not hardcoded strings.
- [ ] Public provider-profile loading state and back-to-showcase link resolve through i18n.
- [ ] PT and EN locale files carry the new keys.
- [ ] No localization changes leak outside the called-out shell-adjacent surfaces.
- [ ] Tests confirm the called-out strings resolve through the i18n system rather than rendering hardcoded copy.

## Sub-Tasks

### ST-01 - Localize sidebar and top-bar copy

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Move remaining hardcoded sidebar/top-bar labels (including chrome copy added in T-16-04) to i18n keys.
- Ensure no mixed PT/EN labels remain in the shell navigation.
- Add the keys to both PT and EN locale files.

files-to-touch:
- `apps/web/src/routes/panel.tsx`
- `apps/web/src/locales/`

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Stay within the shell-adjacent surfaces; do not start a codebase-wide sweep.

### ST-02 - Localize the New Announcement route copy

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Replace hardcoded Portuguese copy on the New Announcement route (title/subtitle and route-level strings) with i18n keys.
- Add the keys to both PT and EN locale files.
- Do not alter form behavior or fields.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.new.tsx`
- `apps/web/src/locales/`

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- No execution notes yet.

### ST-03 - Localize the public provider-profile copy

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Replace the hardcoded loading-state copy and the back-to-showcase link copy on the public provider profile with i18n keys.
- Add the keys to both PT and EN locale files.
- Keep the change to the called-out navigation-adjacent strings only.

files-to-touch:
- `apps/web/src/routes/_portal.providers.$id.tsx`
- `apps/web/src/locales/`

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- No execution notes yet.

### ST-04 - Test that called-out strings resolve through i18n

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add/extend tests confirming the sidebar/top-bar labels, New Announcement title/subtitle, and public-profile loading + back-to-showcase copy resolve through the i18n system rather than rendering hardcoded copy.
- Reuse the route/layout render seam per v8 and v5/v6 prior art.

files-to-touch:
- `apps/web/src/routes/` (localization resolution tests)
- relevant existing panel/portal route test files

verification:
- `bun run check`
- `bun run check-types`
- localization resolution tests pass

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
