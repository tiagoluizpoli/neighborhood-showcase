---
type: refactor
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Remove write-on-read behavior from the `Provider Profile` seam and move profile provisioning to an explicit write path.

This slice is the main backend seam cleanup that should follow the public-visibility fix.

## Acceptance Criteria

- [x] No production read path creates or updates provider-profile rows implicitly.
- [x] Provider-profile provisioning happens through an explicit write path or migration-backed setup path.
- [x] Public and private read methods return existing data or absence without mutating storage.
- [x] The new seam preserves currently intended observable behavior except for the already-approved visibility correction.
- [x] Focused backend tests cover no-profile, visible-profile, hidden-profile, and profile-update scenarios.
- [x] `bun run check`, `bun run check-types`, and focused backend tests pass.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
