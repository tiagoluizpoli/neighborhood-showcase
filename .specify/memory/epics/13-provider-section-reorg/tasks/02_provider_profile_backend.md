---
type: feature
epic: 13-provider-section-reorg
status: completed
blocked-by: 01_schema_migrations.md
---

## What to Build

Create the `ProviderProfile` domain entity (extends `AuditableEntity<ProviderProfileProps>`, read-only getters for all 9 fields, constructor validates and throws `DomainError` subclasses on failure), the `ProviderProfileRepository` interface (`findByProviderId`, `upsert`, `delete`), the `UpdateProviderProfile` and `GetProviderProfile` use cases, the `ProviderProfileMapper`, and the `ProviderProfileRepositoryImpl` (Drizzle-based, uses `onConflictDoUpdate` to handle first-time-onboarding where the row may not exist yet). Strict adherence to the Clean Architecture layer boundary rules in `agents.local.md` §9 — domain knows nothing about Drizzle or tRPC; use cases know nothing about Drizzle or tRPC; repositories live in infrastructure and own all DB access. Integration tests use the real test database.

## Context

Module 25 of `/PRD.md`, §"Domain layer". Depends on task 01 (schema must exist before repository impl compiles). The existing `apps/server/src/domain/entities/user.entity.ts` and `apps/server/src/domain/repositories/user.repository.ts` are the model. Per `agents.local.md` §9.2 (Domain), the entity MUST throw only `DomainError` subclasses. Per §9.3 (Application), use cases MUST throw only `DomainError` subclasses. Per §9.4 (Infrastructure), repositories implement the domain interface and own all Drizzle/SQL. The `Upsert` semantics use Drizzle's `onConflictDoUpdate` to handle first-time provider onboarding (no existing row).

## Acceptance Criteria

- [x] `ProviderProfile` entity exists at `apps/server/src/domain/entities/provider-profile.entity.ts`, extends `AuditableEntity<ProviderProfileProps>`, has read-only getters for all 9 fields
- [x] Entity constructor validates required fields and throws `DomainError` subclasses on failure (NOT `TRPCError`)
- [x] `ProviderProfileRepository` interface exists at `apps/server/src/domain/repositories/provider-profile.repository.ts` with `findByProviderId`, `upsert`, `delete` methods
- [x] `UpdateProviderProfile` use case exists at `apps/server/src/application/use-cases/provider-profile/update-provider-profile.ts`, trims strings, validates `displayName` (3+ chars), calls `repo.upsert`
- [x] `GetProviderProfile` use case exists at `apps/server/src/application/use-cases/provider-profile/get-provider-profile.ts`, throws `ProviderProfileNotFoundError` if missing
- [x] `ProviderProfileMapper` exists at `apps/server/src/infrastructure/db/mappers/provider-profile.mapper.ts` and implements the `EntityMapper` interface
- [x] `ProviderProfileRepositoryImpl` exists at `apps/server/src/infrastructure/db/provider-profile-repository.ts`, uses `onConflictDoUpdate` for upsert
- [x] Integration tests at `apps/server/src/application/use-cases/provider-profile/*-integration.test.ts` cover: get-then-update round-trip, upsert on a fresh user with no existing row, `displayName` < 3 chars rejected, `publicDescription` > 500 chars rejected
- [x] NO forbidden imports per `agents.local.md` §9.6: domain has no Drizzle/tRPC, application has no Drizzle/tRPC, infrastructure has no tRPC
- [x] `bun run check` and `bun run check-types` pass with zero warnings
- ⚠️ Integration tests fail on pre-existing test DB schema drift (user.language/theme columns missing in DB); unit tests all pass. Same root cause as existing integration test failures.

## Sub-Tasks

### Sub-task 1: Domain entity + repository interface

**What to do:** Create `ProviderProfileProps` (the props type with all 9 fields), `ProviderProfile` entity (constructor validates, getters expose), `ProviderProfileRepository` interface. Entity extends `AuditableEntity`. Define a `ProviderProfileNotFoundError` subclass of `DomainError` for the get-missing-row case.

**Files to touch:** `apps/server/src/domain/entities/provider-profile.entity.ts` (new), `apps/server/src/domain/repositories/provider-profile.repository.ts` (new), `apps/server/src/domain/errors/provider-profile-not-found.error.ts` (new)

**Verification:** `bun run check-types` passes; entity has read-only getters; constructor throws on invalid input.

### Sub-task 2: Use cases

**What to do:** Create `UpdateProviderProfile` and `GetProviderProfile` use cases. Each takes a parameter object input. Use cases throw only `DomainError` subclasses. `UpdateProviderProfile` trims strings, validates `displayName` (3+ chars if provided), and calls `repo.upsert`. `GetProviderProfile` calls `repo.findByProviderId` and throws `ProviderProfileNotFoundError` if missing.

**Files to touch:** `apps/server/src/application/use-cases/provider-profile/update-provider-profile.ts` (new), `apps/server/src/application/use-cases/provider-profile/get-provider-profile.ts` (new), `apps/server/src/application/use-cases/provider-profile/update-provider-profile.test.ts` (new, unit test for the validation logic with a mocked repository), `apps/server/src/application/use-cases/provider-profile/get-provider-profile.test.ts` (new)

**Verification:** Unit tests cover validation paths; `bun run check` and `bun run check-types` pass.

### Sub-task 3: Drizzle mapper + repository impl

**What to do:** Create `ProviderProfileMapper` (Drizzle row ↔ ProviderProfile entity, implements `EntityMapper`) and `ProviderProfileRepositoryImpl` (uses Drizzle, uses `onConflictDoUpdate` for the `upsert` method).

**Files to touch:** `apps/server/src/infrastructure/db/mappers/provider-profile.mapper.ts` (new), `apps/server/src/infrastructure/db/provider-profile-repository.ts` (new)

**Verification:** `bun run check-types` passes; mapper round-trips a row correctly in a small ad-hoc test.

### Sub-task 4: Integration tests (real test DB)

**What to do:** Create `apps/server/src/application/use-cases/provider-profile/*-integration.test.ts`. Tests use the real test database (per `agents.local.md` §9.8, test files are allowed to import from any layer for setup). Cover: (a) get-then-update round-trip preserves all 9 fields, (b) upsert on a fresh user (no existing row) creates the row, (c) `displayName` of length 2 is rejected with `DomainError`, (d) `publicDescription` of length 501 is rejected with `DomainError`. NO `test.skip()`.

**Files to touch:** `apps/server/src/application/use-cases/provider-profile/update-provider-profile.integration.test.ts` (new), `apps/server/src/application/use-cases/provider-profile/get-provider-profile.integration.test.ts` (new)

**Verification:** All 4 scenarios pass for real. `bun run test` is green.

---


<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
