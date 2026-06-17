---
type: task
id: T-13-06
epic: E-13
status: done
blocked-by: []
default-model: medium
---

## What to Build

Slim the account surface to User identity only, add persisted preferences, and keep the security placeholders/danger zone. This task was completed before the Ralph Loop migration.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/06_conta_e_seguranca.md` during the Ralph Loop cutover.

## Acceptance Criteria

- [ ] Legacy intent preserved in the migrated task notes below.
- [ ] Verification commands and UI/test constraints remain explicit.
- [ ] No `test.skip()` for UI coverage.

## Sub-Tasks

### ST-01 - Legacy completion snapshot

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Preserve the completed Conta e Segurança refactor, including backend language/theme persistence and `/panel/account` direction.

files-to-touch:
- `apps/web/src/routes/panel.account.tsx`
- user/profile components
- locale files

verification:
- `bun run check`
- `bun run check-types`
- Playwright coverage for the page

#### Execution Notes

- Completed in legacy `.specify/memory` workflow before `.plan` cutover.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
