# Local Agent Context

## Project Architecture
Monorepo using Turborepo and Bun.
- `apps/server`: Fastify API server running tRPC and Better Auth handlers.
- `apps/web`: React client with TanStack Router/Query, consuming the tRPC client.
- `packages/api`: Thin helper / type definition package for shared contract.
- `packages/db`: Drizzle schemas and client config.
- `packages/ui`: Shared design UI components.

## Tech Stack
- Runtime: Bun
- Package Manager: Bun Workspaces
- Framework: Fastify (Backend), React (Frontend)
- Styling: Tailwind CSS (standard unstyled shadcn/ui)
- Database: Postgres with Drizzle ORM

## File Structure & Folder Rules

### Backend (`apps/server/src`)
- `domain/entities/`: DDD Domain Entity class definitions.
- `domain/repositories/`: Repository interfaces defining domain persistence contracts.
- `application/use-cases/`: Application use case classes orchestrating domain entities.
- `infrastructure/db/`: Concrete database repositories implementing domain contracts using Drizzle.
- `infrastructure/db/mappers/`: Drizzle schemas-to-entities mappers.
- `presentation/routers/`: tRPC router endpoints.
- `shared/`: Shared core utilities like `base-entity.ts` and `domain-error.ts`.

### Frontend (`apps/web/src`)
- `routes/`: File-based routes using TanStack Router.
- `components/`: UI components composed from base shadcn/ui.
- `utils/`: API helpers and tRPC client setup.

## Specific Guidelines & Enforcements

### 1. DDD Domain Entities & Base Entity
- **Base Entity**: All entities must inherit from abstract class `Entity<TProps>` (managing identity and equality comparison) or `AuditableEntity<TProps>` (adding `createdAt`/`updatedAt` timestamps).
- **Encapsulation**: Enforce read-only getters for properties. Modify state only through explicit domain methods.
- **Invariants Validation**: Do not validate data outside the domain. Constructor validation must verify all properties and throw custom subclasses of `DomainError` on failure.
- **Decoupling**: Domain entities must never throw framework/network-specific exceptions like `TRPCError`.

### 2. Multi-Layer Mapping Protocol
- **Presentation Layer (tRPC)**: 
  - Parsed Zod payloads must be mapped directly into Domain Entity instances before passing them to application use cases.
  - Outgoing entities returned by use cases must be mapped to plain JSON DTO objects for network transport.
- **Infrastructure Layer (Drizzle)**:
  - Repositories must consume concrete mappers (implementing the shared `EntityMapper` interface) to translate database rows into domain entities, preventing database schemas from leaking into use cases or the domain layer.

### 3. Global Error Handling & Payment guards
- **Domain Decoupling**: Use Fastify/tRPC formatting middleware to capture domain-specific `DomainError` exceptions and format them into bad-request `TRPCError` payloads, separating domain rules from network protocols.
- **Payment Guards & Identifiers**: When payment is initiated (e.g. `GeneratePaymentIntent`), backend must guard against processing payments for non-draft/non-expired states:
  - If status is `ACTIVE`, throw tRPC error with code `ANNOUNCEMENT_ALREADY_ACTIVE`.
  - If status is `SUSPENDED`, throw tRPC error with code `ANNOUNCEMENT_SUSPENDED`.
  - If status is `EXPIRED`, throw tRPC error with code `ANNOUNCEMENT_EXPIRED`.
- **Payment Failure UI**: When a payment call fails:
  - For `ANNOUNCEMENT_ALREADY_ACTIVE`, show a standard error toast and keep user on the page.
  - For `ANNOUNCEMENT_SUSPENDED`, show a distinct toast indicating suspension and explicitly suggest contacting support.

### 4. Code Quality & Theme-Adaptive Styling
- **Named exports** only.
- **File Length**: Limit files to ≤ 300 lines.
- **No loose parameters**: Always use Parameter Objects/interfaces for use cases and repositories.
- **No inline object types**: Inline object type definitions (e.g., `x: { foo: string }` or `property: { bar: number }`) are strictly forbidden anywhere in the codebase. All object types must be defined as named, exported interfaces or types (e.g., `interface Foo { foo: string }`, then `x: Foo`). This ensures global type reusability, consistency, and readability.
- **Simple Styling**: Do not add custom backgrounds, radial gradients, animations, or styling overrides. Stick strictly to standard shadcn variables and layout rules.
- **Theme Adaptation**: Keep the `ThemeProvider`. Avoid hardcoding dark or light classes. Support system-wide themes dynamically by relying entirely on Tailwind semantic utilities (`bg-background`, `text-foreground`, `border`, etc.).
- **No centered content — full-width layout by default**: Page content fills the entire available width of its parent container. Do NOT use `mx-auto max-w-*` (e.g. `max-w-4xl`, `max-w-5xl`, `max-w-7xl`) on the top-level page wrapper. Do NOT center page content horizontally. Use `w-full` plus reasonable internal padding (`px-4`, `px-6`) so cards/grids/tables spread to the full width of the panel main area. The only acceptable exceptions are: (a) auth flows (sign-in / sign-up), (b) legal/printable document layouts, (c) modals/dialogs that have a fixed max-width by design, (d) public landing-page marketing sections that are intentionally constrained. This rule applies project-wide (panel, public portal, future pages).
- **Zero Type / Lint Issues**: Run `bun run check` and `bun run check-types` after every implementation. All warnings and errors are blocking.
- **No Biome configuration changes**: Agents (including Ralph Loop) are strictly forbidden from modifying the `biome.json` file. Any changes to Biome lint rules, formatting configurations, or overrides must be requested explicitly and manually configured, never edited autonomously.

### 5. Internationalization (i18n) Strategy
- **Translation Files**: Support both English (`en`) and Portuguese (`pt`).
- **No Hardcoded Strings**: All user-facing text, notifications, error messages, and descriptions must go into locale translation JSON files. Hardcoding UI strings directly in component files is strictly prohibited.
- **English in all code**: Per `RULES.md` §6, all code artifacts (file names, variable names, function names, route paths, i18n key paths) must be written in English. Only the translated *values* (the strings after the colon in translation JSON) are in the respective language. The legacy PT route paths (`/panel/dashboard/anuncios/...`) are a known deferred item — see `backlog.md` "Mixed-language route naming fix" — and are being migrated to EN as routes are touched. New routes MUST be EN.
- **Act on PT-named items in touched scope; stack leftovers**: When an implementation task touches a file / route / variable that is named in Portuguese, the task MUST translate that item to English as part of the same change (a route rename is a search-and-replace; a variable rename is a TypeScript refactor; a file rename updates the import graph). If the task encounters OTHER PT-named items in the same touched area that are NOT in its scope, the task MUST log them as a new `deferred` row in `.specify/memory/backlog.md` (table format: `| deferred | Routing | Stacked <date> — <item> rename (PT → EN) | <description> | Future sweep epic | — |`) under the "Mixed-language route naming fix" policy row. Logged leftovers are picked up in a future sweep epic. This rule prevents PT names from spreading while keeping individual tasks focused.

### 6. Role-Based Navigation & Route Guards
- **Link Visibility**: Show the "Moderação" link in the navigation menu only to authenticated users who have an approved assignment of type `MODERATOR`.
- **Route Redirection rules**:
  - Direct URL access to protected routes (`/dashboard/*`, `/moderation`, `/admin`) by **unauthenticated** users must redirect to the home page `/` (Início).
  - Direct URL access to routes above permissions (e.g. a standard provider accessing `/admin` or `/moderation`) by **authenticated** users must redirect to `/dashboard` (Painel) and display a generic "Page Not Found" layout, treating the page as non-existent.

### 7. Feature Flagging (Unleash)
- Use Unleash for all environment-based feature flagging. Dynamic toggling of experimental modules must go through Unleash checks on client and server.

### 8. Early-Stage Database Migration Rules
- Because the repository is at its beginning and before v1 release, do not accumulate migrations when dropping or replacing tables (such as legacy `todo`). Wipe the `packages/db/src/migrations/` directory, drop the table schema definitions, and generate a new base schema migration from scratch.
- **Migration Snapshots Required**: Every schema migration generated via `bun run db:generate` MUST include its matching snapshot JSON file (e.g. `<index>_snapshot.json`) under `packages/db/src/migrations/meta/`. Omission of migration snapshot files is strictly prohibited.
- **Password Hashing Consistency**: Always use `hashPassword` imported from `"better-auth/crypto"` for hashing user passwords in seeds, scripts, tests, and production code. Custom hashing algorithms (such as plain SHA-256 or custom salts) are strictly forbidden.

### 9. Clean Architecture — Layer Boundary Enforcement (CRITICAL)

> **This section is NON-NEGOTIABLE.** Every line of code written, reviewed, or refactored MUST respect these boundaries. Violations are blocking — they must be fixed before any task is considered complete.

#### 9.1 — Dependency Direction Rule (The Golden Rule)

Dependencies ALWAYS point inward. Inner layers NEVER know about outer layers.

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain** is the innermost layer. It depends on NOTHING external. It holds ALL interface contracts (repository interfaces, service interfaces, adapter interfaces) that other layers implement or consume.
- **Application** depends on Domain only (consumes repository/service interfaces and entities).
- **Infrastructure** depends on Domain ONLY (implements its interfaces). It NEVER depends on Application.
- **Presentation** depends on Application (calls use cases) and Domain (maps entities to DTOs).
- **Infrastructure and Presentation NEVER depend on each other.**
- **Infrastructure and Application NEVER depend on each other.** They both depend on Domain.

#### 9.2 — Domain Layer (`domain/`)

**Purpose**: Core business entities, value objects, ALL interface contracts (repository interfaces, service interfaces, adapter interfaces), domain errors. Domain is the single source of truth for every contract that needs an implementation in another layer.

**Allowed imports**: Only from itself (`domain/`) and `shared/`.

**FORBIDDEN imports** (absolute ban):
- `drizzle-orm` or any ORM/database library
- `@neighborhood-showcase/db` or any database package
- `@trpc/server` or any HTTP/RPC framework
- `fastify`, `express`, or any transport framework
- Any external SDK or third-party service client
- Anything from `infrastructure/` or `presentation/`

**Error handling**: Domain throws ONLY `DomainError` subclasses. Never framework-specific errors.

#### 9.3 — Application Layer (`application/use-cases/`)

**Purpose**: Orchestration. Use cases coordinate domain entities and repository interfaces to fulfill business operations. They contain NO data access logic and NO transport logic.

**Allowed imports**:
- Domain entities (`domain/entities/`)
- Domain repository interfaces (`domain/repositories/`)
- Domain errors (`shared/domain-error.ts` or `domain/errors/`)
- Shared utilities (`shared/`)

**FORBIDDEN imports** (absolute ban):
- `drizzle-orm`, `drizzle-orm/pg-core`, or any ORM operator (`eq`, `and`, `sql`, `desc`, `ilike`, `inArray`, `isNull`, `alias`, etc.)
- `@neighborhood-showcase/db` (the `db` client instance)
- `@neighborhood-showcase/db/schema/*` (any schema table definition)
- `@trpc/server` (`TRPCError` or any tRPC type)
- `fastify` or any HTTP framework type
- Any direct file from `infrastructure/` or `presentation/`
- Any third-party SDK client (payment gateways, storage, email, etc.)

**Error handling**: Use cases throw ONLY `DomainError` subclasses. The Presentation Layer is responsible for translating `DomainError` into `TRPCError`.

**Data access**: Use cases call repository interface methods (e.g., `this.announcementRepo.findById(id)`). They NEVER construct SQL queries, use ORM operators, or touch the database client directly.

#### 9.4 — Infrastructure Layer (`infrastructure/`)

**Purpose**: Concrete implementations of domain contracts. All external I/O lives here: database repositories, third-party API clients, file storage adapters, email services.

**Allowed imports**:
- Domain interfaces (to implement them — repository interfaces, service interfaces, adapter interfaces)
- Domain entities (to return them)
- Domain mappers (`infrastructure/db/mappers/`)
- `drizzle-orm`, `@neighborhood-showcase/db` (database access belongs HERE)
- Third-party SDKs (payment, storage, email — all belong HERE)
- Shared utilities

**FORBIDDEN imports**:
- Anything from `application/` (use cases, application services, etc.)
- Anything from `presentation/` (routers, tRPC context, etc.)
- `@trpc/server` or any transport framework

**Repositories**: Every repository class MUST implement a domain repository interface. Raw database schemas and ORM operators are ONLY used inside repository methods, never exposed to callers.

#### 9.5 — Presentation Layer (`presentation/`)

**Purpose**: Transport boundary. tRPC routers, HTTP handlers, request validation, response mapping, error translation.

**Allowed imports**:
- Application use cases (to invoke them)
- Domain entities (to map them to response DTOs)
- Domain errors (to catch and translate them)
- `@trpc/server` (tRPC types, `TRPCError` — belongs HERE)
- Zod schemas for input validation
- Shared utilities

**FORBIDDEN imports**:
- `drizzle-orm` or any ORM library
- `@neighborhood-showcase/db` or any database package
- Anything from `infrastructure/` directly (no repository implementations, no DB clients)

**Error translation**: The Presentation Layer catches `DomainError` instances thrown by use cases and maps them to `TRPCError` with appropriate HTTP codes. This is the ONLY place where `TRPCError` is constructed.

#### 9.6 — Forbidden Import Matrix (Quick Reference)

| Import source | Domain | Application | Infrastructure | Presentation |
|:---|:---:|:---:|:---:|:---:|
| `drizzle-orm` / ORM operators | ❌ | ❌ | ✅ | ❌ |
| `@neighborhood-showcase/db` | ❌ | ❌ | ✅ | ❌ |
| `@trpc/server` / `TRPCError` | ❌ | ❌ | ❌ | ✅ |
| `fastify` / transport types | ❌ | ❌ | ❌ | ✅ |
| Domain entities & interfaces | ✅ | ✅ | ✅ | ✅ |
| Application use cases | ❌ | ✅ | ❌ | ✅ |
| Application services | ❌ | ✅ | ❌ | ❌ |
| Infrastructure implementations | ❌ | ❌ | ✅ | ❌ |
| Presentation routers | ❌ | ❌ | ❌ | ✅ |
| Third-party SDKs | ❌ | ❌ | ✅ | ❌ |

#### 9.7 — Dependency Injection

Use cases receive their repository dependencies through constructor injection (parameter objects). They NEVER instantiate concrete repositories directly. Wiring (composing use cases with their concrete infrastructure dependencies) happens at the composition root (e.g., the router or a DI container), NOT inside the use case.

#### 9.8 — Test Files Exception

Integration test files (`*.integration.test.ts`, `*.test.ts`) are allowed to import from any layer for test setup purposes (e.g., seeding the database directly). This exception applies ONLY to test files, NEVER to production code.

## PRD Directory — Lazy Load, Do Not Eager-Read

After the 2026-06-17 Ralph Loop cutover, the active workflow PRD surface is `.plan/PRD.md` plus `.plan/prds/`. The older `.specify/memory/prds/` lineage and the root `/PRD.md` index remain preserved historical/project-level references and can still be consulted on demand.

### The active rules

- **Ralph Loop reads `.plan/PRD.md` first.** It is the active thin PRD index for ongoing execution.
- **Ralph Loop opens only the row marked `CURRENT` in `.plan/PRD.md` on cold start.** That file under `.plan/prds/` is the current PRD at hand.
- **For history, research, or cross-PRD reference**, the agent opens older `.plan/prds/*.md` files on demand and, when necessary, cross-checks the preserved root `/PRD.md` lineage.
- **The agent does NOT inline PRD content into `.plan/PRD.md` or any other index file.** The versioned PRD file is the source of truth.
- **The root `/PRD.md` remains a preserved project-level index** for the pre-cutover `.specify/memory/prds/` lineage and inlined Modules 1–24. It is no longer the default workflow surface for Ralph Loop execution.

### How an agent finds the current PRD now

1. Open `.plan/PRD.md`.
2. Read the index table.
3. Find the row marked **CURRENT**.
4. Open that file under `.plan/prds/`.

### Disambiguation

- `.plan/PRD.md` = active Ralph Loop PRD index after the cutover.
- `.plan/prds/PRD-vN-<slug>.md` = active versioned PRD bodies for Ralph Loop.
- `/PRD.md` = preserved historical/project-level PRD lineage index.
- `.specify/memory/prds/PRD-vN-<slug>.md` = legacy source copies preserved for traceability; not the default hot path anymore.
- The historical inlined Modules 1–24 in `/PRD.md` remain preserved canonical records for the older PRD lineage.

## Current Plan Reference
- The active Ralph Loop PRD index is `.plan/PRD.md`.
- The current PRD is `.plan/prds/PRD-v7-provider-section-reorg.md`.
- The current grilling session is `.plan/grilling/2026-06-10-provider-section-reorg-grilling.md`.
- The current PRD handoff is `.plan/handoffs/2026-06-17-current-prd-handoff-provider-section-reorg.md`.
- The current grill handoff is `.plan/handoffs/2026-06-17-current-grill-handoff-provider-section-reorg.md`.
- The active executable epic is `.plan/epics/13-provider-section-reorg/epic.md`.
- The next dependency-safe task is `.plan/epics/13-provider-section-reorg/tasks/08-meus-anuncios-detail.md`.
- Legacy `.specify/memory/` planning artifacts remain preserved for archival retrieval during the backfill phase, not as the default workflow surface.
