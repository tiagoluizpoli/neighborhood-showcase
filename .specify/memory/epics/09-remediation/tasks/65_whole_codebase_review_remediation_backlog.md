---
type: epic
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Convert the whole-codebase audit into a durable, risk-first remediation queue that Ralph Loop can execute one slice at a time.

This umbrella issue is not itself an implementation slice. It exists to preserve the audit context, ordering, and rationale behind the child issues created from the review.

The review found four major categories of work:

1. Correctness and access-control bugs.
2. Provider Profile seam cleanup and privacy enforcement.
3. Oversized shallow modules that need deeper seams.
4. Documentation and architecture-source-of-truth alignment.

## Acceptance Criteria

- [x] Every finding from the whole-codebase audit is represented by an executable child issue or already-resolved documentation artifact.
- [x] Child issues are ordered by risk/correctness first, then seam cleanup, then large decomposition, then hygiene/performance cleanup.
- [x] Each child issue is narrow enough for Ralph Loop to execute independently.
- [x] Each child issue preserves behavior unless it explicitly documents an approved behavior change.
- [x] Each child issue includes validation guidance.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
