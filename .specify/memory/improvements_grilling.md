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

## Active Questions

*None – all currently identified questions have been answered.*

## Upcoming Questions

*None – will add more as they arise.*
