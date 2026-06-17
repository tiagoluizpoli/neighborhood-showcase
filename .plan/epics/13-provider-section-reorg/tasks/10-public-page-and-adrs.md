---
type: task
id: T-13-10
epic: E-13
status: in-progress
blocked-by: []
default-model: medium
---

## What to Build

Expand the public provider page to the full branding set, translate the route surface to English, and write ADR 0005 and ADR 0006.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/10_public_page_and_adrs.md` during the Ralph Loop cutover.

## Acceptance Criteria

- [ ] Legacy intent preserved in the migrated task notes below.
- [ ] Verification commands and UI/test constraints remain explicit.
- [ ] No `test.skip()` for UI coverage.

## Sub-Tasks

### ST-01 - Translate the public provider route surface to English

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Rename the public provider route/file surface from PT naming to EN naming.
- Update consumers and i18n key prefixes in the touched area.
- Log any leftover PT-named items outside scope as deferred backlog items.

files-to-touch:
- `apps/web/src/routes/_portal.prestadores.$id.tsx`
- consumers of that route
- locale files

verification:
- `bun run check-types`
- no broken imports or route references remain

#### Execution Notes

- This task must honor the English-in-code rule.

### ST-02 - Rebuild the public provider page body

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Render banner → identity → social links → Sobre → active announcements in that locked order.
- Render `displayName`, not `User.name`.
- Omit the banner block entirely when no banner exists.
- Keep public visibility/banned/deleted filters intact.

files-to-touch:
- public provider route file

verification:
- browser verification of the locked content order
- hidden/banned providers stay inaccessible

#### Execution Notes

- Full-width layout is mandatory.

### ST-03 - Write ADR 0005

status: blocked
model: medium
escalate-if: []
blocked-by: [history-retrieval-exhausted]

what-to-do:
- Write `docs/adr/0005-user-vs-provider-profile-strict-split.md`.
- Capture context, accepted decision, rejected alternatives, and consequences.

files-to-touch:
- `docs/adr/0005-user-vs-provider-profile-strict-split.md`

verification:
- matches existing ADR style in the repo

#### Execution Notes

- ADR is part of the implementation deliverable, not follow-up documentation.

### ST-04 - Write ADR 0006

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Write `docs/adr/0006-no-centered-content-full-width-layout.md`.
- Enumerate the accepted exceptions clearly.

files-to-touch:
- `docs/adr/0006-no-centered-content-full-width-layout.md`

verification:
- matches existing ADR style in the repo

#### Execution Notes

- Cross-reference the full-width rule captured in `agents.local.md`.

### ST-05 - Add Playwright coverage for the public provider page

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add E2E coverage for full branding render, no-banner render, and banned/not-found behavior.
- Do not use `test.skip()`; extend seeds if needed.

files-to-touch:
- `apps/web/tests/public-provider.spec.ts`
- relevant seed/setup files

verification:
- `bun run test:e2e`
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Visual contract matters, not just DOM presence.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
