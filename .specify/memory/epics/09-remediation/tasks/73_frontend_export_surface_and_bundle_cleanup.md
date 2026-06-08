---
type: refactor
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Perform a frontend hygiene and performance cleanup focused on two audit findings:

1. default exports that contradict local named-export guidance
2. oversized build output caused by the current route/module shape

This slice should follow the larger route-family decomposition work so it can clean up the resulting surface rather than fighting against it.

## Acceptance Criteria

- [x] Web production code follows the local named-export rule for files touched by this slice, unless an exception is explicitly documented.
- [x] The bundle warning is addressed through route/module splitting or documented budget decisions rather than ignored.
- [x] Any remaining oversized chunks have an explicit explanation in the issue progress notes.
- [x] Focused validation covers the relevant web build path.
- [x] `bun run check`, `bun run check-types`, and any relevant focused tests/build checks pass.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
