---
type: task
id: T-14-04
epic: E-14
status: ready
blocked-by: [T-14-02, T-14-03]
default-model: medium
---

## What to Build

Centralize deterministic landing resolution so single-scope users go directly to their own section, no-scope users fail closed into the correct setup/onboarding surface, and multi-scope users keep intentional deterministic behavior without forcing a new generic chooser home.

## Context

Once Provider and non-Provider section ownership are explicit, the remaining contract is cross-cutting landing resolution. PRD-v8 defers a neutral chooser/home unless implementation proves it is truly necessary, and explicitly requires fail-closed behavior when the system cannot prove a valid scope.

## Acceptance Criteria

- [ ] Single-scope users land directly in their own section-specific dashboard.
- [ ] Users with no valid dashboard scope are redirected to the correct setup/onboarding surface instead of being broadened into access.
- [ ] Multi-scope users retain deterministic landing behavior under one explicit resolver.
- [ ] Unauthorized fallbacks redirect to section-correct destinations rather than ambiguous generic dashboard behavior.
- [ ] Automated coverage proves no-scope and multi-scope cases with real seeded states.

## Sub-Tasks

### ST-01 - Centralize landing-resolution rules

status: ready
model: medium
escalate-if: []
blocked-by: [T-14-02, T-14-03]

what-to-do:
- Implement one explicit resolver for panel landing decisions across single-scope, no-scope, and multi-scope cases.
- Ensure the resolver consumes the section contracts established in earlier tasks instead of inventing new ambiguity.
- Keep the future neutral chooser/home deferred unless implementation proves it is unavoidable.

files-to-touch:
- `apps/web/src/routes/`
- shared landing/redirect helpers
- touched auth/panel entry points

verification:
- `bun run check`
- `bun run check-types`
- targeted route tests for landing-resolution cases

#### Execution Notes

- If a chooser/home becomes unavoidable, it must remain a thin selector, not a new dashboard.
- Prefer explicit decision branches over hidden fallback cascades.

### ST-02 - Wire fail-closed no-scope behavior to setup/onboarding surfaces

status: ready
model: medium
escalate-if: []
blocked-by: [T-14-02, T-14-03]

what-to-do:
- Route no-scope users to the correct setup/onboarding destination for their proven state.
- Remove touched fallback behavior that improvises access when the scope cannot be proven.
- Keep route outcomes deterministic and reviewable.

files-to-touch:
- `apps/web/src/routes/panel.dashboard.tsx`
- touched setup/onboarding route files
- touched fallback/redirect helpers

verification:
- `bun run check`
- `bun run check-types`
- no-scope tests prove fail-closed outcomes

#### Execution Notes

- Fail closed is a security/product rule, not an implementation preference.

### ST-03 - Add executable test matrix for no-scope and multi-scope landings

status: ready
model: medium
escalate-if: []
blocked-by: [T-14-02, T-14-03]

what-to-do:
- Add seeded coverage for no-scope users and for deterministic multi-scope users.
- Add Playwright assertions for sign-in landing, legacy-route landing, and unauthorized fallback outcomes.
- Use screenshot assertions where needed to verify visible section identity or setup-shell identity.

files-to-touch:
- `apps/web/tests/`
- relevant snapshot files
- relevant seed/setup files

verification:
- `bun run test:e2e`
- `bun run check`
- `bun run check-types`

#### Execution Notes

- The test matrix should make landing behavior reviewable by role/capability combination.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
