---
type: task
id: T-13-05
epic: E-13
status: done
blocked-by: []
default-model: medium
---

## What to Build

Build the Provider Configurações page and connect it to the Provider Profile backend surface. This task was completed before the Ralph Loop migration.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/05_configuracoes_page.md` during the Ralph Loop cutover.

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
- Preserve the completed Configurações page work, including sectioned saves and image/widget scope decisions locked by PRD-v7.

files-to-touch:
- `apps/web/src/routes/panel/dashboard/configuration.tsx`
- related provider profile UI components
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
