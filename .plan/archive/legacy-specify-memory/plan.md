# Implementation Plan - Neighborhood Showcase (Guia Local de Condomínio)

This implementation plan details the development roadmap, system architecture, database schema, and verification plan for the Neighborhood Showcase application, built on top of the `neighborhood-showcase`.

---

## Architecture & Technology Stack

*   **Runtime & Package Manager**: Bun
*   **Monorepo Tooling**: Turborepo
*   **Frontend**: React (Vite) + TanStack Router + TailwindCSS + shadcn/ui
*   **Backend**: Fastify + tRPC (`apps/server`)
*   **Database**: PostgreSQL + Drizzle ORM (`packages/db`)
*   **Authentication**: Better-Auth (`packages/auth`) with email/password and social login (Google)
*   **Payments**: AbacatePay (Pix API + Webhooks)
*   **Email**: Resend
*   **Image Processing**: Sharp (local compression and WebP conversion)
*   **Alerting**: Telegram Bot API

---

## Phase 1: Database Schema & Authentication
*   **Visual Resource**: [Database ERD Diagram](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/diagrams/database-erd.md)
*   **Visual Resource**: [Onboarding & Verification Flowchart](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/diagrams/onboarding-flow.md)

### 1. Database Schema (`packages/db/src/schema.ts`)
We will define the following Drizzle schemas:

*   **Users (Providers)**: Extended from Better-Auth schema.
    *   `id`: text (Primary Key)
    *   `name`: text
    *   `email`: text (Unique)
    *   `cpfHash`: text (Unique - SHA-256 of CPF for registration validation and ban-evasion check)
    *   `role`: text (enum: `PROVIDER`, `SYSTEM_MANAGER`)
    *   `status`: text (enum: `ACTIVE`, `BANNED`)
    *   `phone`: text (WhatsApp link/number)
    *   `createdAt`: timestamp
    *   `updatedAt`: timestamp
    *   `deletedAt`: timestamp (soft delete)
*   **Condominiums**:
    *   `id`: text (Primary Key)
    *   `name`: text
    *   `city`: text
    *   `state`: text
    *   `cep`: text
    *   `contactInfo`: jsonb (website, administrative email/phone)
    *   `status`: text (enum: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`)
    *   `createdBy`: text (foreign key -> Users.id)
    *   `createdAt`: timestamp
    *   `deletedAt`: timestamp
*   **Assignments**:
    *   `id`: text (Primary Key)
    *   `providerId`: text (foreign key -> Users.id)
    *   `condominiumId`: text (foreign key -> Condominiums.id)
    *   `type`: text (enum: `RESIDENT`, `MODERATOR`)
    *   `status`: text (enum: `PENDING`, `APPROVED`, `REJECTED`)
    *   `unitInfo`: text (e.g., Block A, Apt 104 - kept private, visible only to Condo Moderator)
    *   `proofOfResidency`: text (optional URL / document reference)
    *   `createdAt`: timestamp
    *   `updatedAt`: timestamp
*   **Announcements**:
    *   `id`: text (Primary Key)
    *   `providerId`: text (foreign key -> Users.id)
    *   `title`: text
    *   `subtitle`: text
    *   `description`: text
    *   `priceCents`: integer (optional)
    *   `imageUrl`: text
    *   `category`: text (enum/string)
    *   `tags`: text[] (array of strings)
    *   `contactLinks`: jsonb (WhatsApp, Instagram, Website)
    *   `showVerifiedBadge`: boolean (opt-in toggle for verified residents)
    *   `status`: text (enum: `DRAFT`, `PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `SUSPENDED`)
    *   `paidAt`: timestamp
    *   `expiresAt`: timestamp
    *   `createdAt`: timestamp
    *   `deletedAt`: timestamp
*   **AnalyticsEvents**:
    *   `id`: text (Primary Key)
    *   `announcementId`: text (foreign key -> Announcements.id, cascade delete)
    *   `eventType`: text (enum: `IMPRESSION`, `CONTACT_CLICK`)
    *   `targetType`: text (optional, enum: `WHATSAPP`, `INSTAGRAM`, `WEBSITE` - populated only for `CONTACT_CLICK`)
    *   `createdAt`: timestamp
*   **Payments (AbacatePay Logs)**:
    *   `id`: text (Primary Key)
    *   `announcementId`: text (foreign key -> Announcements.id)
    *   `billingId`: text (AbacatePay billing ID)
    *   `amountCents`: integer
    *   `status`: text (enum: `PENDING`, `PAID`, `EXPIRED`, `REFUNDED`)
    *   `pixQrCode`: text
    *   `pixCopyPaste`: text
    *   `createdAt`: timestamp
    *   `updatedAt`: timestamp
*   **Blacklisted Identifiers**:
    *   `id`: text (Primary Key)
    *   `cpfHash`: text (Unique - sha256 hash of blacklisted CPFs)
    *   `reason`: text
    *   `bannedAt`: timestamp

### 2. Better-Auth Setup & CPF Validation
*   Configure custom plugins/hooks to check if the registration email or `sha256(cpf)` exists in the `blacklisted_identifiers` table.
*   Enforce active session checks: Reject requests if `Users.status === 'BANNED'`.

---

## Phase 2: Backend API Services (tRPC Routers in Feature Slices)

We will implement the following procedures inside the feature folders under `apps/server/src/features/` (exposed via local feature tRPC routers, which are composed into the main AppRouter in `apps/server/src/routes`):

### 1. `condominium` Feature (tRPC procedures)
*   `request`: Request a new condominium (defaults to `PENDING_APPROVAL`).
*   `listApproved`: Retrieve approved condominiums filtered by city/state.
*   `approve`: System Manager action to approve a condominium (automatically grants the requester a `MODERATOR` assignment type for that condominium).
*   `reject`: System Manager action to reject a condominium.

### 2. `assignment` Feature (tRPC procedures)
*   `request`: Provider requests to join a Condominium.
*   `approve`: Moderator approves a resident assignment.
*   `reject`: Moderator rejects an assignment request.
*   `listPending`: Moderator gets the list of pending assignments for their Condominium.

### 3. `announcement` Feature (tRPC procedures)
*   **Visual Resource**: [Announcement Lifecycle State Machine](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/diagrams/announcement-lifecycle.md)
*   `create`: Creates a draft announcement.
*   `getPaymentDetails`: Generates or returns an active AbacatePay Pix paywall link (R$ 2,00).
*   `listPublic`: Search and list all `ACTIVE` announcements (filtered by condominium, category, search string, or verified status).
*   `trackEvent`: Record an impression or contact click in the `analytics_events` table (takes `announcementId`, `eventType`, and optional `targetType`).
*   `suspend`: Moderator/Admin action to suspend a violating announcement.

### 4. `provider` Feature (tRPC procedures)
*   `getDashboard`: Get the provider's active/draft/expired announcements with performance stats (views, WhatsApp/Instagram/website clicks) aggregated from the `analytics_events` table.
*   `deleteAccount`: LGPD-compliant deletion. Scrub all PII, keeping anonymized payments.

---

## Phase 3: Frontend Interfaces & Portals (TanStack Router)

All screens are designed **mobile-first** for viewers and fully responsive for dashboards. Access-gated features are validated via client-side router loaders and backend tRPC guards. Refer to [Grilling History (Session 3: Screen & UI Design)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/grilling_history.md#session-3-screen--ui-design-initial-planning) for full mapping details.

### 1. Vitrine Pública (`/`)
*   **Behavior**: Browser requests geolocation on first load. If allowed, sorts announcements by proximity (nearest condos first). Fallback prompts manual condo/city selection.
*   **Elements**: Sticky search bar, horizontal category swipe, "Apenas Moradores Verificados" toggle, and card grid.

### 2. Detalhe do Anúncio (`/anuncios/:id`)
*   **Behavior**: Opens as full page if accessed directly. Opens as bottom sheet/drawer (mobile) or modal dialog (desktop) if clicked from showcase. URL synchronizes.
*   **Elements**: 4:3 cover image, title, price (optional), description, and contact action buttons (WhatsApp, Instagram, PDF catalog) intercepting clicks for analytics.

### 3. Autenticação & Cadastro (`/auth`)
*   **Elements**: Dual tab form ("Entrar" / "Criar Conta"). Registration collects Full Legal Name, Email, Password, Phone, and CPF (validated and checked against the global blacklist hash). Redirects users without assignments to condo setup.

### 4. Associação de Condomínio (`/dashboard/condo-setup`)
*   **Resident Path**: Search condo, input unit info, upload proof of residency (optional). Puts account into a pending state.
*   **Síndico Path**: Input condo details (CEP lookup), upload mandatory proof of office. Puts condo into pending approval by global admin.
*   **Blocker**: Prevents navigating to main dashboard/announcements until at least one assignment is approved.

### 5. Dashboard do Provedor (`/dashboard`)
*   **Elements**: Metric stat cards (views, clicks, conversion rate). Tabbed lists of announcements (Ativos, Aguardando Pagamento, Expirados, Suspensos with moderation reason). Profile update panel and LGPD permanent deletion button.

### 6. Formulário de Anúncio (`/dashboard/anuncios/novo` or `/editar/:id`)
*   **Elements**: Mandatory image selector with fixed 4:3 frontend cropper. Category selector, title/subtitle/description with counters, price, tags, contact links (WhatsApp, Instagram, catalog PDF). Verified resident badge toggle (active only if approved resident).

### 7. Tela de Pagamento Pix (`/dashboard/anuncios/:id/pagamento`)
*   **Elements**: Dynamic QR code, Pix copy-paste button, countdown timer, bank confirmation polling (every 5s). Confetti animation and checkmark upon successful payment webhook resolution.

### 8. Painel de Moderação Local (`/moderacao`)
*   **Elements**: Condo selector context. Tab 1 lists pending residents showing legal name, unit ID, and secure proof document viewer with Approve/Reject actions. Tab 2 lists active local ads with action to Suspend (requires reason).

### 9. Portal do Administrador Global (`/admin`)
*   **Elements**: Tab 1 lists pending condo creation requests with proof documents. Tab 2 manages CPF blacklist (insert/remove hashes). Tab 3 directories all providers with global Ban actions.

---

## Phase 4: Webhook & Integrations

### 1. AbacatePay Webhook Handler (`apps/server/src/routes/webhooks/abacatepay.ts`)
*   **Visual Resource**: [Payment & Webhook Sequence Diagram](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/diagrams/payment-sequence.md)
*   Secured webhook endpoint validating signatures.
*   Upon `billing.paid` event:
    *   Transition the associated Announcement status to `ACTIVE`.
    *   Set `expiresAt` to `now + 30 days`.
    *   Trigger an email notification to the Provider.

### 2. Image Optimization Utility (`apps/server/src/utils/sharp.ts`)
*   Processes uploads on-the-fly: converts to WebP, resizes to a max width of 1200px, compresses, and saves locally in a public assets directory.

### 3. Alerts & Digests (Resend + Telegram Bot)
*   **Telegram Alert**: Instant messaging to Condo Moderators when new assignments or flags are raised.
*   **Daily Digest**: Optional cron task sending emails to moderators summarizing pending tasks.

---

## Verification & Testing Plan

For detailed testing guidelines, edge cases, and role permission scenarios across all testing layers, refer to the full [Test Coverage Plan](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/test_coverage_plan.md).

### 1. Automated Unit & Integration Tests (Vitest)
*   **Unit Tests**: Validate mathematical CPF verification logic, input formatting masks, and frontend aspect ratio constraints.
*   **Integration Tests**:
    *   Verify Drizzle repository query/command adapters.
    *   Verify tRPC route guards and role-based policies.
    *   Verify AbacatePay webhook signature decryption and payment state transitions.

### 2. Manual End-to-End Verification
*   Utilize local PostgreSQL instance and MinIO container.
*   Validate complete user flow: registration (CPF validation) $\rightarrow$ condo onboarding request $\rightarrow$ mock admin approval $\rightarrow$ create announcement $\rightarrow$ mock payment callback validation $\rightarrow$ verify appearance on vitrine.
