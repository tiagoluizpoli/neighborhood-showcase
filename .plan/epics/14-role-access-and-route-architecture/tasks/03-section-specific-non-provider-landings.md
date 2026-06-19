---
type: task
id: T-14-03
epic: E-14
status: blocked
blocked-by: [history-retrieval-exhausted]
default-model: medium
---

## What to Build

Make Moderator, Administrator, and System Manager users land in their own section-specific dashboard architecture instead of piggybacking on Provider semantics, including safe migration redirects from the legacy dashboard entry path.

## Context

PRD-v8 requires Moderator, Administrator, and System Manager experiences to stay semantically separate from Provider. The current panel still redirects non-Provider roles through ambiguous dashboard behavior. This task establishes section-correct default landings and removes Provider fallback semantics from privileged non-Provider journeys.

## Acceptance Criteria

- [ ] Moderator default landing is section-correct and not Provider-semantic.
- [ ] Administrator and System Manager default landings are section-correct under Administration/System Management ownership.
- [ ] Legacy `/panel/dashboard` redirects send Moderator, Administrator, and System Manager users to the correct section destination.
- [ ] Administrator and System Manager executable seeds exist and are used by automated tests.
- [ ] Playwright and route coverage prove section-correct landings for each touched role.

## Sub-Tasks

### ST-01 - Define section-correct landings for Moderator, Administrator, and System Manager

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Identify the canonical landing route for Moderator, Administrator, and System Manager under the PRD-v8 contract.
- Implement redirect/landing resolution so those roles do not inherit Provider dashboard semantics.
- Keep any shared implementation primitives invisible at the route-contract level.

files-to-touch:
- `apps/web/src/routes/panel.moderation.tsx`
- `apps/web/src/routes/panel.admin.tsx`
- related panel landing/guard helpers
- other touched role-entry routes

verification:
- `bun run check`
- `bun run check-types`
- route-level tests for touched Moderator/Admin/System Manager landings

#### Execution Notes

- Preserve Moderation as its own section.
- Administration/System Management may share internals, but not Provider route semantics.

### ST-02 - Seed Administrator and System Manager journeys for executable tests

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Create deterministic Administrator and System Manager seeded users and any required backing state.
- Replace placeholder assumptions in current tests with real executable credentials and fixtures.
- Keep seed names and capabilities obvious to future test authors.

files-to-touch:
- relevant seed/setup files
- `apps/web/tests/`
- backend test setup where needed

verification:
- `bun run test`
- `bun run test:e2e`
- no privileged-role coverage depends on placeholder comments or skipped tests

#### Execution Notes

- The repo already contains evidence of missing admin seed commentary; this task must close that gap.

### ST-03 - Add Playwright coverage for section-specific non-Provider landings

status: blocked
model: medium
escalate-if: []
blocked-by: [history-retrieval-exhausted]

what-to-do:
- Add E2E coverage proving Moderator, Administrator, and System Manager land in the correct section-specific destination after sign-in and after visiting legacy `/panel/dashboard`.
- Add screenshot assertions or other visible-shell checks to prove section identity.
- Verify unauthorized fallback behavior does not send these roles into Provider pages.

files-to-touch:
- `apps/web/tests/`
- relevant snapshot files
- relevant seed/setup files

verification:
- `bun run test:e2e`
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Runtime URL correctness alone is not enough; visible section identity matters.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
