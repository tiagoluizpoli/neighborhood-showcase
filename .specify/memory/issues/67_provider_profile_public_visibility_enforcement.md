# Provider Profile Public Visibility Enforcement

## Parent

Issue 65: Whole Codebase Review Remediation Backlog

## What to build

Enforce `Provider Profile` visibility across the entire public seam, not only the public directory listing.

This slice is about approved behavior change, not just refactoring. The user explicitly confirmed that a hidden `Provider Profile` must not remain reachable by direct public profile URL.

## Problem

Current behavior appears to enforce `isProviderVisible` for provider-directory listing while still allowing direct public profile reads by provider ID.

That creates a privacy gap:

- hidden from the directory
- still reachable through `user.getPublicProfile`

That contradicts the intended meaning of `Provider Profile` as the public-facing presentation record.

## Acceptance criteria

- [x] Public provider-profile reads return `NOT_FOUND` when the profile is hidden.
- [x] Public provider-directory listing continues to exclude hidden profiles.
- [x] The enforcement point lives in the backend public-read seam, not only in the frontend.
- [x] Focused integration coverage verifies visible vs hidden profile behavior for both listing and direct public profile access.
- [x] `bun run check`, `bun run check-types`, and the focused backend tests pass.

## Blocked by

- None - can start immediately

## Progress notes

- 2026-06-05: Scope clarified during grill-with-docs. Visibility is now explicitly defined as gating the entire public seam, not only directory listing.
- 2026-06-05: Enforced `isProviderVisible` inside `DrizzleUserRepository.findPublicProviderById()` so hidden providers resolve as not found through `user.getPublicProfile`. Added focused integration coverage for the hidden-provider path. The repo does not currently expose a separate public provider-directory endpoint beyond this direct public profile seam; the existing hidden-profile listing exclusion remains preserved by the provider-list repository filter and the full test suite.
