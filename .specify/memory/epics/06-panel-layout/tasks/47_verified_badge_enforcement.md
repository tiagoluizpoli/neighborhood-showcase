---
type: feature
epic: 06-panel-layout
status: blocked
blocked-by: null
---

## What to Build

Fix the backend enforcement gap in the verified badge system so that `showVerifiedBadge` can only be set by eligible providers, and auto-revoke it when eligibility is lost.

1. **Update procedure parity**: The `update` tRPC procedure in the announcement router currently allows setting `showVerifiedBadge = true` without checking the provider's assignment status. Add the same verification check that exists on `create`: the provider must have an `APPROVED` assignment of type `RESIDENT` before `showVerifiedBadge` can be set to `true`.
2. **Auto-revocation**: When a provider's assignment status changes from `APPROVED` to `REJECTED` or `PENDING` (or the assignment is deleted), automatically set `showVerifiedBadge = false` on ALL their active announcements. This should be triggered in the assignment update use case / repository.
3. **Frontend disabled state**: The "Morador Verificado" toggle on the announcement form should appear disabled with a tooltip explaining how to get verified when the provider does not have an approved RESIDENT assignment.

## Acceptance Criteria

- [x] `update` tRPC procedure rejects `showVerifiedBadge = true` if provider lacks an `APPROVED` `RESIDENT` assignment
- [x] Auto-revocation: assignment status change cascades `showVerifiedBadge = false` on all active announcements
- [x] Frontend toggle is disabled with explanatory tooltip for unverified providers
- [x] Integration test: update with `showVerifiedBadge = true` returns error for unverified provider
- [x] Integration test: assignment revocation cascades badge removal

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
