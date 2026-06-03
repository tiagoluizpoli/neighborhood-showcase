# Slice 18: Admin Providers Directory Filters & Role Management

## Parent

PRD-v2-backlog-overhaul (Items 9, 10)

## What to build

Fix the admin providers directory, add geographic filters, and build a full user/role management screen with strict hierarchy enforcement and audit trail.

### Providers Directory (Item 9)
1. **Fix display bug**: External providers are currently excluded from the directory. Investigate and fix the query filter so all providers (internal, external, moderators, admins) appear.
2. **Geographic filters**: Add composable select inputs for Condominium, City, and Neighborhood. Filters should chain (selecting a city narrows the neighborhood dropdown, etc.).
3. **Provider visibility**: Respect the `isProviderVisible` opt-out toggle (added in Slice 6). Users who opted out should not appear in the directory.

### Role Management (Item 10)
4. **All-users listing**: Create an admin screen listing ALL users in the system (not just providers) with search by name/email and filtering capabilities.
5. **Role promotion/demotion UI**: From the user listing, admins can:
   - Promote a user to `SYSTEM_MANAGER` (only if the current admin is also `SYSTEM_MANAGER`)
   - Assign `MODERATOR` role tied to specific condominiums (one moderator → many condominiums)
   - Toggle provider visibility for any user
6. **Strict hierarchy enforcement**: The backend must reject `SYSTEM_MANAGER` promotion attempts from non-`SYSTEM_MANAGER` users.
7. **Audit trail**: Create a `role_change_log` table recording (`actorId`, `targetUserId`, `previousRole`, `newRole`, `condominiumId`, `timestamp`). Every role change writes a log entry.
8. **CLI bootstrap preserved**: The existing CLI command for initial `SYSTEM_MANAGER` creation remains functional.

## Acceptance criteria

- [ ] External providers appear in the directory (bug fixed)
- [ ] Geographic filters (Condominium, City, Neighborhood) work and chain correctly
- [ ] Opted-out providers are hidden from the directory
- [ ] All-users listing screen with search and filtering exists
- [ ] `SYSTEM_MANAGER` promotion restricted to existing `SYSTEM_MANAGER` users
- [ ] `MODERATOR` assignment supports one-to-many condominium scope
- [ ] `role_change_log` table records every role change with actor, target, roles, timestamp
- [ ] CLI bootstrap command still works for initial admin setup
- [ ] Integration tests: hierarchy enforcement, audit trail creation, filter queries, bug fix verification

## Blocked by

- #40 (Panel Sidebar Navigation)
- #41 (Account Page & Avatar Menu)
