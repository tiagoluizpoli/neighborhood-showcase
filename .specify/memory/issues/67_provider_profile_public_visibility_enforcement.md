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

- [ ] Public provider-profile reads return `NOT_FOUND` when the profile is hidden.
- [ ] Public provider-directory listing continues to exclude hidden profiles.
- [ ] The enforcement point lives in the backend public-read seam, not only in the frontend.
- [ ] Focused integration coverage verifies visible vs hidden profile behavior for both listing and direct public profile access.
- [ ] `bun run check`, `bun run check-types`, and the focused backend tests pass.

## Blocked by

- None - can start immediately

## Progress notes

- 2026-06-05: Scope clarified during grill-with-docs. Visibility is now explicitly defined as gating the entire public seam, not only directory listing.
