# Improvements & Fixes Grilling Session Log

This log tracks all questions, answers, and decisions resolved during the planning phase for the improvements and bug fixes.

## Resolved Decisions

### Question 1: Payment Generation Guards for Non-Draft/Non-Expired Announcements
* **Decided**: We will add a guard in the `GeneratePaymentIntent` use case on the backend:
    * If the announcement status is already `ACTIVE`, throw an error (e.g., "Este anúncio já está ativo e publicado.").
    * If the announcement is `SUSPENDED`, throw an error (e.g., "Anúncios suspensos não podem receber pagamentos.").
    * This prevents duplicate charges and ensures users cannot pay for already active or moderator‑suspended posts.

### Question 2: Database Migration Strategy for Dropping the `todo` Table
* **Decided**: Since the project is at its starting point and has not yet released a v1, we will delete the existing migrations folder and recreate the schema from scratch. We will delete the todo table schema definition, wipe the `packages/db/src/migrations/` directory, and generate a new initial base migration from scratch.

### Question 3: Redirection and Session Expiration for Navigation Links
* **Decided**: To protect against information disclosure and maintain a friendly user flow:
    * **Unauthenticated users** navigating directly to `/dashboard/*`, `/moderation`, or `/admin` via URL will be redirected back to the public homepage `/` (Início), where they can sign in voluntarily using the header action.
    * **Authenticated users** attempting to access routes above their privilege level (e.g. a standard provider accessing `/admin` or `/moderation`) will be redirected to `/dashboard` (Painel) and shown a generic *"Página não encontrada"* (Page Not Found) notification, treating the page as non‑existent for their security level.

### Question 4: Theme Adaptation in the Simplified Styling
* **Decided**: Keep the `ThemeProvider` and support both Light and Dark modes. By using semantic classes (`bg-background`, `text-foreground`, `border`), the interface will adapt automatically to whichever theme is chosen by the visitor/provider.

### Question 5: DDD Domain Entity Classes and Base Entity Structure
* **Decided**: We will implement a refined abstract inheritance structure for our domain models:
    * **Base `Entity<TProps>`**: Created in `apps/server/src/shared/base-entity.ts` containing only `_id`, `_props`, the `.id` getter, and the `.equals()` comparison method.
    * **`AuditableEntity<TProps>`**: Extends `Entity<TProps>` and adds `_createdAt: Date` and `_updatedAt: Date` properties (with corresponding getters).
    * Entities like `Condominium` and `Address` (no update time tracking in DB) will extend `Entity` directly.
    * Entities like `Announcement`, `Assignment`, and `Payment` will extend `AuditableEntity`.
    * Domain invariants, state transitions, and parameters validation will be self‑contained within each entity class.

### Question 6: Decoupling Validators (tRPC Errors) and Concrete Mapper Locations
* **Decided**:
    * **Domain Errors**: We will create a shared `DomainError` base class (extending native `Error`) in `apps/server/src/shared/domain-error.ts`. Entities will throw custom domain exceptions (e.g., `InvalidCEPError`) instead of framework‑specific `TRPCError` exceptions. tRPC middleware/formatters will map standard domain error classes into standard bad‑request tRPC errors before formatting responses.
    * **Mapper Locality & Multi‑Layer Mapping**:
        * **Infrastructure Layer**: Concrete database `EntityMapper` classes will reside under `apps/server/src/infrastructure/db/mappers/` and map between Drizzle database rows and domain entity instances, keeping the domain isolated from persistence schemas.
        * **Presentation Layer**: The tRPC router validates incoming payloads using Zod and maps them directly to Domain Entity instances before calling the use cases. Outgoing domain entities are serialized back into plain DTO objects (via a `.toJSON()` instance method or presentation presenter) for network transport.

### Question 7: Payment guard UI for ACTIVE
**Description**: UI should show a toast error message and keep the user on the same page when payment is blocked because the announcement is ACTIVE.
**Answer**: Show a toast error and stay on the same page.

### Question 8: Payment guard UI for SUSPENDED
**Description**: UI should show a distinct toast error indicating suspension and suggest contacting support when payment is blocked because the announcement is SUSPENDED.
**Answer**: Show a distinct toast error with a support suggestion.

### Question 9: tRPC error identifiers
**Description**: Use distinct identifiers for each blocked state.
**Answer**: Use `ANNOUNCEMENT_ALREADY_ACTIVE`, `ANNOUNCEMENT_SUSPENDED`, and `ANNOUNCEMENT_EXPIRED`.

### Question 10: Legacy Todo cleanup
**Description**: Confirmation that no additional files remain to be deleted.
**Answer**: No additional files discovered; the existing list is complete.

### Question 11: Styling refactor
**Description**: Adopt full shadcn design tokens across the UI.
**Answer**: Fully adopt shadcn design tokens.

### Question 12: Moderação link visibility
**Description**: Show the "Moderação" link only for users with a MODERATOR assignment.
**Answer**: Only users with a MODERATOR assignment see the link.

### Question 13: ADR for payment error handling
**Description**: Create an ADR documenting the trade‑offs for payment error handling.
**Answer**: An ADR will be created.

### Question 14: Announcement states not yet covered
**Description**: You indicated uncertainty about any additional announcement states (e.g., EXPIRED, ARCHIVED). Which states, if any, require special UI or backend handling beyond those already defined (`DRAFT`, `ACTIVE`, `SUSPENDED`, `EXPIRED`)?
**Answer**: No additional states; the current list is sufficient.

### Question 15: Feature Flagging for New Functionalities
**Description**: As you expand the platform, you may need to toggle new features on/off per environment or user group. Do you want to implement a feature flag system?
**Answer**: Adopt Unleash for feature flagging to support learning and alignment with the user's work.

### Question 16: Internationalization (i18n) Strategy
**Description**: As the platform grows, you may need to support multiple languages. Which approach would you prefer for handling i18n?
**Answer**: Use a lightweight i18n library (e.g., react-i18next) with translation JSON files for each locale. We will support both English (en) and Portuguese (pt), ensuring all user-facing strings are stored in translation files instead of being hardcoded in code.

### Question 17: Double-Visualization — Dedup Strategy or Eliminate Duplicate Trigger?
**Description**: Clicking an announcement registers two IMPRESSION events because tracking fires from two code paths: `openAdDetails()` in `index.tsx` (card click, modal-only) and a `useEffect` in `anuncios.$id.tsx` (data load, covers modal + direct URL). React.StrictMode also double-fires the effect in dev.
**Answer**: Eliminate the redundant trigger (Option B). Remove the `trackEvent` call from `openAdDetails()` in `index.tsx` since it only covers the modal path. Keep the `useEffect` in `anuncios.$id.tsx` as the **single source of truth** for impressions (covers both modal and direct URL navigation). Add a `useRef` guard inside the effect to prevent StrictMode double-fires. This is simpler than adding dedup infrastructure and follows single-responsibility.

### Question 18: Double-Visualization — Dedup Scope (Module vs SessionStorage)
**Description**: After eliminating the redundant trigger (Q17), we need a guard against `React.StrictMode` double-firing the `useEffect`. Options were: `useRef` only, module-level `Set`, or `sessionStorage`.
**Answer**: `useRef` guard only (Option A). A `useRef(false)` inside the `useEffect` prevents the StrictMode double-fire while preserving correct analytics semantics. Re-visits should count as new impressions (industry standard behavior matching Google Analytics, Meta Pixel, etc.). Adding a `Set` or `sessionStorage` would artificially deflate metrics.

### Question 19: Shared Unleash Package — Extract or Keep Inline?
**Description**: Unleash integration is scattered across `apps/server/src/shared/feature-flags.ts`, `apps/web/src/routes/__root.tsx`, and `packages/env/`. No actual feature flags are consumed anywhere yet.
**Answer**: Extract now into `packages/feature-flags` (Option B). Create a shared workspace package containing server-side init/check helpers, client-side config factory, typed flag name constants, and shared env schema references. Establishes the pattern cleanly before it gets harder to refactor later.

### Question 20: Shared Unleash Package — Typed Flag Names
**Description**: Since we're extracting into `packages/feature-flags` (Q19), should we pre-define a typed flag name registry (`FLAGS` const map + `FlagName` type)?
**Answer**: Define the registry shape but leave it empty (Option B). Create the `FLAGS` const map and the `FlagName` type with zero entries. The type system enforces the pattern when the first flag is added — you can't pass an arbitrary string, you must add it to the registry first. No placeholder names cluttering the codebase.

### Question 21: Docker Compose — Relocate to Project Root?
**Description**: The sole `docker-compose.yml` lives at `packages/db/`. If we add Unleash + Redis, it outgrows its `db` package scope.
**Answer**: Move to project root (Option A). Relocate `packages/db/docker-compose.yml` to the project root. Update `packages/db/package.json` scripts (`db:start`, `db:stop`, `db:down`) to reference `../../docker-compose.yml`. All infrastructure in one place. Root-level `docker compose up` starts everything.

### Question 22: Docker Compose — Add Unleash + Redis Containers?
**Description**: Should we add Unleash server and Redis containers to the root docker-compose for local development?
**Answer**: Add Unleash + Redis containers now (Option A). Add `unleash-server` (official Docker image, uses the existing Postgres instance with a separate DB) and `redis` to the root compose. Wire `.env.template` defaults to point at these local containers. The dev environment becomes fully self-contained — `docker compose up` gives you everything.

### Question 23: PG Enum Migration — All at Once or Incremental?
**Description**: 11 text-enum columns across 6 tables, zero `pgEnum` definitions exist. Project is pre-v1.
**Answer**: Single batch — all 11 columns at once (Option A). Destructive schema regeneration (delete migrations, `db:generate` fresh). All `text({ enum })` columns become `pgEnum` in one pass. One task, one commit, one migration reset. Mechanical, low-risk transformation with no production data at stake.

### Question 24: PG Enum Migration — Shared Enum Types Across Tables?
**Description**: Some enum values overlap between tables (e.g., `PENDING/APPROVED/REJECTED` used by `assignment.status`, `providerLocation.status`, `condominium.status`). Should they share a single `pgEnum` or be independent?
**Answer**: Independent enums per table (Option A). Each table gets its own `pgEnum`: `userRoleEnum`, `userStatusEnum`, `condominiumStatusEnum`, `providerLocationTypeEnum`, `providerLocationStatusEnum`, `assignmentTypeEnum`, `assignmentStatusEnum`, `announcementStatusEnum`, `paymentStatusEnum`, `analyticsEventTypeEnum`, `analyticsTargetTypeEnum`. DDD-correct approach — each bounded context owns its vocabulary and can evolve independently.

### Question 25: Entity Function Encapsulation — Static Methods vs Private
**Description**: Standalone exported validation functions (`validateAnnouncement`, `validateUnitInfo`, `validateCondominiumName`, `validateCEP`, `validateContactInfo`) exist outside their entity classes. Should they become `private static` or `public static` methods on the class?
**Answer**: `private static` — fully hidden (Option A). Move functions inside the class as `private static` methods. No external code uses them. Maximum encapsulation, enforces that validation lives in the domain only. If the presentation layer needs validation, it goes through the entity constructor.

### Question 26: Entity Function Encapsulation — CPF Re-export
**Description**: `cpf.entity.ts` is a 2-line barrel re-export of `{ hashCPF, isValidCPF }` from `@neighborhood-showcase/auth/utils/cpf`. It's not a class or entity — it lives in `entities/` by convention only.
**Answer**: Delete it — import directly from `@neighborhood-showcase/auth` (Option B). Remove the file and update all consumers to import `{ hashCPF, isValidCPF }` directly from `@neighborhood-showcase/auth/utils/cpf`. The domain `entities/` folder should only contain actual domain entities.

## Active Questions

*None — all 26 questions have been answered.*

## Upcoming Questions

*None — grilling session complete.*

