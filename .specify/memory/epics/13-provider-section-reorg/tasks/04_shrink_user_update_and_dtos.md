---
type: feature
epic: 13-provider-section-reorg
status: completed
blocked-by: 03_provider_profile_router.md
---

## What to Build

Shrink the existing `trpc.user.update` mutation: input shape becomes `{ name?, language?, theme?, image?, phone? }`; the old `socialLinks` and `isProviderVisible` fields are REMOVED from the input and the mutation stops writing to the `provider_profile` table. Extend the `trpc.user.getProfile` DTO with `image`, `language`, `theme`, `emailVerified` and REMOVE `socialLinks` and `isProviderVisible`. Extend the public `trpc.user.getPublicProfile` DTO with `companyName?`, `tradeName?`, `logoUrl?`, `bannerUrl?`, `publicDescription?` and REPLACE the `name` field with `displayName` (the Profile's display name per the glossary). The Conta page reads the User DTO and nothing else (Module 25 §"Architecture"). Existing public filters (BANNED, soft-deleted, isProviderVisible = false) MUST be preserved.

## Context

Module 25 of `/PRD.md`, §"Architecture: strict User/Provider Profile split" and §"Backend: DTO shapes". Depends on tasks 02 + 03 (the new `trpc.providerProfile` must exist before `trpc.user.update` stops writing to `provider_profile` — otherwise we lose data). This is the breaking change that the Conta page and the public Provider page depend on. The DTO shape changes are backwards-incompatible at the API level — verify that no other consumer (admin flows, tests) reads `socialLinks` or `isProviderVisible` from `trpc.user.getProfile` before shipping.

## Acceptance Criteria

- [x] `trpc.user.update` input Zod schema accepts ONLY `{ name?, language?, theme?, image?, phone? }` — no `socialLinks`, no `isProviderVisible`
- [x] `trpc.user.update` no longer writes to the `provider_profile` table (verify via integration test that calls the mutation and asserts the `provider_profile` row is unchanged)
- [x] `trpc.user.getProfile` DTO includes `image`, `language`, `theme`, `emailVerified`; REMOVES `socialLinks` and `isProviderVisible`
- [x] `trpc.user.getPublicProfile` DTO includes the 4 new branding fields; `name` field is REPLACED with `displayName`
- [x] Public filters preserved: BANNED users, soft-deleted users, and `isProviderVisible = false` users are still hidden
- [x] Integration tests cover: (a) `user.update` with `language: 'en'` persists, (b) `user.update` with `socialLinks` field rejected by Zod, (c) `user.getProfile` returns the new shape (no `socialLinks`/`isProviderVisible`), (d) `user.getPublicProfile` returns the new shape with `displayName`, (e) BANNED user is excluded from public lookup, (f) `user.update` does NOT mutate `provider_profile`
- [x] NO `test.skip()`; all tests run against the real test database
- [x] `bun run check` and `bun run check-types` pass with zero warnings

## Sub-Tasks

### Sub-task 1: Shrink the `user.update` input + DTO + write paths

**What to do:** Edit `apps/server/src/presentation/routers/user.ts` to update the `update` Zod schema to the new input shape. Edit `apps/server/src/application/use-cases/user/update-user.ts` to drop `socialLinks` and `isProviderVisible` from the parameter object. Edit `apps/server/src/infrastructure/db/user-repository.ts` so `updateProfile` only writes to the `user` row (no `provider_profile` write). Update the `UserProfileDTO` returned by `getProfile` to include `image`, `language`, `theme`, `emailVerified` and to drop `socialLinks` and `isProviderVisible`.

**Files to touch:** `apps/server/src/presentation/routers/user.ts`, `apps/server/src/application/use-cases/user/update-user.ts`, `apps/server/src/infrastructure/db/user-repository.ts`, `apps/server/src/application/use-cases/user/get-user-profile.ts`

**Verification:** `bun run check-types` passes; no imports of `socialLinks` / `isProviderVisible` remain in the user update path.

### Sub-task 2: Extend the public DTO with the 4 new fields and `displayName`

**What to do:** Edit the `GetPublicProviderProfile` use case and the `PublicProviderProfileResult` DTO. Add `companyName`, `tradeName`, `logoUrl`, `bannerUrl`, `publicDescription` to the DTO. Replace the `name` field with `displayName` (read from the Provider Profile, NOT from the User's `name`). Preserve the existing filters (BANNED, soft-deleted, `isProviderVisible = false`).

**Files to touch:** `apps/server/src/application/use-cases/user/get-public-provider-profile.ts`, `apps/server/src/infrastructure/db/mappers/user.mapper.ts` (or wherever the public DTO is shaped)

**Verification:** `bun run check-types` passes; the mapper assembles the new DTO shape.

### Sub-task 3: Integration tests (real test DB)

**What to do:** Create `apps/server/src/application/use-cases/user/update-user.integration.test.ts` and extend `apps/server/src/application/use-cases/user/get-public-provider-profile.integration.test.ts`. Cover: (a) `user.update` with `language: 'en'` persists, (b) `user.update` with `socialLinks` is rejected by Zod, (c) `user.getProfile` returns the new shape (no `socialLinks`/`isProviderVisible`), (d) `user.getPublicProfile` returns the new shape with `displayName`, (e) BANNED user is excluded from public lookup, (f) `user.update` does NOT mutate `provider_profile`. NO `test.skip()`.

**Files to touch:** `apps/server/src/application/use-cases/user/update-user.integration.test.ts` (new), `apps/server/src/application/use-cases/user/get-public-provider-profile.integration.test.ts` (extend)

**Verification:** All 6 scenarios pass for real. `bun run test` is green.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->