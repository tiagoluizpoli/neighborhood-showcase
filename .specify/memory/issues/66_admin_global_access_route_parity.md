# Admin Global Access Route Parity

## Parent

Issue 65: Whole Codebase Review Remediation Backlog

## What to build

Fix global-admin route parity so the web entry points enforce the same role hierarchy already documented in `CONTEXT.md` and partially enforced on the backend.

This slice is intentionally narrow. It should correct the access-control mismatch without mixing in unrelated UI or architecture refactors.

## Problem

The backend admin router already treats `ADMINISTRATOR` as a global admin role alongside `SYSTEM_MANAGER`, but at least one web route guard still blocks `ADMINISTRATOR` access and redirects the user away from `/panel/admin`.

That creates an authorization mismatch between the public seam of the web app and the server-side policy.

## Acceptance criteria

- [x] Web route guards for global admin entry points allow both `SYSTEM_MANAGER` and `ADMINISTRATOR`.
- [x] Current moderator-only logic remains unchanged unless the route is explicitly global-admin scoped.
- [x] Access behavior matches the role hierarchy in `CONTEXT.md`.
- [x] Focused route tests cover `USER`, `SYSTEM_MANAGER`, and `ADMINISTRATOR` behavior for the affected routes.
- [x] `bun run check` and `bun run check-types` pass for the slice.

## Blocked by

- None - can start immediately

## Progress notes

- 2026-06-05: Created from the whole-codebase audit after confirming that backend admin procedures already accept `ADMINISTRATOR` while the web admin route guard still rejects it.
- 2026-06-05: Updated `apps/web/src/routes/panel.admin.tsx` to admit both global admin roles and extended `apps/web/src/routes/-guards.test.ts` to cover `USER`, `SYSTEM_MANAGER`, and `ADMINISTRATOR` outcomes. Verified with `bun run test`, `bun run check-types`, and `bun run check`.
