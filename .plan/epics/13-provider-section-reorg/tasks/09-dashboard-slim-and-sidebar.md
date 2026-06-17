---
type: task
id: T-13-09
epic: E-13
status: blocked
blocked-by: [T-13-08]
default-model: medium
---

## What to Build

Slim the provider dashboard to summary-only mode, fix the Provedor sidebar capability gate, add provider-page guards, and update the sidebar footer avatar behavior.

## Context

Migrated from legacy file `.specify/memory/epics/13-provider-section-reorg/tasks/09_dashboard_slim_and_sidebar.md` during the Ralph Loop cutover.

## Acceptance Criteria

- [ ] Legacy intent preserved in the migrated task notes below.
- [ ] Verification commands and UI/test constraints remain explicit.
- [ ] No `test.skip()` for UI coverage.

## Sub-Tasks

### ST-01 - Rebuild the KPI strip and compact chart

status: blocked
model: medium
escalate-if: []
blocked-by: [T-13-08]

what-to-do:
- Rebuild the dashboard summary surface into 4 KPI cards plus the compact chart.
- Remove the embedded announcement list from this page.
- Reuse the analytics/chart component extracted in task 08 where practical.

files-to-touch:
- `apps/web/src/routes/panel/-provider-dashboard-content.tsx`
- `apps/web/src/routes/panel/-provider-dashboard-performance-overview.tsx`
- related dashboard sub-components

verification:
- `bun run check`
- `bun run check-types`
- browser verification that no announcement list remains on the dashboard

#### Execution Notes

- Blocked until task 08 removes the modal-based analytics/edit flow.

### ST-02 - Fix the Provedor sidebar condition and footer avatar

status: blocked
model: medium
escalate-if: []
blocked-by: [T-13-08]

what-to-do:
- Change `GROUP_PROVEDOR.condition` from unconditional visibility to the enabled-provider-assignment rule.
- Update the sidebar footer avatar to show `user.image` when present and fall back to initials otherwise.

files-to-touch:
- `apps/web/src/routes/panel.tsx`

verification:
- non-provider users do not see the Provedor group
- provider users with enabled assignments do see it

#### Execution Notes

- The rule is capability-based, not role-name-based.

### ST-03 - Add route guards for provider-only pages

status: blocked
model: medium
escalate-if: []
blocked-by: [T-13-08]

what-to-do:
- Guard `/panel/dashboard/configuration` and `/panel/dashboard/announcements` so non-providers redirect to `/panel/account`.
- Reuse the same enabled-provider-assignment rule as the sidebar gate.

files-to-touch:
- `apps/web/src/routes/panel/dashboard/configuration.tsx`
- `apps/web/src/routes/panel/dashboard/announcements.tsx`

verification:
- direct URL access by a non-provider redirects with visible feedback

#### Execution Notes

- Keep behavior aligned across nav visibility and route access.

### ST-04 - Add Playwright coverage for the slim dashboard and guards

status: blocked
model: medium
escalate-if: []
blocked-by: [T-13-08]

what-to-do:
- Add E2E coverage for the slim dashboard rendering, no embedded list, sidebar gating, route-guard redirects, and avatar fallback/image behavior.
- Do not use `test.skip()`; extend seeds if needed.

files-to-touch:
- `apps/web/tests/dashboard.spec.ts`
- relevant seed/setup files

verification:
- `bun run test:e2e`
- `bun run check`
- `bun run check-types`

#### Execution Notes

- The acceptance bar includes visual fit in a 1280×1024 viewport.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
