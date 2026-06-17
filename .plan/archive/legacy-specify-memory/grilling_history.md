# Grilling Sessions History

This document consolidates all planning, architectural, UI/screen design, improvements, and code review grilling sessions in chronological order for the Neighborhood Showcase project.

---

## Session 1: Product & Domain (Initial Planning)

This log tracks all questions, answers, and design choices resolved during the planning phase.

### Resolved Decisions

#### Question 1: Domain Mapping of Users, Residents, and Providers
*   **Decided**: 
    *   Since visitors browse publicly and do not need to sign in, every registered user account in the system is a **Provider** (or Moderator/Admin).
    *   We don't need a separate "User" vs "Resident" model; the Provider is the base user account.
    *   A Provider can hold one or more **Assignments** to represent different relationships with condominiums or the neighborhood.

#### Question 2: Relationship between Announcements and Products/Services
*   **Decided**:
    *   Strict 1-to-1 relationship between an Announcement and its flyer banner content. The application does not manage a reusable "Product Catalog".
    *   A Provider creates an Announcement directly, indicating its type (Service, Product, or Donation) and optional value.
    *   For multi-product showcases, Providers utilize a PDF link (menu/catalog) or external link (Instagram/Facebook) inside a single general Announcement.

#### Question 3: Announcement Creation and Moderation Workflow
*   **Decided**:
    *   **Self-Service**: Providers register themselves and create their own Announcements.
    *   **Paywall**: Providers must pay a publication fee to set the Announcement to live.

#### Question 4: Payment Integration
*   **Decided**:
    *   **Automated Pix**: Dynamic Pix QR code integration using **AbacatePay**.
    *   Payments are verified via HMAC-SHA256 signature webhooks, which automatically set the Announcement to `Active` and configure `ExpiredAt` (30 days).

#### Question 5: Classification (Categories and Tags)
*   **Decided**:
    *   **Predefined Categories**: Clean navigation categories managed by the system.
    *   **Dynamic Tags**: Free-text keywords entered by the Provider on creation.
    *   **Source Filter**: Automatically populated or chosen based on the selected Assignment.

#### Question 6: Managing Multiple Roles / Non-duplication of Users
*   **Decided**:
    *   A Provider (user account) can hold multiple **Assignments** (e.g. living in Villa Bella as an internal neighbor, while managing a store outside).
    *   When creating an Announcement, the Provider selects which Assignment it belongs to, prompting them if they have multiple.

#### Question 7: Moderator Scope and Target Audience
*   **Decided**:
    *   **Post-Moderation Queue**: Paid Announcements go live immediately, but are added to a Moderator's review list. The Moderator can suspend/delete them if they violate rules.
    *   **Moderator Scope**: Moderators are tied to a specific Condominium. A Moderator can only approve/verify `INTERNAL_NEIGHBOR` Assignments for their own Condominium.
    *   **Neighborhood Providers**: Loose providers (e.g., houses on neighboring streets) register without being tied to a specific condominium.
    *   **Announcement Targeting**: When publishing, a Provider can choose the target audience/visibility:
        *   Only their own Condominium.
        *   Specific neighboring Condominiums.
        *   Public (the whole neighborhood).

### Deferred & Refined Decisions

#### Question 8: Visibility Filters and "Loose" Neighborhood Providers (Simplified for MVP)
*   **Decided**:
    *   **Deferred Complexity**: We will leave the complex `INTERNAL_NEIGHBOR`, `EXTERNAL_NEIGHBOR`, and `LOCAL_COMMERCE` target routing and filters for a future version to ensure a faster MVP launch.
    *   **Simple Self-Registration**: Providers register easily.
    *   **System Managers vs. Condo Moderators**: 
        *   System Managers (global admins) can manage, block, or expel any provider who violates the community code of conduct.
        *   Each Condominium has its own Moderator(s) who only verify the local internal neighbors claiming association with that specific condominium.
    *   **Moderation Focus**: The main moderation effort is localized: Condo Moderators verify who is allowed to be labeled as a verified resident for their specific condo.

#### Question 9: Condominium Creation and Discovery
*   **Decided**:
    *   **Controlled Registry**: To prevent duplicate or typo-ridden entries, only System Managers (global admins) can create a new Condominium.
    *   **Provider Discovery**: Providers search from the verified list of Condominiums when adding Assignments.
    *   **Missing Request**: Providers can submit a request to add a new Condominium, which System Managers review and approve/create.

#### Question 10: Modifying an Active Announcement
*   **Decided**:
    *   **Payment & Expiration**: Editing an Active Announcement does not require a new payment and does not extend the 30-day publication period. The original `ExpiredAt` remains unchanged.
    *   **Moderation Flow**: Edits go live immediately. However, modifying key fields (title, subtitle, description, value, image, contact links) automatically re-flags the Announcement in the Moderator review queue to prevent misuse.

#### Question 11: Announcement Expiration and Renewal Flow
*   **Decided**:
    *   **State Transition**: Expired Announcements are not deleted. They transition to the `Expired` state, hiding them from Visitors while remaining visible to the Provider on their dashboard.
    *   **Renewal**: The Provider can renew an Announcement via a new Pix payment.
    *   **Early Renewal Stacking**: If a renewal payment is completed before expiration, the 30 days stack: `New ExpiredAt = Current ExpiredAt + 30 days`. If it is already expired, the new expiration is `Payment Confirmation Time + 30 days`.

#### Question 12: Visitor Contact & Analytics Tracking
*   **Decided**:
    *   **Multiple Contact Methods**: An Announcement can support multiple contact methods. The Provider can configure any combination of:
        *   **WhatsApp**: Direct wa.me link.
        *   **External URL**: Instagram, website, or social page link.
        *   **PDF Download**: Link or file upload for menus, catalogs, or additional info.
    *   **Redirect Tracking**: Contact buttons point to redirect routes (e.g., `/api/announcements/:id/contact?type=whatsapp|external|pdf`) to register the click event before redirecting the Visitor.
    *   **Analytics Dashboard**: The Provider's dashboard displays:
        *   **Impressions**: Total views in listing/showcase pages.
        *   **Interaction Counters**: Breakdown of clicks for each contact type (WhatsApp, External URL, PDF), showing which method performs best.

#### Question 13: File & Media Storage (Images and PDF Catalogs)
*   **Decided**:
    *   **Unified Storage Abstraction**: The application will support two storage backends, switchable via environment variables:
        *   **Local Disk Storage**: Uploads saved directly to `public/uploads/` for zero-configuration local development.
        *   **S3-Compatible Storage**: Uploads saved to Cloudflare R2, AWS S3, or MinIO for stateless, serverless-friendly production environments.

#### Question 14: Authentication Method and Providers
*   **Decided**:
    *   **Better Auth Engine**: Use Better Auth to power registration and logins.
    *   **Auth Methods**:
        *   **Email & Password**: Primary method for local development and base security.
        *   **Social OAuth (Google/GitHub)**: Configurable optionally in production via environment variables.
    *   **Verification & Reset Emails**: Integrated via a mock/console mailer locally and Resend (or another SMTP client) in production.

#### Question 15: Primary Language & Localization
*   **Decided**:
    *   **Portuguese (pt-BR)**: The platform will be built entirely in Portuguese (pt-BR) to match the target audience (Brazilian condominiums) and integrations (Pix/AbacatePay).
    *   **No i18n Translation Overhead**: Copy will be written directly in pt-BR, avoiding translation library overhead for the MVP.

#### Question 16: Core Technology Stack
*   **Decided**:
    *   **Template Source**: We will use the `neighborhood-showcase` (Better-T-Stack) as our baseline.
    *   **Frontend**: React + TanStack Router (fully type-safe, file-based routing) + TailwindCSS v4 + next-themes + packages/ui (shadcn/ui primitives).
    *   **Backend & API**: Fastify + tRPC (`@trpc/server`, `@trpc/client`).
    *   **Database**: PostgreSQL + Drizzle ORM.
    *   **Auth**: Better-Auth.
    *   **Runtime & Tooling**: Bun, Turborepo, Biome, Lefthook.

#### Question 17: Local Webhook testing & AbacatePay integration flow
*   **Decided**:
    *   **Mock Dev Endpoint**: Expose a development-only endpoint/flag when `NODE_ENV === 'development'` to allow developers to simulate Pix payments locally using curl/Postman without signature checks.
    *   **Tunneling Guidelines**: Document in the README how to run tunneling tools like `localtunnel` or `ngrok` for testing the live AbacatePay webhook flow.

#### Question 18: Notification Mechanisms for Providers
*   **Decided**:
    *   **Transactional Emails (via Resend)**:
        *   **Expiration Warning**: Sent 3 days before expiration with a renew link.
        *   **Expiration Confirmation**: Sent when the Announcement expires.
        *   **Moderator Actions**: Sent when a Moderator suspends or deletes the Announcement, explaining the reason.
    *   **In-App Alerts**: Simple notification badge/inbox on the Provider's dashboard.
    *   **Deferred SMS/WhatsApp**: SMS and WhatsApp gateway notifications are deferred for the MVP to minimize costs.

#### Question 19: Image Optimization & Constraints
*   **Decided**:
    *   **Format & Size Limits**: Cap maximum initial upload size at **10MB** (providing convenience for raw mobile photos) and limit formats to standard images (WebP, PNG, JPG/JPEG).
    *   **Server-Side Optimization**: Process all uploads via `sharp` before saving: convert to WebP, resize to a max resolution of 1200x800px, and compress at quality level 80 to minimize final storage consumption.

#### Question 20: Moderator Alerting and Moderation Dashboard
*   **Decided**:
    *   **Moderator Dashboard**: Specialized workspace for Condo Moderators to review pending Assignments and flagged Announcements for their specific Condominium.
    *   **Alerting Channels**:
        *   **In-App Badges**: Real-time pending count badges on their header navigation.
        *   **Daily Digest Email**: A daily compiled mail of pending tasks to avoid instant email overload.
        *   **Telegram Bot Integration**: Free, optional integration where Condo Moderators and System Managers can link their Telegram account/Chat ID to receive instant Telegram notifications when a new moderation task arises.

#### Question 21: Condominium Selection & Request Flow
*   **Decided**:
    *   **Onboarding & Verification Details**: When requesting a new Condominium, we collect:
        *   **Condominium Name** and **Location Details** (City, State, CEP/ZIP).
        *   **Contact Info**: Website link, phone, or email.
    *   **Síndico (Condominium Manager) Link**: The registration flow is designed so the person requesting the creation is typically the **Síndico** (or an authorized administrative manager). They provide proof of representation or contact info.
    *   **Verification Workflow**: 
        *   A System Manager manually verifies the request (confirming the Condominium is real and the applicant is indeed the Síndico/authorized manager).
        *   Upon approval, the Condominium is activated (`Approved`), and the requesting user is automatically granted the **Moderator** role for that Condominium, serving as its primary administrator.

#### Question 22: Provider Verification Status & Public Badging
*   **Decided**:
    *   **Opt-in Trust Badge**: If a Provider has an approved `INTERNAL_NEIGHBOR` Assignment, they can choose whether to display the `"Morador Verificado de [Condomínio Name]"` trust badge on a per-Announcement basis.
    *   **Privacy Control**: Displaying the badge is optional to protect the Provider's privacy (e.g. they might not want to publicize where they live until contacting a buyer).

#### Question 23: Deletion Policy & LGPD Anonymization
*   **Decided**:
    *   **Right to be Forgotten (LGPD Compliance)**: When a Provider requests account deletion, we soft-delete the account row (`deletedAt`) and **immediately scrub/anonymize all Personally Identifiable Information (PII)**:
        *   Replace Name with `[Usuário Deletado]`.
        *   Clear or cryptographically hash the Email.
        *   Clear phone number, WhatsApp links, and delete uploaded files (profile image, PDF catalogs).
    *   **Data Retention**: We retain only the anonymized transaction records (Pix payment logs and amounts) for fiscal/accounting audits and global metrics, fully complying with Brazil's General Personal Data Protection Law (LGPD).

#### Question 24: Dynamic Pricing / Announcement Publication Fees
*   **Decided**:
    *   **Environment Configuration**: For the MVP, the publication fee (e.g., R$ 2,00) is defined as a global constant or environment variable (`PUBLICATION_FEE_CENTS=200`). This keeps database schemas and configuration UIs simple.
    *   **Future Migration**: If dynamic/geographical pricing is required later, it can be refactored into a dynamic system configuration table.

#### Question 25: Moderator Violation Enforcement & Banning
*   **Decided**:
    *   **CPF Identity Verification**: During registration, all Providers must supply their CPF (Cadastro de Pessoas Físicas), which is validated using the standard mathematical validation algorithm.
    *   **Unique CPF Enforcement**: Each CPF must be unique across the platform database.
    *   **Enforcement & Banning Behavior**:
        *   Condo Moderators can suspend specific violating Announcements.
        *   Only **System Managers** (global admins) can ban a Provider account.
        *   Banning updates the account status to `Banned`, immediately revokes all authentication sessions, hides all of their active Announcements, and prevents them from registering another account using the same email or CPF.
    *   **LGPD-Compliant Ban Evading Prevention**:
        *   If a Provider is banned, we store a cryptographic hash of their CPF (`sha256(cpf)`) in a `blacklisted_identifiers` table.
        *   If a normal user deletes their account (Question 23), their CPF is scrubbed completely from the system. But if a banned user requests deletion or is banned, the cryptographic hash of their CPF is retained to permanently block them from registering again, satisfying LGPD's fraud-prevention/compliance retention exemptions.

---

## Session 2: Architecture (Initial Planning)

This log tracks all questions, answers, and structural decisions resolved during the architecture review phase. Focus: Clean Architecture, feature-sliced backend, Bulletproof React frontend, Karpathy simplicity.

### Resolved Decisions

#### Question 1: Where does domain logic live?
*   **Context**: The plan originally listed tRPC procedures under `packages/api/src/routers/` implying domain logic lives in shared packages. The template confirms this pattern — `todoRouter` has Drizzle queries directly inside tRPC procedures.
*   **Decided**:
    *   **Packages are shared infrastructure** that serve apps — DB client config, auth setup, base entity classes, UI components, env validation. They do NOT hold domain logic, entities, use cases, or repository implementations.
    *   **Apps own their domain logic.** `apps/server/` internally follows Clean Architecture. Entities, use cases, repository interfaces, repository implementations (Drizzle adapters), and tRPC routers all live inside the app.
    *   Packages hand tools to apps (DB connection, auth session, base abstractions). Apps use those tools to implement business rules.
    *   If a second backend ever exists, it shares the packages but owns its own domain layer.

#### Question 2: Internal structure of `apps/server/` — classic layers vs feature-sliced?
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

#### Question 3: The `role` field on Users — global role vs scoped relationship
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

#### Question 4: Should Announcements have a direct FK to Condominium or Assignment?
*   **Context**: The ERD has `Announcement.providerId → Users.id` but no link to a Condominium. The plan says Visitors can filter by Condominium and Moderators can suspend Announcements within their Condominium. Grill session Q6 says Providers select which Assignment to publish under.
*   **Options considered**:
    *   Add `assignmentId` FK to Announcements (derives both Provider and Condominium).
    *   Keep `providerId` only, trace to Condominium via joins (Provider → Assignments → Condominium).
*   **Decided**: **Keep `providerId` on Announcements. No direct FK to Condominium or Assignment.**
    *   The Announcement can be traced back to a Condominium through joins when needed: `Announcement.providerId → Assignments.providerId → Assignments.condominiumId`.
    *   This avoids coupling Announcements to a specific Assignment (which may change) and keeps the schema simpler.
    *   "Loose" neighborhood Providers without any Assignment can still publish — no orphan constraint violations.

#### Question 5: The `packages/api` package — does it still exist?
*   **Context**: The template has `packages/api/` holding tRPC router definitions, `initTRPC`, context creation, and the `AppRouter` type export. With feature-sliced architecture inside `apps/server/`, there's a question of what stays in the package.
*   **Decided**: **Absorb `packages/api/` entirely into `apps/server/`.**
    *   `initTRPC`, base procedures (`publicProcedure`, `protectedProcedure`), `createContext`, and the `appRouter` composition all live in `apps/server/src/`.
    *   The frontend (`apps/web`) imports the `AppRouter` type directly from `apps/server` via Turborepo's cross-app type resolution.
    *   `packages/api/` is deleted. No package-level tRPC code.
    *   Rationale: with one backend, a separate package for tRPC plumbing is a pass-through (fails the deletion test). If a second backend appears, extract then — not now.

#### Question 6: Schema ownership — where do Drizzle table definitions live?
*   **Context**: `packages/db/src/schema/` currently holds auth tables and a todo table. Our domain tables (condominiums, announcements, etc.) are app-specific.
*   **Decided**: **Keep all table schemas in `packages/db/src/schema/`.**
	*   Auth schemas and custom domain schemas will remain in the shared database package. This ensures Drizzle migrations remain unified under one package and one set of migration files.
	*   **CRITICAL RULE**: The repository interfaces (ports) and actual Drizzle repository implementations/mappers must live inside the application itself (`apps/server/src/features/`), NOT in the package. The package only houses the low-level SQL tables/definitions.
	*   For example:
		*   `packages/db/src/schema/condominium.ts` defines the PG Table.
		*   `apps/server/src/features/condominium/condominium.repository.ts` defines the TypeScript interface/contract.
		*   `apps/server/src/features/condominium/condominium.drizzle-repo.ts` implements the interface using the Drizzle schema and client.

#### Question 7: Dependency injection strategy for use cases
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

#### Question 8: Storage abstraction — interface/adapter or env-config switch?
*   **Context**: The plan mentioned local disk vs S3-compatible storage.
*   **Decided**: **S3-Compatible Storage only (MinIO). No local disk implementation.**
	*   We will only write a single S3-compatible storage helper/service (`apps/server/src/infra/storage.client.ts`).
	*   For local development, we will run a **MinIO container** via Docker/Docker-compose.
	*   For production/VPS deployment, we will connect to the VPS MinIO instance or any standard cloud S3-compatible bucket (like Cloudflare R2).
	*   Rationale: YAGNI. Writing a second file-system local storage adapter is redundant. Using MinIO locally guarantees that the dev environment uses the exact same APIs and configurations as production, changing only the endpoint, bucket name, and credentials via environment variables.

#### Question 9: Frontend structure — Bulletproof React inside `apps/web/`
*   **Context**: How do we organize the frontend feature folders? Do they mirror the backend features? Where do shared components, hooks, and providers live?
*   **Decided**: **Feature-Sliced Architecture (Bulletproof React style) aligned with TanStack Router.**
	*   We will structure `apps/web/src/features/` with logical domains: `auth` (auth pages/better-auth APIs), `condominiums` (condo directory & submission), `announcements` (showcase & search), `dashboard` (provider management panel), and `moderation` (moderator tools).
	*   **Route Isolation**: `apps/web/src/routes/` acts as thin shells. Router files only handle URLs, query parameters, loaders, and import page components from `src/features/`.
	*   **Boundary Enforcement**: Feature folders are self-contained. Features cannot import internal modules from other features directly; they must only reference them via an explicit public api (e.g. `index.ts` baril export) of that feature.
	*   **Shared Infrastructure**: Root-level directories `src/components/` (pure layout primitives), `src/hooks/` (generic hooks), `src/lib/` (clients like tRPC/auth), and `src/providers/` (root layout wrappers) contain all cross-cutting concerns.

#### Question 10: Testing seams and strategy
*   **Context**: What's testable through what interface? Unit tests for use cases (mocked repos), integration tests for routers (real DB), or both? What's the minimum test surface for the MVP?
*   **Decided**: **Targeted Hybrid Strategy (In-Memory Unit Tests + Real DB Integration).**
	*   **Unit Testing Use Cases**: We will test core business use cases using lightweight, in-memory implementations of our repository interfaces (e.g. `InMemoryCondominiumRepository` using simple arrays) rather than complex mock frameworks. This keeps tests ultra fast and focused on pure business logic.
	*   **Integration Testing DB & Webhooks**: Drizzle repository implementations (`*.drizzle-repo.ts`) and payment webhook route handlers will be tested against a real PostgreSQL test database (wiped/seeded between runs) to guarantee correct SQL query generation, constraints, and webhooks signature behaviors.
	*   **Minimal MVP Test Surface**:
		*   `cpf-validator.test.ts` (mathematical correctness & validation).
		*   `anonymizer.test.ts` (PII removal verification for LGPD compliance).
		*   `announcement.use-cases.test.ts` (announcement lifecycle state transitions: Draft -> Active -> Expired).
		*   `abacatepay-webhook.test.ts` (HMAC signature validation and state transition triggers).

#### Question 11: The webhook handler — Fastify route or tRPC mutation?
*   **Context**: AbacatePay hits a raw HTTP endpoint with a signature. tRPC expects its own protocol. Does the webhook handler live as a raw Fastify route in `infra/`, or in the `announcement` feature folder?
*   **Decided**: **Coexistence (Standard Fastify HTTP Route for Webhooks; tRPC for client-server communication).**
	*   We will **keep tRPC** for all communication between `apps/web` and `apps/server`. This ensures type safety and autocompletion for frontend queries and mutations.
	*   The webhook endpoint cannot be a tRPC mutation because AbacatePay sends a standard HTTP POST request. We will implement it as a raw Fastify route (`POST /api/webhooks/abacatepay`).
	*   To maintain feature cohesion, the webhook handler will live in `apps/server/src/features/announcement/announcement.webhook.ts` and will be registered in Fastify alongside the tRPC middleware in `index.ts`.

#### Question 12: Announcement state transitions — who owns the state machine?
*   **Context**: The lifecycle diagram shows 8+ transitions. Are these enforced in the entity (domain layer), in the use case, or just as DB status updates in the repository? How strict is the state machine?
*   **Decided**: **Domain Entity Encapsulated State Machine.**
	*   The `Announcement` entity class (`apps/server/src/features/announcement/announcement.entity.ts`) owns and guards the state transitions.
	*   Methods such as `checkout()`, `confirmPayment()`, `suspend()`, and `reinstate()` are defined directly on the entity. They validate that the requested transition is legal according to the lifecycle diagram and throw custom domain errors (e.g., `InvalidStateTransitionError`) when violated.
	*   Implicit business side-effects, such as automatically setting `paidAt = now` and `expiresAt = now + 30 days` when payment is confirmed, are handled inside the transition method to guarantee domain invariant consistency.
	*   The application use cases simply load the entity via the repository port, execute the domain transition method, and save the updated entity back to the database.

---

## Session 3: Screen & UI Design (Initial Planning)

This log tracks all questions, answers, and screen-wise content mapping choices resolved during the screen-mapping planning phase.

### Resolved Decisions

#### Question 1: Public Showcase (`/`) — Entry Point and Discovery
*   **Context**: How do we handle screen behavior, initial state, and sorting for first-time visitors (especially on mobile)?
*   **Decided**: **Mobile-First & Geolocation-Sorted Entry.**
	*   **Responsive Priority**: The showcase and detail views are designed strictly **mobile-first**, as most visitors access the guide on mobile devices via links shared in condo groups.
	*   **Discovery Flow**:
		*   Upon first load, the browser requests geolocation permission.
		*   **Allowed**: The application calculates distance and lists announcements from the nearest condominiums and local providers first.
		*   **Denied / Unavailable**: A fallback prompt (modal/header banner) asks the user to choose their city/condominium manually. Their choice is stored in LocalStorage for subsequent visits.
	*   **Mobile Showcase Layout**:
		*   **Sticky Header**: Search bar, quick seletor for Condominium/City, and a collapsible Category ribbon (horizontal swipe).
		*   **Showcase Grid**: Single-column (mobile) or multi-column (tablet/desktop) feed of announcements. Each card shows: Cover Image, Title, Price (optional), Category tag, Provider name, and a "Verified Resident of [Condo]" badge (if opted-in by the resident).
		*   **Quick Filter**: A clear toggle switch for "Apenas Moradores Verificados" (Verified Residents Only) is pinned to the header filter menu.

#### Question 2: Announcement Detail View (`/announcements/:id` or modal)
*   **Context**: How do visitors view the full details of an announcement?
*   **Decided**: **Hybrid Contextual Presentation.**
	*   **Direct Link (Shared)**: If accessed via a shared link (e.g. from WhatsApp), the announcement renders as a dedicated full-page route, fully optimized for mobile browsers.
	*   **Vitrine Navigation**: If clicked from the Showcase (`/`):
		*   **Mobile**: Renders as a sliding **Bottom Sheet / Drawer** (giving a native app feel) which can be swiped down to close.
		*   **Desktop**: Renders as a centered **Modal Dialog** overlay.
		*   **URL Sync**: In both overlay modes, the URL updates to `/announcements/:id` without triggering a full page reload, enabling easy copying and sharing of the link.
	*   **Interactions & Tracking**: A floating action button/bar is sticky to the bottom of the screen. Any click to WhatsApp, External URL, or PDF redirects through `/api/announcements/:id/contact?type=...` to record the analytics click event first.

#### Question 3: Mandatory Image Upload & Aspect Ratio Enforcement
*   **Context**: How do we handle announcement images in terms of schema validation, creation form constraints, and performance?
*   **Decided**: **Mandatory Fixed Aspect Ratio Upload.**
	*   **Enforcement**: The cover image is **strictly mandatory** for all announcements (`imageUrl` is a NOT NULL column in the DB schema). Creating an announcement without an image is blocked.
	*   **Frontend Aspect Ratio**: The creation form enforces a **fixed 4:3 aspect ratio** via a client-side cropper widget (e.g., `react-image-crop`). Users can upload files up to 10MB (PNG, JPG, WebP) and crop them to 4:3 before uploading.
	*   **Server Processing & Constraints**: The server processes the uploaded file via `sharp`, resizing it to a fixed **800x600px WebP** at quality 80. This minimizes disk space usage and guarantees consistent layout alignment across the public showcase cards and detail views.

#### Question 4: Onboarding & Authentication (`/auth`)
*   **Context**: The sign-up/login screen experience for Providers.
*   **Decided**: **Standardized Dual Tabs & Enforced Setup Redirect.**
	*   **Layout**: Swappable tabs ("Entrar" and "Criar Conta") in a clean, centered card. Social login (Google) button is located below the tab forms.
	*   **Registration Inputs**: Full Legal Name (Nome Civil), Email, Password, Phone Number (WhatsApp format with auto-masking), and CPF (with auto-masking and instant client-side validation).
	*   **Security Separation (Public vs Legal Identity)**:
		*   **Public Exhibition**: Providers can set a public "Nome Fantasia" (Trading/Exhibition Name) for their announcements.
		*   **Legal Identity**: The user's Full Legal Name, CPF, and Phone are stored securely. These details are hidden from the public and are only queryable under strict backend role-based access control (RBAC) by approved Condo Moderators (for residents of their condo) and System Managers (global audit/abuse tracking).
	*   **Safety checks**: On submit, the system hashes the CPF. If it is blacklisted, it displays: *"Este CPF está impedido de realizar novos cadastros na plataforma."*
	*   **Setup Enforcement**: Newly registered providers who do not have any condo assignment are immediately redirected to the Condominium Setup screen (`/dashboard/condo-setup`) to link their account before accessing the main dashboard.

#### Question 5: Condominium Creation & Join Requests (`/dashboard/condo-setup`)
*   **Context**: The step where a provider links themselves to a condominium (either creating a new one as a manager or joining as a resident).
*   **Decided**: **Tabbed Split Flow (Resident search vs Síndico creation).**
	*   **Resident / Local Provider Flow**:
		*   **Condominium Search**: Auto-suggest input searching by Name, City, or CEP.
		*   **Residency Details (Secured)**: Unit identification (e.g. "Apto 302, Bloco C" - private to moderators) and an optional Comprovante de Residência upload (PDF/Image) to expedite moderation. These values are tied to the secured Resident Assignment profile.
		*   **Action**: "Solicitar Associação". Puts the page in a pending state: *"Aguardando aprovação do Moderador do Condomínio X"*.
	*   **Síndico / Admin Flow**:
		*   **Form fields**: Condominium Name, ZIP Code (CEP - with auto-address fill), City/State, official Administrative Contact Phone/Email.
		*   **Verification document**: A **mandatory upload** of the Ata de Eleição/Convenção (PDF/Image) to prove status as the condo representative.
		*   **Action**: "Cadastrar Condomínio". Puts the page in a pending validation state for global System Managers. Once approved, the condo is created, and the user is granted a `MODERATOR` assignment for it.
	*   **Blocker**: Users with pending requests are kept on this screen and cannot create announcements until at least one assignment is approved.

#### Question 6: Provider Dashboard (`/dashboard`)
*   **Context**: The primary management screen for logged-in providers.
*   **Decided**: **Consolidated Metrics & Tabbed Status Listing.**
	*   **Metrics (Consolidated)**: Displays total impressions (views), total interactions (clicks), and conversion rate (%) for active ads at the top.
	*   **Announcements Tabbed Views**:
		*   **Ativos**: Lists active ads. Shows thumbnail, statistics, remaining days, with quick actions to *Editar*, *Pausar* (archive to draft).
		*   **Aguardando Pagamento**: Lists drafts/checkouts. Features a prominent **"Pagar com Pix"** button.
		*   **Expirados**: Ads older than 30 days. Features a **"Renovar Anúncio"** button (triggers checkout billing flow).
		*   **Suspensos**: Ads suspended by moderators. Displays a warning banner with the **suspension reason** and actions to *Editar* (to correct and submit back to queue) or *Excluir*.
	*   **Profile & LGPD Deletion**: Exposes a "Minha Conta" sub-view allowing profile updates (Name, WhatsApp number) and a destructive styled "Excluir Conta" button which triggers a confirmation modal to permanently anonymize data.

#### Question 7: Announcement Creation/Edition Form (`/dashboard/announcements/new` or `/edit/:id`)
*   **Context**: The form where providers fill announcement details and upload images.
*   **Decided**: **Mandatory Cropped 4:3 Image Form.**
	*   **Inputs**:
		*   **Mandatory Cover Image**: Dashed dropzone opening a client-side crop tool locked at **4:3 aspect ratio**. The 4:3 cropped result is saved to state and shown as a card preview.
		*   **Category**: Dropdown list of system categories.
		*   **Title**: Max 50 chars, character counter.
		*   **Subtitle**: Max 100 chars, character counter.
		*   **Description**: Max 1000 chars, text area.
		*   **Price**: Optional numeric input with BRL currency mask (`R$ 0,00`).
		*   **Tags**: Key-value pill inputs (max 5 tags).
		*   **Contact links**: WhatsApp (pre-filled, editable), Instagram/Website link (optional), and Menu/Catalog PDF file upload (optional, max 5MB).
		*   **Verified Badge Toggle**: Switch displaying "Exibir Selo de Morador Verificado". Only active if the provider holds an approved resident assignment for the condo.
	*   **Auditing warning**: Displaying warning banner notifying that edits on active announcements immediately go live but trigger a re-audit in the moderation queue.

#### Question 8: Pix Payment Screen (`/dashboard/announcements/:id/payment`)
*   **Context**: The payment screen displaying the Pix billing details.
*   **Decided**: **Dual-State Dynamic QR & Polling UI.**
	*   **Awaiting Payment State**:
		*   **Summary**: Clear billing details showing description (*"Publicação do Anúncio"*), amount (*R$ 2,00*), and dynamic 10-minute expiration timer.
		*   **QR Code**: Center high-contrast Pix QR code block.
		*   **Copia e Cola**: Large primary action button copying the Pix raw text string, with a "Copiado!" tooltip feedback.
		*   **Status check**: Pulse animation indicating *"Aguardando confirmação do banco..."* which polls the backend database every 5 seconds.
	*   **Payment Confirmed State**:
		*   Once verified, instantly triggers client-side confetti micro-animation and shows a green checkmark.
		*   Displays buttons to *"Ver meu Anúncio"* (public detail view) or *"Ir para o Dashboard"*.

#### Question 9: Condo Moderation Panel (`/moderation`)
*   **Context**: The dashboard for users assigned as local condominium moderators.
*   **Decided**: **Gated Auditing Panel & Local Suspension Controls.**
	*   **Security & Data Privacy**:
		*   Access to sensitive provider identity details (Full Legal Name, CPF hash lookup, Phone, Unit ID, and proof documents) is strictly gated on the API. Only the approved Moderator assigned to the *specific* condominium of the request can fetch this data.
	*   **Tab 1: Resident Requests (Associações)**:
		*   Lists pending requests (`status = PENDING`) for the condo.
		*   Displays the provider's **Full Legal Name** (Nome Civil), Unit ID, and a button to view their proof of residency in a secure preview modal.
		*   Actions:
			*   **Aprovar**: Activates their resident assignment (status = `APPROVED`), enabling resident verification badges for their ads.
			*   **Rejeitar**: Prompts for a rejection reason (e.g., *"Comprovante ilegível"*), setting status to `REJECTED` and notifying the user.
	*   **Tab 2: Local Announcements (Controle de Conteúdo)**:
		*   Lists active announcements associated with their condo.
		*   Actions:
			*   **Suspender Anúncio**: If an ad violates community guidelines. Prompts for a suspension reason (e.g., *"Atividade inadequada"*), changes status to `SUSPENDED` (hiding it from the vitrine), and notifies the provider.

#### Question 10: System Manager Portal (`/admin`)
*   **Context**: The administrative dashboard for global System Managers.
*   **Decided**: **Multi-Tabbed Admin Portal.**
	*   **Condominium Requests**: Lists pending condos (`PENDING_APPROVAL`). System managers audit ZIP codes, contact info, and review the uploaded election document. Upon approval, condo status becomes `APPROVED` and the creator receives a `MODERATOR` assignment.
	*   **Blacklist Manager**: Form to add CPF hashes to the blacklist (`blacklisted_identifiers`). If a matching account is active, it is immediately banned. Includes access to search and remove hashes.
	*   **Providers Directory**: Searchable list of all platform users. Allows System Managers to ban any user, which immediately removes all their active announcements, revokes active sessions, and hashes their CPF into the global blacklist.

---

## Session 4: Improvements & Fixes

This log tracks all questions, answers, and decisions resolved during the planning phase for the improvements and bug fixes.

### Resolved Decisions

#### Question 1: Payment Generation Guards for Non-Draft/Non-Expired Announcements
* **Decided**: We will add a guard in the `GeneratePaymentIntent` use case on the backend:
    * If the announcement status is already `ACTIVE`, throw an error (e.g., "Este anúncio já está ativo e publicado.").
    * If the announcement is `SUSPENDED`, throw an error (e.g., "Anúncios suspensos não podem receber pagamentos.").
    * This prevents duplicate charges and ensures users cannot pay for already active or moderator‑suspended posts.

#### Question 2: Database Migration Strategy for Dropping the `todo` Table
* **Decided**: Since the project is at its starting point and has not yet released a v1, we will delete the existing migrations folder and recreate the schema from scratch. We will delete the todo table schema definition, wipe the `packages/db/src/migrations/` directory, and generate a new initial base migration from scratch.

#### Question 3: Redirection and Session Expiration for Navigation Links
* **Decided**: To protect against information disclosure and maintain a friendly user flow:
    * **Unauthenticated users** navigating directly to `/dashboard/*`, `/moderation`, or `/admin` via URL will be redirected back to the public homepage `/` (Início), where they can sign in voluntarily using the header action.
    * **Authenticated users** attempting to access routes above their privilege level (e.g. a standard provider accessing `/admin` or `/moderation`) will be redirected to `/dashboard` (Painel) and shown a generic *"Página não encontrada"* (Page Not Found) notification, treating the page as non‑existent for their security level.

#### Question 4: Theme Adaptation in the Simplified Styling
* **Decided**: Keep the `ThemeProvider` and support both Light and Dark modes. By using semantic classes (`bg-background`, `text-foreground`, `border`), the interface will adapt automatically to whichever theme is chosen by the visitor/provider.

#### Question 5: DDD Domain Entity Classes and Base Entity Structure
* **Decided**: We will implement a refined abstract inheritance structure for our domain models:
    * **Base `Entity<TProps>`**: Created in `apps/server/src/shared/base-entity.ts` containing only `_id`, `_props`, the `.id` getter, and the `.equals()` comparison method.
    * **`AuditableEntity<TProps>`**: Extends `Entity<TProps>` and adds `_createdAt: Date` and `_updatedAt: Date` properties (with corresponding getters).
    * Entities like `Condominium` and `Address` (no update time tracking in DB) will extend `Entity` directly.
    * Entities like `Announcement`, `Assignment`, and `Payment` will extend `AuditableEntity`.
    * Domain invariants, state transitions, and parameters validation will be self‑contained within each entity class.

#### Question 6: Decoupling Validators (tRPC Errors) and Concrete Mapper Locations
* **Decided**:
    * **Domain Errors**: We will create a shared `DomainError` base class (extending native `Error`) in `apps/server/src/shared/domain-error.ts`. Entities will throw custom domain exceptions (e.g., `InvalidCEPError`) instead of framework‑specific `TRPCError` exceptions. tRPC middleware/formatters will map standard domain error classes into standard bad‑request tRPC errors before formatting responses.
    * **Mapper Locality & Multi‑Layer Mapping**:
        * **Infrastructure Layer**: Concrete database `EntityMapper` classes will reside under `apps/server/src/infrastructure/db/mappers/` and map between Drizzle database rows and domain entity instances, keeping the domain isolated from persistence schemas.
        * **Presentation Layer**: The tRPC router validates incoming payloads using Zod and maps them directly to Domain Entity instances before calling the use cases. Outgoing domain entities are serialized back into plain DTO objects (via a `.toJSON()` instance method or presentation presenter) for network transport.

#### Question 7: Payment guard UI for ACTIVE
* **Description**: UI should show a toast error message and keep the user on the same page when payment is blocked because the announcement is ACTIVE.
* **Answer**: Show a toast error and stay on the same page.

#### Question 8: Payment guard UI for SUSPENDED
* **Description**: UI should show a distinct toast error indicating suspension and suggest contacting support when payment is blocked because the announcement is SUSPENDED.
* **Answer**: Show a distinct toast error with a support suggestion.

#### Question 9: tRPC error identifiers
* **Description**: Use distinct identifiers for each blocked state.
* **Answer**: Use `ANNOUNCEMENT_ALREADY_ACTIVE`, `ANNOUNCEMENT_SUSPENDED`, and `ANNOUNCEMENT_EXPIRED`.

#### Question 10: Legacy Todo cleanup
* **Description**: Confirmation that no additional files remain to be deleted.
* **Answer**: No additional files discovered; the existing list is complete.

#### Question 11: Styling refactor
* **Description**: Adopt full shadcn design tokens across the UI.
* **Answer**: Fully adopt shadcn design tokens.

#### Question 12: Moderação link visibility
* **Description**: Show the "Moderação" link only for users with a MODERATOR assignment.
* **Answer**: Only users with a MODERATOR assignment see the link.

#### Question 13: ADR for payment error handling
* **Description**: Create an ADR documenting the trade‑offs for payment error handling.
* **Answer**: An ADR will be created.

#### Question 14: Announcement states not yet covered
* **Description**: You indicated uncertainty about any additional announcement states (e.g., EXPIRED, ARCHIVED). Which states, if any, require special UI or backend handling beyond those already defined (`DRAFT`, `ACTIVE`, `SUSPENDED`, `EXPIRED`)?
* **Answer**: No additional states; the current list is sufficient.

#### Question 15: Feature Flagging for New Functionalities
* **Description**: As you expand the platform, you may need to toggle new features on/off per environment or user group. Do you want to implement a feature flag system?
* **Answer**: Adopt Unleash for feature flagging to support learning and alignment with the user's work.

#### Question 16: Internationalization (i18n) Strategy
* **Description**: As the platform grows, you may need to support multiple languages. Which approach would you prefer for handling i18n?
* **Answer**: Use a lightweight i18n library (e.g., react-i18next) with translation JSON files for each locale. We will support both English (en) and Portuguese (pt), ensuring all user-facing strings are stored in translation files instead of being hardcoded in code.

#### Question 17: Double-Visualization — Dedup Strategy or Eliminate Duplicate Trigger?
* **Description**: Clicking an announcement registers two IMPRESSION events because tracking fires from two code paths: `openAdDetails()` in `index.tsx` (card click, modal-only) and a `useEffect` in `anuncios.$id.tsx` (data load, covers modal + direct URL). React.StrictMode also double-fires the effect in dev.
* **Answer**: Eliminate the redundant trigger (Option B). Remove the `trackEvent` call from `openAdDetails()` in `index.tsx` since it only covers the modal path. Keep the `useEffect` in `anuncios.$id.tsx` as the **single source of truth** for impressions (covers both modal and direct URL navigation). Add a `useRef` guard inside the effect to prevent StrictMode double-fires. This is simpler than adding dedup infrastructure and follows single-responsibility.

#### Question 18: Double-Visualization — Dedup Scope (Module vs SessionStorage)
* **Description**: After eliminating the redundant trigger (Q17), we need a guard against `React.StrictMode` double-firing the `useEffect`. Options were: `useRef` only, module-level `Set`, or `sessionStorage`.
* **Answer**: `useRef` guard only (Option A). A `useRef(false)` inside the `useEffect` prevents the StrictMode double-fire while preserving correct analytics semantics. Re-visits should count as new impressions (industry standard behavior matching Google Analytics, Meta Pixel, etc.). Adding a `Set` or `sessionStorage` would artificially deflate metrics.

#### Question 19: Shared Unleash Package — Extract or Keep Inline?
* **Description**: Unleash integration is scattered across `apps/server/src/shared/feature-flags.ts`, `apps/web/src/routes/__root.tsx`, and `packages/env/`. No actual feature flags are consumed anywhere yet.
* **Answer**: Extract now into `packages/feature-flags` (Option B). Create a shared workspace package containing server-side init/check helpers, client-side config factory, typed flag name constants, and shared env schema references. Establishes the pattern cleanly before it gets harder to refactor later.

#### Question 20: Shared Unleash Package — Typed Flag Names
* **Description**: Since we're extracting into `packages/feature-flags` (Q19), should we pre-define a typed flag name registry (`FLAGS` const map + `FlagName` type)?
* **Answer**: Define the registry shape but leave it empty (Option B). Create the `FLAGS` const map and the `FlagName` type with zero entries. The type system enforces the pattern when the first flag is added — you can't pass an arbitrary string, you must add it to the registry first. No placeholder names cluttering the codebase.

#### Question 21: Docker Compose — Relocate to Project Root?
* **Description**: The sole `docker-compose.yml` lives at `packages/db/`. If we add Unleash + Redis, it outgrows its `db` package scope.
* **Answer**: Move to project root (Option A). Relocate `packages/db/docker-compose.yml` to the project root. Update `packages/db/package.json` scripts (`db:start`, `db:stop`, `db:down`) to reference `../../docker-compose.yml`. All infrastructure in one place. Root-level `docker compose up` starts everything.

#### Question 22: Docker Compose — Add Unleash + Redis Containers?
* **Description**: Should we add Unleash server and Redis containers to the root docker-compose for local development?
* **Answer**: Add Unleash + Redis containers now (Option A). Add `unleash-server` (official Docker image, uses the existing Postgres instance with a separate DB) and `redis` to the root compose. Wire `.env.template` defaults to point at these local containers. The dev environment becomes fully self-contained — `docker compose up` gives you everything.

#### Question 23: PG Enum Migration — All at Once or Incremental?
* **Description**: 11 text-enum columns across 6 tables, zero `pgEnum` definitions exist. Project is pre-v1.
* **Answer**: Single batch — all 11 columns at once (Option A). Destructive schema regeneration (delete migrations, `db:generate` fresh). All `text({ enum })` columns become `pgEnum` in one pass. One task, one commit, one migration reset. Mechanical, low-risk transformation with no production data at stake.

#### Question 24: PG Enum Migration — Shared Enum Types Across Tables?
* **Description**: Some enum values overlap between tables (e.g., `PENDING/APPROVED/REJECTED` used by `assignment.status`, `providerLocation.status`, `condominium.status`). Should they share a single `pgEnum` or be independent?
* **Answer**: Independent enums per table (Option A). Each table gets its own `pgEnum`: `userRoleEnum`, `userStatusEnum`, `condominiumStatusEnum`, `providerLocationTypeEnum`, `providerLocationStatusEnum`, `assignmentTypeEnum`, `assignmentStatusEnum`, `announcementStatusEnum`, `paymentStatusEnum`, `analyticsEventTypeEnum`, `analyticsTargetTypeEnum`. DDD-correct approach — each bounded context owns its vocabulary and can evolve independently.

#### Question 25: Entity Function Encapsulation — Static Methods vs Private
* **Description**: Standalone exported validation functions (`validateAnnouncement`, `validateUnitInfo`, `validateCondominiumName`, `validateCEP`, `validateContactInfo`) exist outside their entity classes. Should they become `private static` or `public static` methods on the class?
* **Answer**: `private static` — fully hidden (Option A). Move functions inside the class as `private static` methods. No external code uses them. Maximum encapsulation, enforces that validation lives in the domain only. If the presentation layer needs validation, it goes through the entity constructor.

#### Question 26: Entity Function Encapsulation — CPF Re-export
* **Description**: `cpf.entity.ts` is a 2-line barrel re-export of `{ hashCPF, isValidCPF }` from `@neighborhood-showcase/auth/utils/cpf`. It's not a class or entity — it lives in `entities/` by convention only.
* **Answer**: Delete it — import directly from `@neighborhood-showcase/auth` (Option B). Remove the file and update all consumers to import `{ hashCPF, isValidCPF }` directly from `@neighborhood-showcase/auth/utils/cpf`. The domain `entities/` folder should only contain actual domain entities.

---

## Session 5: AbacatePay Webhook Code Review

This log tracks all questions, answers, and decisions resolved during the grilling session for the AbacatePay webhook code review.

### Resolved Decisions

#### Question 1: Signature Verification Key (Public Key vs Webhook Secret)
* **Decided**: Keep the implementation using `env.ABACATEPAY_PUBLIC_KEY` and `base64` digest encoding. The official AbacatePay v2 documentation specifies using the public key as the HMAC-SHA256 key and digesting as `base64`.

#### Question 2: TypeScript Compiler Blocker (`paymentStatus` unused)
* **Decided**: Option B (Use for Validation & Logging). We will validate that `paymentStatus === 'PAID'` and log it before updating the database, preserving the variable for safety and observability.

#### Question 3: Input Payload Validation (Zod Schema vs Raw Casting)
* **Decided**: Option B (Zod Validation). Define a Zod schema to parse and validate the request body payload structure. This ensures type safety at the application boundary and prevents runtime/TypeError exceptions if AbacatePay updates their payload format.

#### Question 4: Fastify Query Schema Integration
* **Decided**: Option B (Fastify Schema validation). Configure a Fastify query schema on the route definition and leverage Fastify's native generic types to automatically type `request.query` securely.

#### Question 5: Background Email Dispatching (Resend block)
* **Decided**: Option B (Asynchronous Fire-and-Forget). Trigger the Resend email call asynchronously in the background with local error catching so that the webhook responds immediately. We will preserve the mock fallback (`mock-resend-key`) so that local development does not require a Resend API key.

#### Question 6: Explicit `any` Type Cast for `rawBody`
* **Decided**: Option A (Inline Type Casting). Define a typed interface locally inside the file: `interface FastifyRequestWithRawBody extends FastifyRequest { rawBody?: string; }` and cast using it instead of `any` to keep type checking localized and resolve Biome linting violations.

---

## Session 6: Backlog & Items Grilling

This log tracks all questions, answers, and decisions resolved during the planning phase for adding and refining new items to be addressed.

### Resolved Decisions

#### Item 1: Visual Consistency & Shadcn Component Reset
* **Decided**: Enforce absolute visual consistency across the entire application by:
  1. Listing and reinstalling/replacing all locally installed shadcn UI components with fresh, untouched versions from the official registry.
  2. Reviewing all component consumption points in the codebase and stripping away any ad-hoc/custom override style classes (e.g., custom rounded corners, border variations, spacing) that violate default out-of-the-box shadcn aesthetics.

#### Item 2: Geolocation-First Onboarding on Home Page
* **Decided**: Replace the current "select a condominium" prompt with a geolocation permission request on first home page visit. Use the user's coordinates to detect nearby registered condominiums and suggest them ("Do you live in one of these?"). If the user confirms, link that condominium as their context. If not, store the geolocation anyway to power proximity-based content.

#### Item 3: Proximity-Based Announcement Ranking Engine
* **Decided**: Implement a geo-aware ranking system to sort and surface announcements based on proximity to the user's location. Requires infrastructure for geospatial queries (e.g., PostGIS, Solr, or similar). Nearest announcements appear first. This system should be extensible to incorporate other ranking signals beyond location in the future.

#### Item 4: Enriched Per-Announcement Analytics & Dashboard Charts
* **Decided**: Expand the analytics system beyond the current aggregate-only view:
  1. **Per-announcement analytics**: Each announcement should have its own analytics breakdown (impressions, clicks, conversion) accessible from the dashboard.
  2. **Time-period filtering**: Allow providers to see how an announcement performed over a specific period (e.g., last 7 days, last 30 days) and identify peak access/click times.
  3. **Charts & visualizations**: Add chart components (graphs, sparklines) to both the dashboard home (aggregate) and per-announcement detail views.
  4. **Richer announcement card actions**: Add more action buttons on announcement cards in the panel (e.g., "View Analytics", "View Details") beyond just edit.
  5. **Richer event gathering**: Enrich the analytics data collection to capture more granular interaction events for deeper insights.
* **Open for grilling**: Exactly which charts, which events, what's feasible now vs. deferred.

#### Item 5: "Morador Verificado" Badge — Enforcement & Eligibility Fix
* **Decided**: The "Morador Verificado" (Verified Resident) checkbox is currently available to all providers, including external ones not associated with any condominium. This is a bug. The fix:
  1. **Backend enforcement**: The verified resident toggle should only be settable when the provider has an approved `RESIDENT` assignment inside a condominium (i.e., a moderator has approved their residency request).
  2. **Frontend gate**: The checkbox should be hidden or disabled in the announcement creation/edit form when the provider's location type is not `RESIDENT` or their assignment status is not `APPROVED`.
  3. **Verification origin**: Verification status is derived from the moderator approval flow — it is NOT a self-declared toggle. The option only becomes available after the condominium moderator approves the provider's residency.

#### Item 6: Image Cropper UX Overhaul & Edit Flow Parity
* **Decided**: The current image selection and cropping experience is subpar:
  1. **Better cropper interaction**: Replace the slider-based zoom/position controls with a proper drag-to-pan, pinch/scroll-to-zoom canvas cropper. The user should be able to intuitively move and resize the crop area directly on the image.
  2. **Larger preview**: The current preview is too small. Provide a larger, more prominent view of the image during the cropping step so the user can see what they're doing.
  3. **Edit flow parity**: The announcement edit page currently allows image replacement but does NOT expose the cropper. After replacing an image, the user must be able to crop/reposition it — identical to the creation flow.
  4. **Overall polish**: The cropper component should feel premium and modern, not like a debug tool with raw sliders.

#### Item 7: Account Page & User Menu Overhaul
* **Decided**: Account-related actions are currently misplaced (e.g., "Excluir Conta" button lives on the dashboard). Consolidate all account management into a dedicated page and improve the user menu:
  1. **User avatar in header**: Replace the current name/email text display with a shadcn `Avatar` component — show the user's profile picture if available, fall back to initials.
  2. **Popover menu**: Clicking the avatar opens a popover showing the user's name and email, with links to "Minha Conta" (My Account) / "Configurações" (Settings) and "Sair" (Sign Out).
  3. **Dedicated `/account` page**: Create a new account management route containing all user-related actions: change password, update profile info, delete account (moved from dashboard), and any future account settings.
  4. **Remove from dashboard**: The "Excluir Conta" button and account-related UI must be removed from the provider dashboard — it belongs exclusively on the account page.

#### Item 8: Admin Blacklist & User Reporting System Overhaul
* **Decided**: The current blacklist UX requires pasting a raw CPF hash, which is impractical for administrators. The entire system needs to be rethought:
  1. **User reporting**: Users should be able to report other users/providers. Reports feed into a review queue visible to admins.
  2. **Review queue / threat list**: Reported users land in a "threat list" or review queue where admins can see the number of reports, reasons, and context before deciding to blacklist.
  3. **Blacklist by user identity**: Admins should be able to blacklist a user directly from the review queue (system resolves the CPF hash internally). Direct CPF blacklisting remains as an advanced option if the admin has the CPF.
  4. **Predefined block reasons**: Block/ban reasons must be a predefined enum list (e.g., "Fraude", "Assédio", "Conteúdo Impróprio", "Spam"), NOT free text — enabling structured logging and future analytics on ban patterns.
  5. **Open for grilling**: Additional ideas to make the reporting/moderation pipeline more robust (e.g., escalation tiers, appeal flow, auto-suspension thresholds).

#### Item 9: Admin Providers Directory — Filters, Bug Fix & Role Clarification
* **Decided**: The providers directory tab in the admin panel needs significant improvements:
  1. **Richer filter system**: Beyond name/email search, add filters for geographic parameters — filter providers by condominium, city, neighborhood, area. Make the filter system robust and composable.
  2. **Display bug**: The current user (registered as an external provider) does not appear in the directory. Investigate and fix — likely a query filter issue excluding certain roles or location types.
  3. **Role ≠ Provider status**: Being a moderator or administrator should NOT exclude someone from being a provider. "Provider" is an orthogonal concern — a moderator or admin can also sell services. The directory must show ALL users who have provider status, regardless of their admin/moderator role.
  4. **Opt-in provider status for mods/admins**: Moderators and administrators should be able to opt in as providers (related to next item about role management). The system should let them decide if they are "just" a mod/admin or also a provider.

#### Item 10: User & Role Management Admin Panel
* **Decided**: There is currently no UI for managing user roles — admin promotion is done via CLI command. A full user/role management system is needed:
  1. **All-users listing**: An admin screen listing ALL users (not just providers), with search and filtering capabilities.
  2. **Role promotion/demotion**: Admins should be able to promote users to `SYSTEM_MANAGER` (admin), assign `MODERATOR` roles tied to specific condominiums, and manage provider opt-in status.
  3. **CLI bootstrap preserved**: The CLI command for promoting the first admin remains as the bootstrap mechanism for fresh deployments. After that, all role management happens through the UI.
  4. **Open for grilling**: Full scope of what configuration pages/sections are needed — user details, role history, assignment management, condominium-moderator bindings, etc.

#### Item 11: Public Consumer Portal vs. Authenticated Panel Separation
* **Decided**: The home page and the provider/admin panel must feel like two separate experiences, even though they live in the same project:
  1. **Public portal (home page)**: A clean, consumer-facing experience for browsing announcements and services. Zero authentication friction — no login buttons, no "sign up" prompts, no indication that accounts even exist. The user just searches, browses, and contacts providers.
  2. **Authenticated panel**: The dashboard, admin, and moderation sections live under a dedicated path (e.g., `/panel/*` or `/dashboard/*`). Only accessible to users who already know they want to be providers and have consciously chosen to sign up.
  3. **Discovery path**: If a consumer decides they want to become a provider, there should be a deliberate, non-intrusive entry point (e.g., a "Become a Provider" link in a footer or subtle section) that leads them to sign-up — NOT something shoved in their face during browsing.
  4. **Open for grilling**: Exact routing strategy, how to connect both sides without leaking auth concerns into the public portal, shared layout vs. separate layouts, URL structure.

#### Item 12: Panel Sidebar Navigation (shadcn Sidebar Component)
* **Decided**: Replace the current top header bar in the panel (dashboard/admin/moderation) with the official shadcn `Sidebar` component:
  1. **Use the official shadcn Sidebar**: No custom sidebar — use the exact component from the shadcn registry as-is.
  2. **Panel layout overhaul**: The panel sections (dashboard, moderation, admin) get a sidebar-driven layout. The header remains but in a cleaner, more structured form — not the current ugly top bar.
  3. **Better screen composition**: Navigation, user info, and section links live in the sidebar. Content area gets the full remaining width.
  4. **Public portal unaffected**: The public consumer portal (Item 11) keeps its own layout — the sidebar is exclusively for the authenticated panel experience.

#### Item 13: Announcement Card & Detail View Redesign
* **Decided**: The current announcement card on the home page looks improvised. A full redesign is needed:
  1. **Card component**: Replace the current card with a proper component from the shadcn registry or a vetted community registry. No custom-built cards — use an established, polished pattern.
  2. **Missing provider info**: The card and detail view must show the provider's identity — name, logo/avatar — and link to their public profile page (Item 14). Builds trust between consumer and provider.
  3. **Detail view enrichment**: The announcement detail (modal/page) must surface all relevant information: provider link, full contact options, social networks, category, location context, verified badge, etc.
  4. **Open for grilling**: Exact card layout, which community registry components to evaluate, information hierarchy on the card vs. detail view.

#### Item 14: Provider Public Profile Page
* **Decided**: Each provider should have a dedicated public-facing profile page accessible from announcement cards:
  1. **Provider page**: A `/providers/:id` (or similar) route showing the provider's logo, name, description, all contact methods, and social network links.
  2. **All announcements by provider**: The profile page lists all active announcements from that provider, so consumers can browse everything they offer in one place.
  3. **Expanded social/contact options**: Beyond just Instagram — support WhatsApp, phone, email, TikTok, Facebook, Twitter/X, website, and any other relevant contact channels. Both on the provider profile AND on individual announcements.
  4. **Trust signal**: The provider page is a trust-building feature — consumers can see the provider's full presence, history, and offerings before engaging.

### Resolved Questions

#### Question 15: Item 1 — shadcn Style: `base-lyra` vs Default
* **Decided**: Keep `base-lyra` (Option A). Reinstall the 8 existing components fresh under the current style. A full style change is deferred to a future milestone when a broader visual overhaul is warranted.

#### Question 16: Item 1 — Hardcoded Colors: Semantic Tokens Only or Allow Accent Exceptions?
* **Decided**: Option A — strict semantic only. ALL colors must use design system tokens. Zero hardcoded Tailwind color classes (`bg-slate-*`, `bg-emerald-*`, `bg-indigo-*`, etc.). New semantic variables (`--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground`) will be added to `globals.css` with proper light/dark mode values. Border radius will also be normalized to use the `--radius` token system exclusively.

#### Question 17: Item 1 — globals.css Token Review: Add Missing Semantics Now or Later?
* **Decided**: Option A — add all missing semantic tokens (`--success`, `--warning`, `--info` + foreground variants) upfront during Item 1 in `globals.css` (both light and dark mode values). This ensures replacements are ready before the route audit pass.

#### Question 18: Item 1 — New shadcn Components: Batch Install or Incremental?
* **Decided**: Option A — batch install all anticipated components during Item 1. Full list to install: `sidebar`, `avatar`, `chart`, `dialog`, `popover`, `tabs`, `select`, `badge`, `separator`, `sheet`, `tooltip`, `table`, `alert-dialog`, `scroll-area`, `textarea`, `command`, `navigation-menu`. One commit, clean foundation.

#### Question 19: Item 2 — Geolocation Permission UX: When and How to Ask?
* **Decided**: Option B — user-initiated with context. Show a friendly modal explaining WHY we need location before triggering the browser prompt. Additionally:
  1. **Privacy transparency**: The modal must explicitly state that location data is used ONLY for personalizing nearby announcements, is NOT shared with third parties, and can be revoked at any time.
  2. **Revocation mechanism**: Provide an accessible (but not intrusive) way for the user to revoke location permission from within the app (e.g., in settings or a subtle footer control).
  3. **LGPD compliance direction**: This is part of a broader effort to make the app LGPD-compliant — including cookie consent, data usage transparency, and user data control. The geolocation modal sets the tone for this privacy-first approach across the entire platform.

#### Question 20: Item 2 — Fallback When User Denies Location Permission
* **Decided**: Option C — Hybrid fallback. If the user denies or dismisses location permission:
  1. Show all active announcements in chronological order (newest first) without proximity ranking.
  2. Display a subtle reminder banner at the top of the feed allowing them to activate geolocation if they change their mind.
  3. Offer a manual city/neighborhood filter input directly in the public portal search bar so users can self-select their area without geolocation.
  4. **Estimated Location Fallback**: On the server/API layer, we will passively estimate their city/region via IP Geolocation (e.g., lookup based on connection IP address) as an initial default view before they select manually. This IP data is personal but will not be stored, tracked, or linked to individual profiles, keeping it compliant under LGPD legitimate interest.

#### Question 21: Item 2 — Proximity Check: Condominium Matching Radius and UX Flow
* **Decided**: Yes, we will implement the suggested default behaviors:
  1. **Matching Distance**: Two-tier check — 100m (Tier 1: prompt directly) and 1km (Tier 2: list nearby options).
  2. **Multiple Matches**: List them closest-first for user selection.
  3. **No Matches**: Skip condominium prompts completely and show feed sorted by distance.

#### Question 22: Item 2 — Schema Changes: Where to Store Lat/Lng & Geolocation Coordinates?
* **Decided**: Entity-Level Coordinates. We will store coordinates (`latitude`, `longitude`, and the PostGIS `geography(Point, 4326)` custom column) directly on:
  1. The `condominium` table (representing the gate/entrance coordinate).
  2. The `providerLocation` table (representing the provider's specific street entrance coordinate, only populated for independent/external locations since condominium-based providers inherit the condo's coordinates).
* **Onboarding Benefit**: During onboarding/registration, if a user (or provider) shares their geolocation, we can run a PostGIS proximity check against the `condominium` table (using Tier 1/2 radius rules from Q21). If they are near/inside an existing condominium, we prompt them to select it and fill in their unit number, making onboarding extremely low-friction.

#### Question 23: Item 3 — Proximity Ranking Engine: Sorting Priority & Feed Boosts
* **Decided**: Yes, we will implement the following ranking/boost rules:
  1. **Own Condominium Boost**: Announcements from the user's linked condominium always pin to the very top (effectively distance = 0).
  2. **Verified Badge Boost**: Verified providers get a ranking priority boost (they rank higher than unverified providers at similar distances).
  3. **Configurable Feed Radius**: Limit the default feed radius to 10km (starting threshold, configurable in backend environment variables). At the bottom of the feed, show a friendly message and a button allowing users to manually "expand search radius" (e.g., search up to 25km) with a warning that providers at greater distances might not serve/deliver to their area.

#### Question 24: Item 4 — Analytics & Charts: Metrics, Granularity, and Libraries
* **Decided**: Yes, we will implement the following:
  1. **Chart Library**: Install and use **shadcn charts** (which wraps Recharts nicely with Tailwind CSS variables).
  2. **Time-Period Granularity**: Provide Last 7 Days (daily), Last 30 Days (daily/weekly), and Last 12 Months (monthly) selectors.
  3. **Event Tracking**: Keep tracking simple with `IMPRESSION` and `CONTACT_CLICK` (WhatsApp, Instagram, Website), but build the database schema and queries in an extensible way (with room for growth, e.g. easily adding custom event types like `SHARE` or `EXPAND_CARD` in the future).

#### Question 25: Item 5 — Morador Verificado: Backend Enforcement & Frontend Experience
* **Decided**: Yes, we will implement the following:
  1. **Backend Security Gap**: Enforce the exact same residency verification check on the `update` procedure as we do on the `create` procedure to prevent any privilege bypass.
  2. **Revocation Rule**: If a provider's location assignment changes to anything other than `APPROVED` (e.g., `REJECTED`, `PENDING`, or is deleted), any active announcements associated with that location will automatically have `showVerifiedBadge` set to `false`.
  3. **Frontend Toggle Experience**: Option B. Show the "Morador Verificado" toggle disabled, with a helpful tooltip/text explaining that verification is required, linking to the location setup/verification form.

#### Question 26: Item 6 — Image Cropper: Library vs. Custom Refinement
* **Decided**: Option A. Replace the custom slider-based HTML5 Canvas cropper with **`react-easy-crop`** to provide a direct drag-to-crop, pinch-to-zoom, and boundary-box visual experience, which is far superior for mobile-first users.

#### Question 27: Item 7 — Account Page & Header Menu Details
* **Decided**: Yes, we will implement the following:
  1. **Avatar Fallback Style**: Display the user's initials (e.g., "TP") as the fallback style.
  2. **Editable Fields**: Add an edit form to allow updating the user's display Name.
  3. **Route Nesting**: Nest the account page route under `/dashboard/conta` so it automatically inherits the authenticated panel layout.

#### Question 28: Item 8 — User Reporting & Moderation Queue Details
* **Decided**: Yes, we will implement the following:
  1. **Report Access**: Restrict report submission to authenticated/registered users only (prevents anonymous spam/bots). Normal logged-in residents/users can submit reports.
  2. **Moderation Flow (Spotlight)**: No automatic suspension. Instead, when an announcement receives a certain threshold of reports (e.g., 5 flags), it gets highlighted ("Spotlight") as a high-priority item in the moderator/admin dashboard queue for manual review. All bans and suspensions remain manual to avoid malicious competitor takedowns.
  3. **Predefined Reasons**: Offer standard report categories: "Fraude / Golpe", "Assédio / Ofensivo", "Spam", "Serviço / Produto Ilegal", "Outros".

#### Question 29: Item 9 — Admin Providers Directory Filters & Opt-In Details
* **Decided**: Yes, we will implement the following:
  1. **Provider Opt-In**: Automatic on account creation — every user is a potential provider by default. However, users must be able to opt out of being listed as a provider (e.g., a toggle in their account settings to hide their provider profile from the directory).
  2. **Geographic Filters UI**: Option A — composable select inputs (distinct dropdowns/comboboxes for Condominium, City, and Neighborhood) for structured, scalable filtering.

#### Question 30: Item 10 — User & Role Management Admin Panel Details
* **Decided**: Yes, we will implement the following:
  1. **Role Hierarchy**: Option A — strict hierarchy. Only `SYSTEM_MANAGER` can promote other users to `SYSTEM_MANAGER`. Lower-level admins can assign `MODERATOR` roles tied to specific condominiums.
  2. **Moderator Scope**: Option B — one-to-many. A single moderator can be assigned to moderate multiple condominiums simultaneously.
  3. **Audit Trail**: Option A — store a simple audit log of role changes (who promoted/demoted whom, which role, and when) for accountability.

#### Question 31: Item 11 — Public Consumer Portal vs. Authenticated Panel Separation
* **Decided**: Yes, we will implement the following:
  1. **URL Structure**: Option B — unify all authenticated routes under a single `/panel/*` prefix (`/panel/dashboard`, `/panel/admin`, `/panel/moderation`). One parent route = one auth guard, one sidebar layout.
  2. **"Become a Provider" Discovery**: Option B — footer link plus a subtle section at the bottom of the home page (e.g., "Quer anunciar seus serviços? Saiba mais").
  3. **Shared Layout Components**: Option A — completely independent layouts. The public portal and the authenticated panel share zero layout components. Visual identity divergence is handled via CSS variable scoping (`data-theme="portal"` vs `data-theme="panel"`) on the respective layout wrappers.

#### Question 32: Item 12 — Panel Sidebar Navigation Details
* **Decided**: Yes, we will implement the following:
  1. **Sidebar Mode**: Option A — collapsible. Full sidebar with labels when expanded, icon-only rail when collapsed. User can toggle.
  2. **Navigation Grouping**: Option B — grouped by role. Sections grouped under labeled headers (e.g., "Provedor", "Moderação", "Administração"). Only groups relevant to the user's roles are shown.
  3. **Mobile Sidebar Behavior**: Option A — off-canvas drawer. Sidebar slides in from the left as an overlay, triggered by a hamburger menu icon (standard shadcn Sidebar mobile behavior).

#### Question 33: Item 13 — Announcement Card & Detail View Redesign
* **Decided**: Yes, we will implement the following:
  1. **Card Click Behavior**: Option B — navigates to a dedicated detail page (`/anuncios/:id`). Full page with richer layout and SEO benefits (each announcement gets its own indexable, shareable URL).
  2. **Contact Actions Visibility**: Option A — show the primary contact action (e.g., WhatsApp button) directly on every card for quick access and higher conversion.
  3. **Provider Identity on Card**: Option B — rich. Provider name + avatar + verified badge + link to provider profile displayed directly on the card for trust at first glance.

#### Question 34: Item 14 — Provider Public Profile Page Details
* **Decided**: Yes, we will implement the following:
  1. **Profile URL Slug**: Option A — raw ID (`/prestadores/:id`). Simple, no collision handling needed.
  2. **Social/Contact Channels**: Support the following optional fields on the provider profile: WhatsApp, Phone, Email, Instagram, TikTok, Facebook, Website.
  3. **Empty Profile Handling**: Option A — show the profile with an empty state message (e.g., "Este prestador não possui anúncios ativos no momento"). The profile still has value for contact info and social links.

#### Session 2026-06-10 — Provider section split (Account page → Configurações) + Dashboard slimming
* **Decided**:
  1. **User vs Provider Profile ownership**: **Option A — strict split.** `Conta` page owns User identity only (`name`, `email`, `phone`, language, theme, password, delete). Provedor `Configurações` page owns the Provider Profile (`displayName`, `avatarUrl`/`logoUrl`/`bannerUrl`, `companyName`/`tradeName`, `publicDescription`, `socialLinks`, `isProviderVisible`). The current `user.update` mutation mixing these is incorrect and will be replaced.
  2. **Provider Profile scope (this pass — Option A)**: All Providers are individuals (one User, one CPF). `companyName` and `tradeName` are free-text branding only. No CNPJ, no document upload, no `providerType` enum, no legal-entity semantics.
  3. **Future "Company Provider" (Option B, deferred)**: Will introduce a `providerType: COMPANY` path with CNPJ + razão social + nome fantasia + document upload, separate onboarding, CNPJ validation, admin verification. Logged in `backlog.md` and `CONTEXT.md` ("Provider Profile (future — Option B, deferred)").
  4. **Configurações page field set (current)**: `displayName`, `companyName`, `tradeName`, `avatarUrl`, `logoUrl`, `bannerUrl`, `publicDescription`, 7 social-link fields, `isProviderVisible` toggle. Image fields are URL inputs only in this pass (no upload widget yet — needs separate UX slice).

#### Session 2026-06-10 — Q9: Provedor sidebar group visibility
* **Decided**: **Option A — strict.** Hide the Provedor sidebar group unless the User has at least one Provider Assignment with `enabled = true`. The onboarding entry point is the public "Anunciar" CTA, not the panel sidebar. A new user with zero assignments sees no Provedor items. Captured in `CONTEXT.md` ("Provedor group visibility for new users (Option A — strict)"). The current `panel.tsx` code (`GROUP_PROVEDOR.condition: true`) is a code-vs-glossary mismatch that this session surfaced as a follow-up bug.

#### Session 2026-06-10 — Q10: Fix Provedor sidebar code-vs-glossary mismatch
* **Decided**: **Option A — fix in this epic.** Change `GROUP_PROVEDOR.condition` in `panel.tsx` from `true` to `hasProviderAssignmentWithEnabledTrue(session, assignments)`. This is a code-vs-glossary bug (CONTEXT.md always said the rule; the code never enforced it). Also: implicit follow-up — add route guards on the new `/panel/dashboard/configuration` and `/panel/dashboard/announcements` routes so direct-URL access by a non-Provider redirects to `/panel/conta` (mirrors the existing pattern for `/panel/admin` and `/panel/moderation`). The other groups' conditions (Moderação, Administração, Reports) already match the glossary — no change needed there.

#### Session 2026-06-10 — Q12: Image upload widget scope (User avatar + Provider fields)
* **Decided**: **Option C — build the upload widget in this epic for both User and Provider.** The User avatar uses ONLY the upload widget. Each Provider Profile image field (`avatarUrl`, `logoUrl`, `bannerUrl`) accepts BOTH a URL input AND the same upload widget — a Provider can paste a hosted URL or upload from disk. Reuses the existing `/api/upload` endpoint. Larger scope than the previous "URL-only for Provider" assumption, but consistent UX across the app.

#### Session 2026-06-10 — Q13: Image upload widget design
* **Decided**:
  1. **13a**: Generalize the existing `ProviderDashboardEditImageField` into a shared `ImageUploadField` component, parameterized by `aspectRatio`, `label`, `helpText`. Reused by the announcement edit modal AND the new Conta/Configurações fields. No duplication.
  2. **13b**: Aspect ratios: User avatar **1:1**, Provider avatarUrl **1:1**, Provider logoUrl **1:1**, Provider bannerUrl **16:9**.
  3. **13c**: Provider image fields use a single field that accepts EITHER a URL paste OR a "ou faça upload" button that opens the file picker + cropper. After upload, the resulting URL replaces the field value. URL paste = no crop (we don't have the file to crop). Upload = crop and store. No "URL → crop" flow.
  4. **User avatar is widget-only** (no URL alternative). User identity is "your picture on this platform", stored on our CDN. Provider image fields are branded content where hosted URLs are legitimate.

#### Session 2026-06-10 — Q14: Public Description field
* **Decided**:
  1. **14a**: Plain text only (no markdown, no formatting). Rendered with `whitespace-pre-wrap` on the public profile.
  2. **14b**: **500 char cap** at the application layer. Database column is `text` (unbounded in Postgres), but the Zod schema for the mutation enforces `max 500`.
  3. **14c** (revised): **Full branding set rendered on public profile page in this epic.** The public page gets: `bannerUrl` as hero image (16:9, full width), then a card with `logoUrl` (left) + `displayName` (large) + `companyName`/`tradeName` (subhead) + verified badge, then social links, then a "Sobre" section with `publicDescription`, then the active announcements list. The backend DTO `PublicProviderProfileResult` is extended with all 4 new fields. The `name` field on the public DTO is replaced with `displayName` (the profile's display name, not the User's name), per `CONTEXT.md` glossary.

#### Session 2026-06-10 — Q15: Public page banner fallback + visual rule
* **Decided**:
  1. **15a**: When `bannerUrl` is null, **no banner block is rendered at all** on the public provider page. The page goes straight to the identity card. No placeholder, no gradient, no broken image.
  2. **15b**: The public provider page applies the full-width rule (`w-full space-y-8 px-6 py-8` instead of `mx-auto max-w-6xl`). The public homepage (`_portal.index.tsx`) is a documented exception and stays centered.

#### Session 2026-06-10 — Q16: Configurações page save behavior
* **Decided**: **B — per-section save.** The 3 sections (Public Profile, Contact Channels, Public Visibility) are independent forms, each with its own save button, its own pending state, its own toast, its own mutation. The 4th section (Public Visibility) is a single toggle, so its "save" pattern is auto-save-on-toggle (a future detail to confirm).

#### Session 2026-06-10 — Q17: Provider Profile authorization model
* **Decided**:
  1. **17a**: `trpc.providerProfile.get` takes no input. The procedure infers `userId` from `ctx.session.user.id`. A User can only read their own profile via this endpoint.
  2. **17b**: `trpc.providerProfile.update` is an upsert (matches the existing `onConflictDoUpdate` pattern). The Configurações page is the "create or edit" entry point. No separate creation flow.
  3. **17c**: The public DTO `PublicProviderProfileResult` is extended with `companyName?`, `tradeName?`, `logoUrl?`, `bannerUrl?`, `publicDescription?`. The `name` field is replaced with `displayName` (the profile's display name, not the User's name) per `CONTEXT.md` glossary. The public endpoint keeps its existing `isProviderVisible` / `BANNED` / soft-delete filters.

#### Session 2026-06-10 — Q18: Meus Anúncios edit/analytics surface
* **Decided**: **C — Provider-facing detail page** at `/panel/dashboard/announcements/:id` (or `/panel/dashboard/anuncios/:id` to match the existing PT route naming pattern used by `/pagamento`). The detail page contains: full announcement view (image, title, subtitle, description, price, category, tags, contact links, status, dates, payment/expiry info) + inline edit mode (toggle "Editar" → fields become editable → "Salvar"/"Cancelar") + inline analytics section (impressions/clicks/conversion KPIs + small chart + period selector). List cards become real links. Pay/renew still navigate to the existing payment route. New route needs the same Provedor-group guard as Meus Anúncios (Q10). 404 / "not your announcement" cases redirect to Meus Anúncios with a toast.

#### Session 2026-06-10 — Q19: Anúncios combined card sub-stat ordering
* **Decided**: **A — Ativos → Rascunhos → Expirados → Suspensos** (lifecycle order, most-actionable first). Ativos is the primary metric, Suspensos is rare + high-friction so it sits at the bottom. Unblocks Q5 and Q6 for PRD scope.

#### Session 2026-06-10 — Mid-session correction: PRD scope rule
* **Decided**: The PRD must contain ONLY decisions that are *fully locked AND have zero dependency on any open question*. The 8 open UX questions have defaults, but those defaults are recommendations, not locks. Decisions that depend on them stay in the grilling queue. **Grilling continues on the remaining 4 dependent decisions (Q11-cosmetic x3, Q14-Sobre, Q18-route) before the PRD is written.** The session summary file (`sessions/2026-06-10-provider-section-reorg-grilling.md`) is updated inline as each lock lands, so the what and the why survive any session boundary.

#### Session 2026-06-10 — Q20: Email verification badge on Conta e Segurança
* **Decided**: **A — plain text indicator.** Next to the email field, show "Verificado" (small green checkmark icon) or "Pendente" (small amber dot icon). No button, no action — purely informational. When the future email verification epic lands, the indicator becomes interactive. Unblocks Q11 for PRD scope.

#### Session 2026-06-10 — Q21: Theme/language persistence error handling
* **Decided**: **A — silent best-effort, never block the toggle, AND on next page load the local preference wins if it disagrees with the backend.** The local UI is the source of truth for "what the user sees right now"; the backend is "what we'll restore on the next device". They can disagree; that's OK. The user is not punished for a flaky network. Unblocks Q11 for PRD scope.

#### Session 2026-06-10 — Q22: Sidebar footer avatar
* **Decided**: **A — show `user.image` if set, fall back to initials.** One-line change to `panel.tsx` footer. Standard shadcn `<AvatarImage>` automatically falls back to `<AvatarFallback>` when `src` is null or the image fails to load — no extra `onError` handler needed. The User's `image` (account identity) and the Provider Profile's `avatarUrl` (public Provider avatar) are intentionally separate fields per the strict User/Provider Profile split (Q1) and do NOT auto-mirror. Unblocks Q11 for PRD scope.

#### Session 2026-06-10 — Persistence contract for the session summary
* **Decided**: The session summary file at `.specify/memory/sessions/2026-06-10-provider-section-reorg-grilling.md` is the source of truth for the entire Provider Section Reorg grilling session. It must be a full snapshot of the agent's reasoning — every decision, every default considered, every alternative rejected, every dependency chain, every "what" + "why". The agent updates it inline (after every answer) AND in the project rules files (`CONTEXT.md`, `agents.local.md`, `backlog.md`, `grilling_history.md`) for cross-referencing. If a future session starts and the agent's in-context memory has degraded, the file must still have everything. The agent should NOT trust its in-context memory over the file.

#### Session 2026-06-10 — Q23: Public page "Sobre" section placement
* **Decided**: **A — below the social links, above the active announcements.** Identity → social links → pitch (Sobre) → inventory (announcements) is a natural narrative for a marketing-style profile page. Unblocks Q14 for PRD scope.

#### Session 2026-06-10 — Q24: Route file naming for the new detail page
* **Decided**: **A — English `/panel/dashboard/announcements/:id`.** The user re-asserted the "English in all code" rule (already in `RULES.md` §6: "all code artifacts (file names, variable names, function names, route paths, i18n key paths) must be English. No exceptions."). New routes MUST be EN. The existing PT `anuncios/$id/pagamento` is a known deferred item (logged in `backlog.md` "Mixed-language route naming fix"); it gets migrated when touched. The cross-reference to RULES.md §6 was added to `agents.local.md` §5 in this turn. Unblocks Q18 for PRD scope.

#### Session 2026-06-10 — Q25: Public Visibility toggle save behavior
* **Decided**: **B — auto-save on toggle change (with 300ms debounce).** The Public Visibility section is a single field (`isProviderVisible` checkbox); explicit save is heavy. Toggles are universally auto-save in settings UIs. The other two Configurações sections (Public Profile, Contact Channels) keep their explicit per-section save buttons. Debounce handles accidental toggle-and-back. Refines Q16 (the Q16 default was per-section save for all 3 sections; Q25 special-cases the Public Visibility section to auto-save).

#### Session 2026-06-10 — Operational rule: act on PT names, stack leftovers
* **Decided**: When an implementation task touches a file / route / variable named in Portuguese, the task MUST translate that item to English as part of the same change. If the task encounters OTHER PT-named items in the same touched area that are NOT in its scope, the task MUST log them in a "Stacked leftovers" sub-section in `agents.local.md` §5. Logged leftovers are picked up in a future sweep epic (the existing "Mixed-language route naming fix" backlog item, which was updated to be the "stacking point" for this rule). This prevents PT names from spreading while keeping individual tasks focused. The "Stacked leftovers" section was seeded with 3 items found during this session: `panel.conta` (file + URL), `panel.dashboard.anuncios.*` (file family + URLs), and i18n key prefix `dashboard.anuncios.*`.

#### Session 2026-06-10 — End of grilling pass
* **Status**: All 25 decisions locked (Q1–Q18 from the initial pass; Q19–Q25 from the "finish grilling" pass that resolved the 8 open UX questions). The PRD-scope rule (locked + zero open-question dependencies) is satisfied for every decision. The session is closed; the PRD can be written.
* **Grilling summary by decision**:
  - Q19 (A): Anúncios sub-stat order = Ativos → Rascunhos → Expirados → Suspensos. Unblocked Q5, Q6.
  - Q20 (A): Email verification = plain text indicator (Verificado / Pendente) next to email field. Unblocked Q11.
  - Q21 (A): Theme/language persistence error = silent best-effort, local UI wins. Unblocked Q11.
  - Q22 (A): Sidebar footer avatar = show `user.image` if set, fallback to initials. Unblocked Q11.
  - Q23 (A): Public page "Sobre" section = below social links, above announcements. Unblocked Q14.
  - Q24 (A): Route file naming = English `/panel/dashboard/announcements/:id`. Re-asserted the "English in all code" rule from RULES.md §6. Unblocked Q18.
  - Q25 (B): Public Visibility toggle = auto-save on change with 300ms debounce. Refined Q16 (per-section save still applies to Public Profile + Contact Channels; Public Visibility is the special case).

#### Session 2026-06-10 — Correction: stack-leftovers location is the backlog, not agents.local.md
* **Decided**: The "stacking point" for PT-named items is `.specify/memory/backlog.md`, NOT `agents.local.md`. `agents.local.md` §5 holds the **operational policy** (the rule the agent follows). The actual list of stacked items lives in `backlog.md` as separate `deferred` rows. The 3 initial items (panel.conta, panel.dashboard.anuncios.*, dashboard.anuncios.* i18n keys) were moved from `agents.local.md` §5 to `backlog.md` as 3 new `Stacked 2026-06-10` rows under the "Mixed-language route naming fix" policy row.

#### Session 2026-06-10 — Post-grilling: PRD-v7 merged into root PRD index, epic 13 created
* **Trigger**: User invoked the `to-epic-issues` skill with the intent to merge PRD-v7 (`.specify/memory/prds/PRD-v7-provider-section-reorg.md`) into the root PRD and create the epic + task files. All 25 grilling decisions were already locked; the merge was the next deliverable.
* **Merged**: PRD-v7 was added to the **INDEX** at `/PRD.md` (the active root PRD at the repository root). A new row was added to the index table and PRD-v7 was marked **CURRENT**; PRD-v6 was demoted to **SUPERSEDED**. The versioned source `PRD-v7-provider-section-reorg.md` is the single source of truth — `/PRD.md` does NOT inline PRD-v7's content.
* **First attempt was wrong**: the initial merge inlined PRD-v7 as **Module 25** of `/PRD.md` (per the old `prd-merging.md` pattern). The user course-corrected: in this project, "merge" means **thin INDEX**, not inline. Module 25 was reverted, and the index structure was appended at the end of `/PRD.md` (which now ends at the historical inlined Module 24, followed by the index and a "Root PRD Contract" section that codifies the rule for future agents). A second rule was also added to `/PRD.md` itself so any future agent reading the file understands the contract immediately.
* **Deprecated**: Two non-versioned files in `.specify/memory/prds/` (`prd.md`, `prd-technical-debt-round-2.md`) were renamed to `_DEPRECATED_*.md` with deprecation headers pointing to the active root PRD at `/PRD.md`. Root cause of the deprecation: on the first merge attempt the agent conflated the lowercase `prds/prd.md` with the repo-root `PRD.md` (the active root). The user caught the mistake and asked for the confusable files to be deprecated so the misread never recurs.
* **Created**: Epic `13-provider-section-reorg` at `.specify/memory/epics/13-provider-section-reorg/`. 10 dependency-ordered task files in the grilling-recommended order: schema → backend entity/repo/use cases → trpc.providerProfile router → shrink trpc.user.update + DTOs → Configurações page → Conta e Segurança slim → Meus Anúncios list → Meus Anúncios detail page → dashboard slim view + sidebar fix → public page rendering + ADRs 0005/0006.
* **Testing policy baked in**: every task file's Acceptance Criteria explicitly forbids `test.skip()`, mandates real test database for backend tests, real tRPC client for frontend tests, and Playwright for every UI change. Tests must catch visual regressions, not just runtime correctness.
* **Cross-references**: epic + 10 task rows added to `.specify/memory/index.md`. `agents.local.md` "Current Plan Reference" section rewritten to describe the index structure (thin INDEX in `/PRD.md` pointing to the versioned PRDs, with PRD-v7 as CURRENT); PRD directory list corrected. `backlog.md`: 2 active items had their linked PRD reference updated to PRD-v7 (the current PRD); 1 item moved from `deferred` → `active` (Backend language preference persistence — now in scope for epic 13 task `06_conta_e_seguranca`).
* **The merge contract (now permanent, codified in `/PRD.md` itself and in memory)**: when the user says "merge" / "add" / "join" on this project, the agent maintains the **INDEX** in `/PRD.md` (adds a new row, marks it CURRENT, demotes the previous CURRENT to SUPERSEDED). The agent NEVER inlines PRD content. The versioned file at `.specify/memory/prds/PRD-vN-*.md` is the single source of truth. The user generates new PRDs in `prds/`; the agent maintains the index and the epic decomposition.
