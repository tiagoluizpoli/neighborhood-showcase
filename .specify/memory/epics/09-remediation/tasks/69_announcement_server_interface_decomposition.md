---
type: refactor
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Deepen the backend `Announcement` seam by decomposing the oversized server interface into narrower modules grouped by domain capability.

This slice should preserve behavior while making the server easier to navigate, test, and evolve.

## Acceptance Criteria

- [x] Production behavior remains unchanged unless a separately approved behavior fix is documented.
- [x] Router and repository interfaces are decomposed by domain capability, not arbitrary helper extraction.
- [x] Files touched in the slice move materially closer to the local 300-line rule.
- [x] Focused tests continue to cover public announcement, provider dashboard, payment, moderation, and reporting behavior.
- [x] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
