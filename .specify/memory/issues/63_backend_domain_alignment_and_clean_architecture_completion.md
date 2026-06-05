# Backend Domain Alignment & Clean Architecture Completion

## Parent

Epic: Backend Clean Architecture Sweep

## What to build

Complete the remaining backend recovery work so the server follows the clarified domain model and composition-root pattern end to end.

This slice focuses on the parts of the backend that still carry the old identity and role assumptions:

- `User` remains the authentication identity root.
- `Provider` is modeled as a separate relation/capability, not a global role.
- `Provider Assignment` is the canonical operating-context relation for provider-to-condominium/address links.
- `Provider Profile` owns public branding data for provider-facing pages.
- Global roles follow the hierarchy `USER < SYSTEM_MANAGER < ADMINISTRATOR`.
- `MODERATOR` stays condo-scoped and is not a global user role.
- Server wiring lives under `src/main/`, where bootstrap, router assembly, and dependency injection belong.

The slice must preserve current observable behavior while moving the remaining backend code onto the clarified boundaries.

## Acceptance criteria

- [x] The auth/user role model stores and enforces `USER < SYSTEM_MANAGER < ADMINISTRATOR`.
- [x] `MODERATOR` is no longer treated as a global user role.
- [x] Provider-facing public data is read from provider-profile data, not from auth identity fields.
- [x] Provider operating context uses the provider-assignment relation consistently.
- [x] Backend bootstrap and DI wiring are owned by the `src/main/` composition root.
- [x] Remaining backend production code respects the clean-architecture dependency direction.
- [x] Focused integration tests cover the role hierarchy, provider profile, provider assignment, and wiring behavior.
- [x] Backend type-check and test commands pass for the slice.

## Blocked by

- None - can start immediately

## Progress notes

- 2026-06-05: Iteration 1 completed the role-model verification slice already in progress in the worktree. Validated the new `USER < SYSTEM_MANAGER < ADMINISTRATOR` global role enum through auth signup defaults plus focused admin-router integration coverage, added explicit `ADMINISTRATOR` access assertions for `listUsers`, `promoteToSystemManager`, `assignModerator`, and `toggleProviderVisibility`, and removed stale `PROVIDER` expectations from those focused backend tests. `bun run check`, `bun run check-types`, and `bun run test` all passed.
- 2026-06-05: Iteration 2 introduced a dedicated `provider_profile` persistence path and migrated provider-facing public branding data off the auth table. Added the `provider_profile` schema + migration backfill, routed `GetPublicProviderProfile` through a new repository DTO sourced from provider-profile storage, moved provider social-links/visibility reads and writes in `DrizzleUserRepository` to provider-profile records, and added focused integration coverage for public profile reads, profile updates, and admin provider listing visibility behavior. `bun run check`, `bun run check-types`, and `bun run test` all passed.
- 2026-06-05: Iteration 3 completed the remaining public announcement branding slice. Updated `DrizzleAnnouncementRepository` so public announcement detail/feed DTOs read provider display name and avatar from `provider_profile` with auth-field fallback only when no profile row exists, and extended focused integration coverage for `GetPublicAnnouncement`, `ListPublicAnnouncements`, and the public announcement router procedure to assert provider-profile branding wins over auth identity fields. `bun run check`, `bun run check-types`, and `bun run test` all passed.
- 2026-06-05: Iteration 4 moved server bootstrap onto an explicit `src/main/` composition-root API. Extracted `createMainDependencies`, `createServer`, and `startServer` from `src/main/index.ts`, changed `src/index.ts` to start the server through that entrypoint, and added focused integration coverage that boots the real composed Fastify app and asserts the health, upload, and webhook routes are registered through main wiring. `bun run check`, `bun run check-types`, and `bun run test` all passed.
- 2026-06-05: Iteration 5 completed the remaining provider-assignment terminology cleanup in production schema code. Renamed the last old `providerLocation*` enum exports in `packages/db/src/schema/showcase.ts` to `providerAssignment*`, keeping the persisted PostgreSQL type names stable while aligning the code vocabulary with the canonical provider-assignment relation already exercised by focused assignment, provider-profile, announcement, and admin integration tests. `bun run check`, `bun run check-types`, and `bun run test` all passed, so Issue 63 is complete.
