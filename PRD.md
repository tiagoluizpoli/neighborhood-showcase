# Product Requirement Document (PRD) — Neighborhood Showcase

This PRD defines the core scope, user stories, implementation decisions, and test criteria for the Neighborhood Showcase platform.

---

## Problem Statement

Condominium residents and local service providers struggle to discover and safely interact with neighborhood businesses. WhatsApp groups are chaotic, lack search functionality, and have no historical permanence. Providers cannot track whether their listings generate interest, and residents are exposed to potential scams from unverified entities claiming to live in the building.

---

## Solution

A mobile-first, geolocation-driven showcase application for local businesses and services. 
- **For Visitors**: Easily discover verified nearby services sorted by distance, with the ability to filter by category or select specific condominiums.
- **For Providers**: Publish service posts with mandatory 4:3 cropped images, verify their residency status to gain a "Verified Resident" trust badge, and track ad views and clicks.
- **For Condo Moderators**: Review and approve residents based on private proof documents to maintain trust, and suspend violating ads.
- **For System Managers**: Approve new condominium registrations and globally ban abusive users via a secure CPF blacklist database.

---

## User Stories

### Visitor Stories
1. As a visitor, I want the system to request my location, so that I can automatically view services and products offered closest to me.
2. As a visitor who denies location access, I want to manually choose my city and condominium, so that I can browse relevant listings.
3. As a visitor, I want to search announcements by text or tags, so that I can find specific services (e.g., "cake", "plumber") quickly.
4. As a visitor, I want to filter announcements by category, so that I can explore all local food, home services, or lesson offerings separately.
5. As a visitor, I want to toggle a "Verified Residents Only" filter, so that I can support actual neighbors instead of external businesses.
6. As a visitor, I want to click an announcement to view full details (like rich descriptions and multiple contact options) in a mobile drawer (or desktop modal), so that I can decide if I want to hire them.
7. As a visitor, I want to copy/share direct links to specific announcements, so that I can recommend local providers to others.
8. As a visitor, I want to click contact buttons (WhatsApp/Instagram/PDF catalogs), so that I am seamlessly directed to external channels while the system registers interaction metrics securely.

### Provider Stories
9. As a provider, I want to register an account with my CPF, so that the system can validate my identity and ensure I am not blacklisted.
10. As a provider, I want to register a public "Trading Name" (Nome Fantasia) separately from my legal name, so that I can protect my privacy on public listings.
11. As a provider, I want to be blocked from creating announcements until I complete my profile setup flow (either linking my profile to a condominium or registering an external address), so that my posts are never orphan or out of scope.
12. As a provider, I want to request to join an existing condominium by inputting my unit info and uploading proof of residency, so that the condominium moderator can verify my resident status.
13. As a provider who represents a condominium (Síndico), I want to request to create a new condominium by uploading my election minutes (Ata), so that I can serve as the moderator once approved.
14. As a provider, I want to create a service listing with a mandatory cover image cropped to 4:3, so that my post is visual and fits cleanly into the showcase grids.
15. As a provider, I want to upload an optional PDF catalog/menu for my listing, so that visitors can view my full offerings.
16. As a provider, I want to toggle my "Verified Resident" badge on my active listings, so that I can gain higher consumer trust.
17. As a provider, I want to pay a R$ 2,00 fee via Pix (powered by AbacatePay QR Code and Copy/Paste) to publish my listing, so that it becomes active for 30 days.
18. As a provider, I want to view my dashboard metrics (views, contact clicks, conversion rate), so that I can measure the effectiveness of my listings.
19. As a provider, I want to edit active listings, so that my changes go live immediately while automatically flagging the ad for moderator re-review.
20. As a provider, I want to renew expired listings by initiating a new Pix payment flow, so that my ad goes back online.
21. As a provider, I want to permanently delete my account and purge all my personal data (LGPD), so that only anonymized financial logs are kept.

### Condo Moderator Stories
22. As a condo moderator, I want to switch my dashboard view if I manage multiple condominiums, so that I can moderate each context in isolation.
23. As a condo moderator, I want to securely inspect pending resident requests, so that I can view their legal name, unit number, and proof of residency files.
24. As a condo moderator, I want to approve or reject resident requests with a reason, so that applicants are kept informed of their status.
25. As a condo moderator, I want to review all active ads associated with my condo and suspend violating listings with a reason, so that my community guidelines are enforced.

### System Manager Stories
26. As a system manager, I want to approve or reject requests to create new condominiums, so that only authenticated and valid communities are listed.
27. As a system manager, I want to manage a global CPF blacklist, so that banned users are locked out from ever registering again.
28. As a system manager, I want to search and ban violating providers, so that all their active listings are immediately expunged.

### Refactoring & Improvement Stories
29. As a provider, I want to see a "Publicar Anúncio" action button on my draft announcements, so that I can initiate the payment checkout flow directly.
30. As a visitor or user, I want the web application's page title and metadata to display "Neighborhood Showcase", so that I know what platform I am visiting.
31. As a logged-in provider, I want the header navigation menu to show "Painel" only when I am signed in, so that I can access my settings securely.
32. As a condominium moderator, I want to see the "Moderação" link in the header menu only if my moderator assignment is approved, so that I can access my moderation panel.
33. As a system manager, I want to see the "Administração" link in the header menu only if I have the admin role, so that I can access global settings.
34. As a user, I want direct URL access to protected routes (e.g. `/admin`) to redirect me to `/` (Início) if unauthenticated, or to `/dashboard` (Painel) with a generic page not found state if authenticated, so that unauthorized layout pages are kept hidden for safety.
35. As a developer, I want to manage feature toggles using Unleash, so that I can easily toggle new functionalities on/off per environment.
36. As a user (English or Portuguese speaker), I want the application's interface to be available in both English and Portuguese, so that I can browse and interact in my preferred language.
37. As a developer, I want all user-facing copy to be decoupled from the code and stored in translation JSON files, so that I can maintain translations without editing components directly.

---

## Implementation Decisions

### Modules & Architecture
- **Monorepo Separation**: 
  - `packages/db` contains Drizzle schemas, migrations, and database connections.
  - `apps/server` (Fastify + tRPC) handles authentication (Better-Auth), API handlers, webhook routes, and email routing (Resend).
  - `apps/web` (Vite + React + TanStack Router) handles mobile-first frontend interfaces and local storage configurations.
- **Clean Architecture Core**: Core domain logic, state machines, and use cases reside inside domain entities (e.g. `Announcement.ts`) in `apps/server/src/features/`. Infrastructure layers (Drizzle adapters, external S3 storage) implement agnostic repository ports.
- **Security Gates**: All API endpoints querying Full Legal Names, CPFs, Unit IDs, and proof files are guarded by backend tRPC middleware ensuring the caller has a verified global `SYSTEM_MANAGER` role or is the approved `MODERATOR` of that specific condominium.

### Schema Decisions
- **CPF Hashing**: CPFs are validated mathematically, then computed to `sha256(cpf)` before queries or storage in `users.cpfHash` and `blacklisted_identifiers.cpfHash`. Raw CPFs are never persisted in the database.
- **Image Constraints**: Cover image paths are mandatory (`imageUrl` column is `NOT NULL`). Server-side sharpness processing converts images to WebP format, resizes to a fixed `800x600px` (4:3 aspect ratio), and saves them to S3 compatible storage (MinIO).

### Payment Workflow
- Integrates AbacatePay API. Checkouts initiate a dynamic `POST` to AbacatePay. Webhook requests arrive at Fastify raw router `POST /api/webhooks/abacatepay`, verifying signature headers before transitioning announcements to `ACTIVE` and updating expiration dates.

### Improvements & Refactoring Decisions
- **Draft Publication Flow**: Expose a button on the provider panel for `DRAFT` announcements that redirects to the Pix paywall checkout route `/dashboard/anuncios/:id/pagamento`.
- **Backend Status Verification**: Add status verification guards to `GeneratePaymentIntent` preventing duplicate Pix checkout QR codes for `ACTIVE` or `SUSPENDED` announcements.
- **Todo Cleanup**: Delete all files and exports related to the legacy Todo feature, purge the migration files, and regenerate the base schema initial migration from scratch.
- **Layout and Styling Standardization**: Replace custom dark slate styles and radial background gradients with default shadcn themes and spacing/padding utilities. Change metadata name variables and docker configurations to use the `neighborhood-showcase` namespace.
- **Dynamic Permission-Based Navigation**: Render header menus (Início, Painel, Moderação, Administração) dynamically based on auth session and assignment checks. Group user menu options on the right side of the navbar.
- **URL Access Route Guards**: Unauthenticated users trying to access protected paths directly will be redirected to `/`. Authenticated users attempting to access routes above their permissions will be redirected to `/dashboard` and shown a generic page not found layout.
- **Unleash Feature Flagging**: Implement the Unleash SDK on the server and client to toggle features on and off dynamically based on user environment or toggle status.
- **Internationalization (i18n)**: Fully localize the client to both English (`en`) and Portuguese (`pt`). Implement `react-i18next` with JSON files. All user-facing labels, headings, error messages, and descriptions must be loaded through translation files; inline hardcoded strings are prohibited.
- **DDD Entity Classes & Domain Error Decoupling**: Create the base `Entity` and `AuditableEntity` primitives under `apps/server/src/shared/base-entity.ts`. Decouple tRPC errors from the domain by throwing custom domain-specific `DomainError` subclasses, and map them using middleware to standard tRPC router codes.
- **Concrete Db Mapper Isolation**: Concrete database `EntityMapper` classes will reside under `apps/server/src/infrastructure/db/mappers/` and map between Drizzle database rows and domain entity instances, keeping the domain isolated from persistence schemas.
- **ADR for Payment Error Handling**: Document the trade-offs, retry rules, and error handling designs for the AbacatePay integration in a dedicated Architectural Decision Record (ADR).


---

## Testing Decisions

- **Black-Box Testing Priority**: Test external behaviors (domain logic output, API contracts, route protections, and database state transitions) rather than private implementation details.
- **Unit Testing**: Validate CPF mathematical checking algorithms, image crop validators, and announcement state machine expiration calculations.
- **Integration Testing**: Execute tests against a real test PostgreSQL instance and a local MinIO bucket to verify repository adapters, authorization middleware, and webhook signatures.
- **End-to-End Testing**: Test entire user journeys (registration $\rightarrow$ block setup $\rightarrow$ checkout redirect $\rightarrow$ webhook payment $\rightarrow$ showcase listing) in a simulated browser state.
- **Refactoring & Guard Testing**:
  - Test that the backend `GeneratePaymentIntent` use case rejects requests with appropriate tRPC errors if the announcement is already `ACTIVE` or `SUSPENDED`.
  - Test that all routes correctly apply the dynamic permission route guards (redirecting unauthenticated users to `/`, and redirecting unauthorized users to `/dashboard` while rendering a generic not found state).
  - Verify that the test suite compiles with no references to the legacy Todo feature.

---

## Out of Scope

- Native iOS/Android apps (strictly mobile browser Web App for initial release).
- Alternative payment gateways (AbacatePay is the sole payment handler).
- Complex messaging chats between users (contact redirects straight to WhatsApp/Instagram).
- Automatic text translation.

---

## Further Notes

- LGPD Compliance: Account deletions trigger a soft-delete/PII scrub of `Users.name`, `Users.email`, and `Users.phone`, leaving only anonymized financial transactions for legal audit purposes.

---

## Planning & Verification Reference

The following planning, specification, and test verification documents located in `.specify/memory/` must be followed:

### Core Documents
- [Implementation Plan](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/plan.md)
- [Test Coverage Plan](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/test_coverage_plan.md)
- [Project Constitution](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/constitution.md)
- [Grill Session Log](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/grill_session.md)
- [Architecture Grilling Log](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/architecture_grilling.md)
- [Screen Grilling Log](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/screen_grilling.md)
- [Improvements Implementation Plan](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/improvements_plan.md)
- [Improvements Grilling Log](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/improvements_grilling.md)


### Diagrams
- [Database ERD](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/diagrams/database-erd.md)
- [Onboarding Flowchart](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/diagrams/onboarding-flow.md)
- [Announcement Lifecycle State Machine](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/diagrams/announcement-lifecycle.md)
- [Payment & Webhook Sequence Diagram](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/diagrams/payment-sequence.md)

### Actionable Work Items (Issues)
- [01 Auth & CPF Validation](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/01_auth_cpf_validation.md)
- [02 Condo Creation (Síndico)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/02_condo_creation_sindico.md)
- [03 Condo Joining (Resident)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/03_condo_joining_resident.md)
- [04 Condo Approval (Admin)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/04_condo_approval_admin.md)
- [05 Resident Approval (Moderator)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/05_resident_approval_moderator.md)
- [06 Announcement Draft Creation](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/06_announcement_draft_creation.md)
- [07 Payment Intent (Pix)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/07_payment_intent_pix.md)
- [08 Webhook Payment Resolution](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/08_webhook_payment_resolution.md)
- [09 Public Showcase & Discovery](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/09_public_showcase_discovery.md)
- [10 Provider Dashboard & LGPD](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/10_provider_dashboard_lgpd.md)
- [11 Moderator Suspension & Admin Blacklist](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/11_moderator_suspension_admin_blacklist.md)
- [12 DB Migration for Address & Location Assignment](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/12_db_migration_address_location.md)
- [13 Onboarding Setup Flow Refactoring](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/13_onboarding_setup_flow_external.md)
- [14 Announcement Creation & Editing Refactoring](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/14_announcement_creation_auto_link.md)
- [15 Public Showcase & Proximity Refactor](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/15_public_showcase_proximity_refactor.md)
- [16 Project Rename to Neighborhood Showcase](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/16_rename_project_references.md)
- [17 Draft Announcement Publish Button](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/17_draft_announcement_publish_button.md)
- [18 Purge Legacy Todo Code](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/18_purge_legacy_todo_code.md)
- [19 Legacy Sync & Styling Simplification](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/19_styling_simplification.md)
- [20 Secure Permission-Based Navigation & Localization](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/20_permission_navigation_localization.md)
- [21 Fix Infinite Payment Tracking Loop](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/21_fix_infinite_payment_tracking_loop.md)
- [22 DDD Domain Entity Class Refactoring](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/22_ddd_domain_entity_class_refactoring.md)
- [23 Unleash Feature Flagging](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/23_unleash_feature_flagging.md)
- [24 i18n Localization (English & Portuguese)](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/24_i18n_localization_en_pt.md)
- [25 Payment Error Handling ADR](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/25_payment_error_handling_adr.md)



