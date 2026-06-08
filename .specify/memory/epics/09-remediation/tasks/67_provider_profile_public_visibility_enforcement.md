---
type: feature
epic: 09-remediation
status: completed
blocked-by: null
---

## What to Build

Enforce `Provider Profile` visibility across the entire public seam, not only the public directory listing.

This slice is about approved behavior change, not just refactoring. The user explicitly confirmed that a hidden `Provider Profile` must not remain reachable by direct public profile URL.

## Acceptance Criteria

- [x] Public provider-profile reads return `NOT_FOUND` when the profile is hidden.
- [x] Public provider-directory listing continues to exclude hidden profiles.
- [x] The enforcement point lives in the backend public-read seam, not only in the frontend.
- [x] Focused integration coverage verifies visible vs hidden profile behavior for both listing and direct public profile access.
- [x] `bun run check`, `bun run check-types`, and the focused backend tests pass.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
