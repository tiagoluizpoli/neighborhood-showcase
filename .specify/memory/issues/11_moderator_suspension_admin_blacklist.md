## What to build

Implement local moderator announcement suspensions in `/moderation` and global System Manager blacklist controls in `/admin`. Allows local moderators to hide violating ads and global admins to blacklist CPFs.

## Acceptance criteria

- [x] Local moderators can click a "Suspend" action on active ads in their condo, prompting for a suspension reason and changing ad status to `SUSPENDED`.
- [x] Global admins can search a directory of all registered providers.
- [x] Global admin "Ban" action changes user status to `BANNED`, removes all their active announcements, revokes sessions, and adds their hashed CPF to `blacklisted_identifiers`.
- [x] Global admin blacklist panel allows adding CPF hashes (with reason) and removing them.
- [x] Integration tests verify that suspensions hide ads, banning logs out the user, and blacklisted CPFs cannot register again.

## Blocked by

- [.specify/memory/issues/10_provider_dashboard_lgpd.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/10_provider_dashboard_lgpd.md)
