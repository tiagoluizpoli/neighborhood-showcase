# Improvements & Fixes Grilling Session Log

This log tracks all questions, answers, and decisions resolved during the planning phase for the improvements and bug fixes.

## Resolved Decisions

### Question 1: Payment Generation Guards for Non-Draft/Non-Expired Announcements
*   **Decided**: We will add a guard in the `GeneratePaymentIntent` use case on the backend:
    *   If the announcement status is already `ACTIVE`, throw an error (e.g., `"Este anúncio já está ativo e publicado."`).
    *   If the announcement is `SUSPENDED`, throw an error (e.g., `"Anúncios suspensos não podem receber pagamentos."`).
    *   This prevents duplicate charges and ensures users cannot pay for already active or moderator-suspended posts.

### Question 2: Database Migration Strategy for Dropping the `todo` Table
*   **Decided**: Since the project is at its starting point and has not yet released a v1, we will delete the existing migrations folder and recreate the schema from scratch. We will delete the todo table schema definition, wipe the `packages/db/src/migrations/` directory, and generate a new initial base migration from scratch.

### Question 3: Redirection and Session Expiration for Navigation Links
*   **Decided**: To protect against information disclosure and maintain a friendly user flow:
    *   **Unauthenticated users** navigating directly to `/dashboard/*`, `/moderation`, or `/admin` via URL will be redirected back to the public homepage `/` (Início), where they can sign in voluntarily using the header action.
    *   **Authenticated users** attempting to access routes above their privilege level (e.g. a standard provider accessing `/admin` or `/moderation`) will be redirected to `/dashboard` (Painel) and shown a generic *"Página não encontrada"* (Page Not Found) notification, treating the page as non-existent for their security level.

### Question 4: Theme Adaptation in the Simplified Styling
*   **Decided**: Keep the `ThemeProvider` and support both Light and Dark modes. By using semantic classes (`bg-background`, `text-foreground`, `border`), the interface will adapt automatically to whichever theme is chosen by the visitor/provider.

### Question 5: DDD Domain Entity Classes and Base Entity Structure
*   **Decided**: We will implement a refined abstract inheritance structure for our domain models:
    *   **Base `Entity<TProps>`**: Created in `apps/server/src/shared/base-entity.ts` containing only `_id`, `_props`, the `.id` getter, and the `.equals()` comparison method.
    *   **`AuditableEntity<TProps>`**: Extends `Entity<TProps>` and adds `_createdAt: Date` and `_updatedAt: Date` properties (with corresponding getters).
    *   Entities like `Condominium` and `Address` (no update time tracking in DB) will extend `Entity` directly.
    *   Entities like `Announcement`, `Assignment`, and `Payment` will extend `AuditableEntity`.
    *   Domain invariants, state transitions, and parameters validation will be self-contained within each entity class.

### Question 6: Decoupling Validators (tRPC Errors) and Concrete Mapper Locations
*   **Decided**:
    *   **Domain Errors**: We will create a shared `DomainError` base class (extending native `Error`) in `apps/server/src/shared/domain-error.ts`. Entities will throw custom domain exceptions (e.g., `InvalidCEPError`) instead of framework-specific `TRPCError` exceptions. tRPC middleware/formatters will map standard domain error classes into standard bad-request tRPC errors before formatting responses.
    *   **Mapper Locality & Multi-Layer Mapping**:
        *   **Infrastructure Layer**: Concrete database `EntityMapper` classes will reside under `apps/server/src/infrastructure/db/mappers/` and map between Drizzle database rows and domain entity instances, keeping the domain isolated from persistence schemas.
        *   **Presentation Layer**: The tRPC router validates incoming payloads using Zod and maps them directly to Domain Entity instances before calling the use cases. Outgoing domain entities are serialized back into plain DTO objects (via a `.toJSON()` instance method or presentation presenter) for network transport.

## Active Questions

*None - All initial planning questions have been processed!*

## Upcoming Questions

*None - All initial planning questions have been processed!*
