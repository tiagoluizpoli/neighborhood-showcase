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

## Current Plan Reference
- [Improvements & Bug Fixes Plan](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/improvements_plan.md)


