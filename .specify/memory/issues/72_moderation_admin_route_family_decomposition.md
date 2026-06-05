# Moderation And Admin Route Family Decomposition

## Parent

Issue 65: Whole Codebase Review Remediation Backlog

## What to build

Deepen the moderation and admin route family so global-admin and moderator surfaces are composed from smaller, role-aware modules instead of giant route files.

## Problem

The current moderation/admin route family mixes:

- role and guard logic
- query orchestration
- mutation handlers
- modal state
- table rendering
- moderation/report queue behavior

inside very large route files.

This makes the route family shallow and raises the cost of future role and policy changes.

## Likely module targets

- Global admin user-management module
- Global admin provider/blacklist module
- Moderation residents module
- Moderation announcements module
- Moderation reports module

## Acceptance criteria

- [ ] Role-aware route entry points stay clear and behavior-preserving.
- [ ] Admin and moderation concerns are separated into deeper modules by shared seam.
- [ ] Oversized route files become materially smaller and easier to review.
- [ ] Focused route/component tests cover role behavior and the extracted submodules.
- [ ] `bun run check`, `bun run check-types`, and relevant focused tests pass.

## Blocked by

- Issue 66 should land first so access-control behavior is correct before decomposition begins.

## Progress notes

- 2026-06-05: Created from the architecture review after identifying `panel.admin.tsx` and `panel.moderation.tsx` as oversized mixed-responsibility route modules.
