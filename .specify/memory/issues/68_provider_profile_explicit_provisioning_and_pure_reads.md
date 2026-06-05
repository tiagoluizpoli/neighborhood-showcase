# Provider Profile Explicit Provisioning And Pure Reads

## Parent

Issue 65: Whole Codebase Review Remediation Backlog

## What to build

Remove write-on-read behavior from the `Provider Profile` seam and move profile provisioning to an explicit write path.

This slice is the main backend seam cleanup that should follow the public-visibility fix.

## Problem

`DrizzleUserRepository` currently creates or backfills provider-profile rows during read methods.

That makes the module shallow and surprising:

- reads silently mutate storage
- behavior depends on hidden provisioning side effects
- testing and retry semantics become harder to reason about

The user explicitly approved the opposite model during grill-with-docs:

- public reads are pure reads
- private reads are pure reads
- provisioning happens only through an explicit write path

## Acceptance criteria

- [x] No production read path creates or updates provider-profile rows implicitly.
- [x] Provider-profile provisioning happens through an explicit write path or migration-backed setup path.
- [x] Public and private read methods return existing data or absence without mutating storage.
- [x] The new seam preserves currently intended observable behavior except for the already-approved visibility correction.
- [x] Focused backend tests cover no-profile, visible-profile, hidden-profile, and profile-update scenarios.
- [x] `bun run check`, `bun run check-types`, and focused backend tests pass.

## Blocked by

- Issue 67 should land first so the public-seam contract is explicit before the repository seam is reshaped.

## Progress notes

- 2026-06-05: Scope clarified during grill-with-docs. The repository should stop performing `ensureProviderProfile` writes during reads and move provisioning behind an explicit write seam.
- 2026-06-05: Completed by removing `ensureProviderProfile` from `DrizzleUserRepository` read paths, preserving fallback read behavior in memory, and proving the seam with focused integration tests for public fallback, private fallback, hidden-profile rejection, and explicit profile updates.
