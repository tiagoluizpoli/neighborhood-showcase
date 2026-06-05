# Frontend Export Surface And Bundle Cleanup

## Parent

Issue 65: Whole Codebase Review Remediation Backlog

## What to build

Perform a frontend hygiene and performance cleanup focused on two audit findings:

1. default exports that contradict local named-export guidance
2. oversized build output caused by the current route/module shape

This slice should follow the larger route-family decomposition work so it can clean up the resulting surface rather than fighting against it.

## Problem

The whole-codebase audit found:

- default exports still present in several web modules
- a large main bundle warning during the full web build

These are not the highest-risk issues, but they should be cleaned up as part of the whole-codebase remediation queue.

## Acceptance criteria

- [ ] Web production code follows the local named-export rule for files touched by this slice, unless an exception is explicitly documented.
- [ ] The bundle warning is addressed through route/module splitting or documented budget decisions rather than ignored.
- [ ] Any remaining oversized chunks have an explicit explanation in the issue progress notes.
- [ ] Focused validation covers the relevant web build path.
- [ ] `bun run check`, `bun run check-types`, and any relevant focused tests/build checks pass.

## Blocked by

- Issues 70, 71, and 72 should land first so the cleanup happens against the intended frontend seams.

## Progress notes

- 2026-06-05: Created from the whole-codebase audit after `bun run check-types` emitted a large web chunk warning and the repo scan found multiple remaining default exports in web production modules.
