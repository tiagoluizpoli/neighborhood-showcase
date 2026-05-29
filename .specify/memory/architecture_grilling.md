# Architecture Improvement Grilling Session

This log tracks all questions, answers, and structural decisions resolved during the architecture review phase. Focus: Clean Architecture, feature-sliced backend, Bulletproof React frontend, Karpathy simplicity.

## Resolved Decisions

### Question 1: Where does domain logic live?
*   **Context**: The plan originally listed tRPC procedures under `packages/api/src/routers/` implying domain logic lives in shared packages. The template confirms this pattern — `todoRouter` has Drizzle queries directly inside tRPC procedures.
*   **Decided**:
    *   **Packages are shared infrastructure** that serve apps — DB client config, auth setup, base entity classes, UI components, env validation. They do NOT hold domain logic, entities, use cases, or repository implementations.
    *   **Apps own their domain logic.** `apps/server/` internally follows Clean Architecture. Entities, use cases, repository interfaces, repository implementations (Drizzle adapters), and tRPC routers all live inside the app.
    *   Packages hand tools to apps (DB connection, auth session, base abstractions). Apps use those tools to implement business rules.
    *   If a second backend ever exists, it shares the packages but owns its own domain layer.

### Question 2: Internal structure of `apps/server/` — classic layers vs feature-sliced?
*   **Context**: Two options were presented:
    *   **Option A (Classic)**: Top-level `domain/`, `application/`, `infrastructure/`, `presentation/` directories.
    *   **Option B (Feature-sliced)**: Each feature folder (`condominium/`, `announcement/`, etc.) owns its entity, repository interface, Drizzle adapter, use cases, and tRPC router. Cross-cutting infra services live in a shared `infra/` folder.
*   **Decided**: **Option B — Feature-sliced with internal layering.**
    *   Rationale: Karpathy's "no abstractions for single-use code" — with one backend, we don't need the ceremony of 4 top-level directories. Locality wins: everything about "Condominium" is in one folder. The dependency rule (Clean Architecture) still holds via the import graph, not the folder tree.
    *   Aligns with Bulletproof React on the frontend — both sides use feature-sliced organization.
    *   **Proposed structure**:
        ```
        apps/server/src/
        ├── features/
        │   ├── condominium/
        │   │   ├── condominium.entity.ts
        │   │   ├── condominium.repository.ts     ← interface (port)
        │   │   ├── condominium.drizzle-repo.ts   ← adapter
        │   │   ├── condominium.use-cases.ts      ← all use cases
        │   │   └── condominium.router.ts         ← thin tRPC shell
        │   ├── announcement/
        │   ├── provider/
        │   └── assignment/
        ├── shared/
        │   ├── cpf-validator.ts
        │   ├── anonymizer.ts
        │   └── base-entity.ts
        ├── infra/
        │   ├── abacatepay.client.ts
        │   ├── telegram.client.ts
        │   ├── sharp.processor.ts
        │   └── storage.adapter.ts
        └── index.ts
        ```
    *   **ADR candidate**: This is hard to reverse, surprising without context ("why feature-sliced instead of classic layered for Clean Architecture?"), and the result of a real trade-off. ADR recommended.

### Question 3: The `role` field on Users — global role vs scoped relationship
*   **Context**: The plan had a single `role` enum on the `Users` table: `VISITOR`, `PROVIDER`, `MODERATOR`, `SYSTEM_MANAGER`. But CONTEXT.md defines Moderator as scoped to a specific Condominium. A flat `role: 'MODERATOR'` on Users can't answer "Moderator of *which* Condominium?"
*   **Decided**:
    *   **Users.role** becomes a two-value enum: `PROVIDER` | `SYSTEM_MANAGER`.
        *   `VISITOR` removed — visitors don't have accounts (CONTEXT.md: "unauthenticated person").
        *   `MODERATOR` removed — it's a scoped relationship, not a global identity.
    *   **Assignments.type** gains a new field: `RESIDENT` | `MODERATOR`.
        *   This models the scoped relationship: "Maria has an Assignment of type MODERATOR for Villa Bella."
        *   A Provider can be a `MODERATOR` of one Condominium and a `RESIDENT` of another simultaneously.
    *   Field named `type` (not `role`) on Assignments to avoid overloading the word "role" across two tables.
    *   Authorization check for moderation endpoints: `SELECT 1 FROM assignments WHERE provider_id = :callerId AND condominium_id = :targetId AND type = 'MODERATOR' AND status = 'APPROVED'`.

---

### Question 4: Should Announcements have a direct FK to Condominium or Assignment?
*   **Context**: The ERD has `Announcement.providerId → Users.id` but no link to a Condominium. The plan says Visitors can filter by Condominium and Moderators can suspend Announcements within their Condominium. Grill session Q6 says Providers select which Assignment to publish under.
*   **Options considered**:
    *   Add `assignmentId` FK to Announcements (derives both Provider and Condominium).
    *   Keep `providerId` only, trace to Condominium via joins (Provider → Assignments → Condominium).
*   **Decided**: **Keep `providerId` on Announcements. No direct FK to Condominium or Assignment.**
    *   The Announcement can be traced back to a Condominium through joins when needed: `Announcement.providerId → Assignments.providerId → Assignments.condominiumId`.
    *   This avoids coupling Announcements to a specific Assignment (which may change) and keeps the schema simpler.
    *   "Loose" neighborhood Providers without any Assignment can still publish — no orphan constraint violations.

### Question 5: The `packages/api` package — does it still exist?
*   **Context**: The template has `packages/api/` holding tRPC router definitions, `initTRPC`, context creation, and the `AppRouter` type export. With feature-sliced architecture inside `apps/server/`, there's a question of what stays in the package.
*   **Decided**: **Absorb `packages/api/` entirely into `apps/server/`.**
    *   `initTRPC`, base procedures (`publicProcedure`, `protectedProcedure`), `createContext`, and the `appRouter` composition all live in `apps/server/src/`.
    *   The frontend (`apps/web`) imports the `AppRouter` type directly from `apps/server` via Turborepo's cross-app type resolution.
    *   `packages/api/` is deleted. No package-level tRPC code.
    *   Rationale: with one backend, a separate package for tRPC plumbing is a pass-through (fails the deletion test). If a second backend appears, extract then — not now.

### Question 6: Schema ownership — where do Drizzle table definitions live?
*   **Context**: `packages/db/src/schema/` currently holds auth tables and a todo table. Our domain tables (condominiums, announcements, etc.) are app-specific.
*   **Decided**: **Keep all table schemas in `packages/db/src/schema/`.**
	*   Auth schemas and custom domain schemas will remain in the shared database package. This ensures Drizzle migrations remain unified under one package and one set of migration files.
	*   **CRITICAL RULE**: The repository interfaces (ports) and actual Drizzle repository implementations/mappers must live inside the application itself (`apps/server/src/features/`), NOT in the package. The package only houses the low-level SQL tables/definitions.
	*   For example:
		*   `packages/db/src/schema/condominium.ts` defines the PG Table.
		*   `apps/server/src/features/condominium/condominium.repository.ts` defines the TypeScript interface/contract.
		*   `apps/server/src/features/condominium/condominium.drizzle-repo.ts` implements the interface using the Drizzle schema and client.

### Question 7: Dependency injection strategy for use cases
*   **Context**: How do use cases get their repository and infra dependencies? Constructor injection, function parameters, or a lightweight DI container?
*   **Decided**: **Option A — Class-based Constructor Injection.**
	*   Use cases are implemented as classes with constructor parameters for repositories/interfaces (ports).
	*   This is the standard Object-Oriented Clean Architecture approach, keeping domain/application code independent of the concrete implementations.
	*   Example:
		```typescript
		export class ApproveCondominium {
		  constructor(
			private condominiumRepo: CondominiumRepository,
			private telegramClient: TelegramClient
		  ) {}

		  async execute(input: ApproveInput): Promise<ApproveOutput> { ... }
		}
		```

### Question 8: Storage abstraction — interface/adapter or env-config switch?
*   **Context**: The plan mentioned local disk vs S3-compatible storage.
*   **Decided**: **S3-Compatible Storage only (MinIO). No local disk implementation.**
	*   We will only write a single S3-compatible storage helper/service (`apps/server/src/infra/storage.client.ts`).
	*   For local development, we will run a **MinIO container** via Docker/Docker-compose.
	*   For production/VPS deployment, we will connect to the VPS MinIO instance or any standard cloud S3-compatible bucket (like Cloudflare R2).
	*   Rationale: YAGNI. Writing a second file-system local storage adapter is redundant. Using MinIO locally guarantees that the dev environment uses the exact same APIs and configurations as production, changing only the endpoint, bucket name, and credentials via environment variables.

---

### Question 9: Frontend structure — Bulletproof React inside `apps/web/`
*   **Context**: How do we organize the frontend feature folders? Do they mirror the backend features? Where do shared components, hooks, and providers live?
*   **Decided**: **Feature-Sliced Architecture (Bulletproof React style) aligned with TanStack Router.**
	*   We will structure `apps/web/src/features/` with logical domains: `auth` (auth pages/better-auth APIs), `condominiums` (condo directory & submission), `announcements` (showcase & search), `dashboard` (provider management panel), and `moderation` (moderator tools).
	*   **Route Isolation**: `apps/web/src/routes/` acts as thin shells. Router files only handle URLs, query parameters, loaders, and import page components from `src/features/`.
	*   **Boundary Enforcement**: Feature folders are self-contained. Features cannot import internal modules from other features directly; they must only reference them via an explicit public api (e.g. `index.ts` baril export) of that feature.
	*   **Shared Infrastructure**: Root-level directories `src/components/` (pure layout primitives), `src/hooks/` (generic hooks), `src/lib/` (clients like tRPC/auth), and `src/providers/` (root layout wrappers) contain all cross-cutting concerns.

---

### Question 10: Testing seams and strategy
*   **Context**: What's testable through what interface? Unit tests for use cases (mocked repos), integration tests for routers (real DB), or both? What's the minimum test surface for the MVP?
*   **Decided**: **Targeted Hybrid Strategy (In-Memory Unit Tests + Real DB Integration).**
	*   **Unit Testing Use Cases**: We will test core business use cases using lightweight, in-memory implementations of our repository interfaces (e.g. `InMemoryCondominiumRepository` using simple arrays) rather than complex mock frameworks. This keeps tests ultra fast and focused on pure business logic.
	*   **Integration Testing DB & Webhooks**: Drizzle repository implementations (`*.drizzle-repo.ts`) and payment webhook route handlers will be tested against a real PostgreSQL test database (wiped/seeded between runs) to guarantee correct SQL query generation, constraints, and webhooks signature behaviors.
	*   **Minimal MVP Test Surface**:
		*   `cpf-validator.test.ts` (mathematical correctness & validation).
		*   `anonymizer.test.ts` (PII removal verification for LGPD compliance).
		*   `announcement.use-cases.test.ts` (announcement lifecycle state transitions: Draft -> Active -> Expired).
		*   `abacatepay-webhook.test.ts` (HMAC signature validation and state transition triggers).

---

### Question 11: The webhook handler — Fastify route or tRPC mutation?
*   **Context**: AbacatePay hits a raw HTTP endpoint with a signature. tRPC expects its own protocol. Does the webhook handler live as a raw Fastify route in `infra/`, or in the `announcement` feature folder?
*   **Decided**: **Coexistence (Standard Fastify HTTP Route for Webhooks; tRPC for client-server communication).**
	*   We will **keep tRPC** for all communication between `apps/web` and `apps/server`. This ensures type safety and autocompletion for frontend queries and mutations.
	*   The webhook endpoint cannot be a tRPC mutation because AbacatePay sends a standard HTTP POST request. We will implement it as a raw Fastify route (`POST /api/webhooks/abacatepay`).
	*   To maintain feature cohesion, the webhook handler will live in `apps/server/src/features/announcement/announcement.webhook.ts` and will be registered in Fastify alongside the tRPC middleware in `index.ts`.

---

### Question 12: Announcement state transitions — who owns the state machine?
*   **Context**: The lifecycle diagram shows 8+ transitions. Are these enforced in the entity (domain layer), in the use case, or just as DB status updates in the repository? How strict is the state machine?
*   **Decided**: **Domain Entity Encapsulated State Machine.**
	*   The `Announcement` entity class (`apps/server/src/features/announcement/announcement.entity.ts`) owns and guards the state transitions.
	*   Methods such as `checkout()`, `confirmPayment()`, `suspend()`, and `reinstate()` are defined directly on the entity. They validate that the requested transition is legal according to the lifecycle diagram and throw custom domain errors (e.g., `InvalidStateTransitionError`) when violated.
	*   Implicit business side-effects, such as automatically setting `paidAt = now` and `expiresAt = now + 30 days` when payment is confirmed, are handled inside the transition method to guarantee domain invariant consistency.
	*   The application use cases simply load the entity via the repository port, execute the domain transition method, and save the updated entity back to the database.

---

## Active Questions

*None - All architectural questions have been resolved!*

---

