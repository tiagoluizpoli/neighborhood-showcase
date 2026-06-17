# Deferred Backlog

> Issues surfaced during Ralph Loop iterations that need resolution before
> their dependent tasks can proceed.

---

## 2026-06-09 — No ADMINISTRATOR user seeded for Playwright tests

**Blocked task:** `11-i18n-and-navigation-fixes/03_spectrum_item_hierarchy_fix` (sub-task 2: Playwright test)

**Problem:** The Playwright test for Spectrum hierarchy requires logging in as an ADMINISTRATOR role user. No such user exists in the database seed.

**Existing seeded users:** `provider@test.com` (USER role), `moderator@test.com` (not verified), etc. No admin@ or any user with ADMINISTRATOR role.

**Impact:**
- `spectrum-nav.spec.ts` cannot be run as-is
- Any future Playwright test requiring ADMINISTRATOR session will have the same blocker

**Options to unblock:**
1. Add an `INSERT INTO "user"` statement with `role = 'ADMINISTRATOR'` to the seed migration or a dedicated seed SQL file
2. Create a `POST /auth/admin-promote` endpoint (not appropriate for tests)
3. Add admin credentials via environment variable / .env seed script
4. Use better-auth's testing utilities to inject a session directly (if available)

**Recommended:** Option 1 — add a seed user in `packages/db/src/migrations/` or create a dedicated `seed.sql` file that's applied after migrations.

---

<!-- INDEX SYNC: Update this file when surfacing a new blocker. Remove entries when resolved. -->