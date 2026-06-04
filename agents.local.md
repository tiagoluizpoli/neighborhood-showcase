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
- **Simple Styling**: Do not add custom backgrounds, radial gradients, animations, or styling overrides. Stick strictly to standard shadcn variables and layout rules.
- **Theme Adaptation**: Keep the `ThemeProvider`. Avoid hardcoding dark or light classes. Support system-wide themes dynamically by relying entirely on Tailwind semantic utilities (`bg-background`, `text-foreground`, `border`, etc.).
- **Zero Type / Lint Issues**: Run `bun run check` and `bun run check-types` after every implementation. All warnings and errors are blocking.

### 5. Internationalization (i18n) Strategy
- **Translation Files**: Support both English (`en`) and Portuguese (`pt`).
- **No Hardcoded Strings**: All user-facing text, notifications, error messages, and descriptions must go into locale translation JSON files. Hardcoding UI strings directly in component files is strictly prohibited.

### 6. Role-Based Navigation & Route Guards
- **Link Visibility**: Show the "Moderação" link in the navigation menu only to authenticated users who have an approved assignment of type `MODERATOR`.
- **Route Redirection rules**:
  - Direct URL access to protected routes (`/dashboard/*`, `/moderation`, `/admin`) by **unauthenticated** users must redirect to the home page `/` (Início).
  - Direct URL access to routes above permissions (e.g. a standard provider accessing `/admin` or `/moderation`) by **authenticated** users must redirect to `/dashboard` (Painel) and display a generic "Page Not Found" layout, treating the page as non-existent.

### 7. Feature Flagging (Unleash)
- Use Unleash for all environment-based feature flagging. Dynamic toggling of experimental modules must go through Unleash checks on client and server.

### 8. Early-Stage Database Migration Rules
- Because the repository is at its beginning and before v1 release, do not accumulate migrations when dropping or replacing tables (such as legacy `todo`). Wipe the `packages/db/src/migrations/` directory, drop the table schema definitions, and generate a new base schema migration from scratch.

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

## Current Plan Reference
- [Root PRD](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/PRD.md)
- Issue specs live in `.specify/memory/issues/`; start with the active backend/public follow-ups in `55`, `56`, `63`, and `64`.
