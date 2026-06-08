# PRD: Technical Debt & Architectural Improvements — Round 2

This PRD covers the second wave of architectural refinements, bug fixes, and infrastructure hardening for the Neighborhood Showcase platform. All decisions were resolved through a 26-question grilling session documented in [Grilling History (Session 4: Improvements & Fixes)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/grilling_history.md#session-4-improvements--fixes).

---

## Problem Statement

After completing the initial 25 feature issues, the platform has accumulated five categories of technical debt that degrade analytics accuracy, developer experience, and architectural integrity:

1. **Inaccurate Analytics**: Clicking an Announcement in the public showcase registers two IMPRESSION events instead of one — inflating Provider dashboard metrics and eroding trust in the platform's analytics.
2. **Scattered Feature Flagging**: The Unleash integration code is spread across three locations with no type safety, no shared flag name registry, and zero actual flags consumed anywhere in business logic.
3. **Fragmented Infrastructure**: The sole `docker-compose.yml` lives inside `packages/db/` but now needs to host non-database services (Unleash, Redis), making its current location conceptually misaligned.
4. **Weak Schema Typing**: All 11 enum columns across 6 tables use Drizzle's `text({ enum: [...] })` instead of native PostgreSQL `pgEnum`, losing database-level constraint enforcement.
5. **Leaky Domain Encapsulation**: Five standalone exported validation functions exist outside their entity classes, and a barrel re-export file (`cpf.entity.ts`) pollutes the `entities/` directory.

---

## Solution

Five targeted modules addressing each category of debt:

- **For Providers**: Analytics dashboards show accurate, non-inflated impression counts that match industry-standard counting semantics (one impression per view, not per code path).
- **For Developers**: Feature flags follow a typed, centralized pattern with a single import path. `docker compose up` from the project root starts everything. Schema enums are enforced at the database level.
- **For Architecture**: Domain entities fully encapsulate their validation logic as `private static` methods, and the `entities/` directory contains only actual domain entities.

---

## User Stories

1. As a Provider, I want each Visitor view of my Announcement to count as exactly one impression, so that my dashboard metrics accurately reflect real engagement.
2. As a Provider, I want re-visits to my Announcement (navigating away and coming back) to count as separate impressions, so that my metrics match industry-standard analytics behavior (Google Analytics, Meta Pixel).
3. As a developer, I want a single `packages/feature-flags` import path for all feature flag operations, so that I don't need to search across three codebases to find flag logic.
4. As a developer, I want typed flag name constants (`FLAGS.MY_FLAG`) with compile-time enforcement, so that typos in flag names are caught at build time, not at runtime.
5. As a developer, I want `isFeatureEnabled()` and `useFlag()` to accept only registered `FlagName` types, so that invalid flag references are impossible.
6. As a developer, I want to run `docker compose up` from the project root to start all infrastructure (Postgres, MinIO, Unleash, Redis), so that I don't need to know which subdirectory holds the compose file.
7. As a developer, I want Unleash server running locally via Docker, so that I can develop and test feature flags without provisioning external infrastructure.
8. As a developer, I want all enum columns to use native PostgreSQL `pgEnum` types, so that the database rejects invalid values at the constraint level rather than relying on application-level validation.
9. As a developer, I want each table to have its own independent `pgEnum` definition, so that adding a new status value to one bounded context doesn't affect another.
10. As a developer, I want entity validation functions to be `private static` methods on their respective classes, so that validation logic is encapsulated within the domain and not importable by external modules.
11. As a developer, I want the `entities/` directory to contain only actual domain entity classes, so that barrel re-exports and utility functions don't pollute the domain layer.
12. As a developer, I want `{ hashCPF, isValidCPF }` imported directly from `@neighborhood-showcase/auth/utils/cpf`, so that there is no unnecessary indirection through a fake entity file.

---

## Implementation Decisions

### Module 1: Analytics Impression Tracker

- **Root cause**: IMPRESSION events fire from two code paths — `openAdDetails()` in the showcase grid (click handler) and a `useEffect` in the standalone Announcement detail route (data load).
- **Fix**: Remove the `trackEvent` call from `openAdDetails()`. The `useEffect` in the detail route is the **single source of truth** for impressions — it covers both the modal overlay path (when opened from the grid) and direct URL navigation (shared links, bookmarks, search engine hits).
- **StrictMode guard**: Add a `useRef(false)` inside the `useEffect`. On first fire, set it to `true` and track the impression. On the StrictMode re-fire, the ref blocks the duplicate call.
- **Re-visit semantics**: No session-level or module-level deduplication. A Visitor navigating away and back to the same Announcement registers a new impression. This matches industry-standard analytics behavior.

### Module 2: `packages/feature-flags` Shared Package

- **New workspace package**: `packages/feature-flags` with its own `package.json`, `tsconfig.json`, and entry points for server (`/server`) and client (`/client`).
- **Server entrypoint**: Relocate `initUnleash()` and `isFeatureEnabled()` from `apps/server/src/shared/feature-flags.ts`.
- **Client entrypoint**: Export a config factory for the `FlagProvider` component, replacing the inline config in `__root.tsx`.
- **Typed flag registry**: Export `FLAGS` as an empty `as const` object and `FlagName` as its value type. `isFeatureEnabled()` and client-side hooks accept only `FlagName`. When the first real flag is introduced, it must be added to `FLAGS` — the type system enforces this.
- **Env schemas**: Unleash env variables remain in `packages/env` (server and web schemas). The feature-flags package imports from `@neighborhood-showcase/env`.

### Module 3: Root Docker Compose Infrastructure

- **Relocate**: Move `packages/db/docker-compose.yml` to the project root.
- **Script updates**: Update `packages/db/package.json` scripts (`db:start`, `db:stop`, `db:down`) to reference `../../docker-compose.yml`.
- **New services**: Add to the root compose:
  - `unleash-server` (official `unleashorg/unleash-server` image) using the existing Postgres instance with a separate database (`unleash`).
  - `redis` for Unleash caching.
- **Init script**: Add an init script or Postgres entrypoint that creates the `unleash` database alongside `neighborhood_showcase`.
- **Env template**: Update `.env.template` defaults to point at the local Unleash container (`http://localhost:4242`).

### Module 4: Native PG Enum Schema Migration

- **Scope**: All 11 text-enum columns migrated in a single batch.
- **Strategy**: Destructive schema regeneration (project is pre-v1, no production data). Delete `packages/db/src/migrations/`, define `pgEnum` definitions, run `db:generate` fresh.
- **11 independent enums** (one per table column, no sharing):
  - `userRoleEnum`: `PROVIDER`, `SYSTEM_MANAGER`
  - `userStatusEnum`: `ACTIVE`, `BANNED`
  - `condominiumStatusEnum`: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
  - `providerLocationTypeEnum`: `RESIDENT`, `MODERATOR`, `EXTERNAL`
  - `providerLocationStatusEnum`: `PENDING`, `APPROVED`, `REJECTED`
  - `assignmentTypeEnum`: `RESIDENT`, `MODERATOR`
  - `assignmentStatusEnum`: `PENDING`, `APPROVED`, `REJECTED`
  - `announcementStatusEnum`: `DRAFT`, `PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `SUSPENDED`
  - `paymentStatusEnum`: `PENDING`, `PAID`, `EXPIRED`, `REFUNDED`
  - `analyticsEventTypeEnum`: `IMPRESSION`, `CONTACT_CLICK`
  - `analyticsTargetTypeEnum`: `WHATSAPP`, `INSTAGRAM`, `WEBSITE`
- **Column updates**: Replace `text({ enum: [...] })` with the corresponding `pgEnum(...)` reference in each schema column definition.

### Module 5: Entity Validation Encapsulation

- **5 functions → `private static` methods**:
  - `validateAnnouncement(input)` → `Announcement` class
  - `validateUnitInfo(unitInfo)` → `Assignment` class
  - `validateCondominiumName(name)` → `Condominium` class
  - `validateCEP(cep)` → `Condominium` class
  - `validateContactInfo(info)` → `Condominium` class
- **Remove exports**: These functions are currently exported but never imported externally. Remove the `export` keyword and relocate inside the class body.
- **Delete `cpf.entity.ts`**: This 2-line barrel re-export is not a domain entity. All consumers should import `{ hashCPF, isValidCPF }` directly from `@neighborhood-showcase/auth/utils/cpf`.

---

## Testing Decisions

### What makes a good test

Tests should verify **external behavior and contracts**, not implementation details. A test should break only when the module's observable behavior changes, not when internal refactoring occurs.

### Module 1: Analytics Impression Tracker

- **Unit test**: Verify that the `useEffect` fires exactly once per component mount (simulating StrictMode double-render with `renderHook`). Assert the `trackEvent` mutation is called once, not twice.
- **Regression test**: Verify that `openAdDetails()` no longer calls `trackEvent` with `IMPRESSION`.
- **Prior art**: Similar mutation-testing patterns exist in the payment tracking tests.

### Module 2: `packages/feature-flags` Shared Package

- **Unit test**: Migrate and extend the existing `feature-flags.test.ts` tests to the new package location.
- **Test env fallback**: Verify `isFeatureEnabled()` reads `FLAG_*` env vars in test mode.
- **Test type safety**: Compile-time test (TypeScript `// @ts-expect-error`) that passing an unregistered string to `isFeatureEnabled()` fails type-checking.

### Module 3: Root Docker Compose Infrastructure

- **Smoke test**: `docker compose config` validates the compose file parses correctly.
- **Integration test**: `docker compose up -d` starts all services; health checks pass for Postgres, MinIO, Unleash, and Redis.
- **Script test**: `bun run db:start` and `bun run db:stop` work from the `packages/db` directory with the updated paths.

### Module 4: Native PG Enum Schema Migration

- **Regression gate**: The existing 134 integration tests serve as the primary regression test. All tests must pass after the schema migration with zero test modifications.
- **Schema validation**: `bun run db:push` completes without errors against both dev and test databases.
- **Enum constraint test**: New integration test that attempts to insert an invalid enum value and asserts a database constraint violation error.

### Module 5: Entity Validation Encapsulation

- **Regression gate**: Existing entity constructor tests verify validation still fires correctly after the refactor.
- **Encapsulation test**: Verify that the standalone functions are no longer importable (compile-time check via `// @ts-expect-error`).
- **CPF import test**: Verify consumers can import `{ hashCPF, isValidCPF }` directly from `@neighborhood-showcase/auth/utils/cpf`.

---

## Out of Scope

- **New feature flags**: This PRD establishes the infrastructure and typed registry for feature flags, but does not introduce any actual flags. The `FLAGS` map starts empty.
- **Production migration scripts**: Since the project is pre-v1, all schema changes use destructive regeneration. No incremental SQL migration scripts are produced.
- **Frontend i18n for new strings**: Any new UI strings introduced by these changes follow the existing i18n patterns but do not trigger a full localization pass.
- **Unleash UI configuration**: The Unleash server container is provisioned but not pre-configured with flags, projects, or API tokens beyond defaults.
- **Additional domain entity refactoring**: Only the 5 identified standalone validation functions and the CPF barrel re-export are in scope. No other entity structural changes.

---

## Further Notes

- **Dependency order**: Module 3 (Docker Compose) should be implemented before Module 2 (feature-flags package) so that the Unleash container is available for integration testing. Module 4 (pgEnum) should be implemented before Module 5 (entity encapsulation) to avoid two consecutive destructive migration resets.
- **Recommended implementation order**: Module 1 → Module 3 → Module 4 → Module 2 → Module 5.
- **ADR reference**: Payment error handling decisions are documented in `docs/adr/0003-abacatepay-payment-error-handling.md`. No new ADR is needed for this round — the decisions are recorded in [Grilling History (Session 4: Improvements & Fixes)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/grilling_history.md#session-4-improvements--fixes) (Q17–Q26).
- **Grilling session reference**: All 26 resolved decisions are documented in [Grilling History (Session 4: Improvements & Fixes)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/grilling_history.md#session-4-improvements--fixes).
