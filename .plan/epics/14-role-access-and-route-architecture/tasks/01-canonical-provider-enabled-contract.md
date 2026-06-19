---
type: task
id: T-14-01
epic: E-14
status: ready
blocked-by: []
default-model: medium
---

## What to Build

Create one canonical backend-derived Provider-enabled contract and replace broad approved-assignment heuristics with that contract across navigation visibility, route guarding, redirect resolution inputs, and test seeding.

## Context

The current codebase still uses broad approved-assignment checks in the panel shell and several Provider-semantic routes. PRD-v8 explicitly rejects arbitrary approved assignments as the Provider authorization rule and requires one stable backend-derived decision that the frontend and router consume consistently.

## Acceptance Criteria

- [ ] One backend-derived Provider-enabled contract exists and is reusable from the highest practical seam.
- [ ] Broad approved-assignment heuristics no longer act as the Provider authorization rule in touched panel navigation and guard code.
- [ ] Seeded test states exist for Provider-enabled, Provider-disabled, Moderator-only, Administrator, and System Manager scenarios without `test.skip()`.
- [ ] Verification proves the shared contract is used consistently by backend-facing tests and by the touched frontend/router call sites.

## Sub-Tasks

### ST-01 - Define the canonical Provider-enabled decision

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Identify the highest practical backend seam for the canonical Provider-enabled decision.
- Implement one reusable contract that reflects the glossary rule for Provider-enabled state.
- Ensure the contract is backend-derived and does not depend on frontend-only heuristics.

files-to-touch:
- `apps/server/src/`
- related domain/application/infrastructure files for assignment/capability resolution
- any shared DTO or presentation seam needed to expose the decision

verification:
- `bun run check`
- `bun run check-types`
- targeted backend test coverage for the canonical Provider-enabled decision

#### Execution Notes

- Respect Clean Architecture boundaries while choosing the seam.
- Use project glossary terms exactly: User, Provider, Provider Assignment, Provider-enabled.

### ST-02 - Replace broad Provider heuristics in touched panel consumers

status: ready
model: medium
escalate-if: []
blocked-by: [T-14-01]

what-to-do:
- Replace touched broad approved-assignment checks in panel navigation and route-access call sites with the canonical Provider-enabled decision.
- Keep navigation visibility and route authorization driven by the same rule.
- Remove any touched code that still treats a generic approved assignment as Provider access.

files-to-touch:
- `apps/web/src/routes/panel.tsx`
- `apps/web/src/routes/panel/dashboard/configuration.tsx`
- `apps/web/src/routes/panel/dashboard/announcements.tsx`
- other touched panel route files that currently inline Provider heuristics

verification:
- `bun run check`
- `bun run check-types`
- touched unit/integration tests pass with the canonical rule

#### Execution Notes

- Touch only the call sites needed to establish the shared contract.
- If additional stale heuristics are discovered outside scope, log them for later follow-up instead of broadening the task uncontrolled.

### ST-03 - Seed explicit capability states for execution and E2E

status: ready
model: medium
escalate-if: []
blocked-by: [T-14-01]

what-to-do:
- Add or update test seed/setup flows so Provider-enabled, Provider-disabled, Moderator-only, Administrator, and System Manager scenarios are real executable states.
- Remove reliance on placeholder comments or skipped coverage for privileged/non-Provider route behavior.
- Keep seed data deterministic and named clearly for Playwright and backend tests.

files-to-touch:
- `apps/web/tests/`
- relevant seed/setup files
- backend integration test setup where needed

verification:
- `bun run test`
- `bun run test:e2e`
- seeded role/capability scenarios execute without `test.skip()`

#### Execution Notes

- The user has explicitly rejected the old “missing admin seed” skip pattern.
- Prefer additive seeds over fragile test-time mutation.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
