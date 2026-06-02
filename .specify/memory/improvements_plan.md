# Improvements & Bug Fixes Implementation Plan

This plan details the task breakdown and verification steps for implementing the resolved improvements.

---

## Task 1: Draft Announcement Publish/Payment Button (Item 1)
*   **Objective**: Allow providers to publish drafts via Pix payment and block duplicate payment attempts on the backend.
*   **Tasks**:
    1.  **Frontend Card Update**: In `apps/web/src/routes/dashboard.index.tsx`, modify `AnnouncementCard` so that `DRAFT` status cards render a `"Publicar Anúncio"` button leading to `onPay` (redirecting to `/dashboard/anuncios/:id/pagamento`).
    2.  **Backend Guards**: Update `apps/server/src/application/use-cases/payment/generate-payment-intent.ts`:
        *   Assert the announcement is not already `ACTIVE` (throw a `TRPCError` with code `BAD_REQUEST`).
        *   Assert the announcement is not `SUSPENDED` (throw a `TRPCError` with code `BAD_REQUEST`).
    3.  **Verification**: Verify that clicking `"Publicar Anúncio"` on a draft card correctly opens the payment paywall screen, and check that trying to call the payment mutation on active posts returns a tRPC error.

---

## Task 2: Purge the Legacy Todo Code (Item 2)
*   **Objective**: Clean out all remnants of the boilerplate Todo feature.
*   **Tasks**:
    1.  **Delete Files**: Delete the backend folders `use-cases/todo`, `domain/use-cases/todo`, and files `todo.entity.ts`, `todo.repository.ts`, `todo-repository.ts`, `presentation/routers/todo.ts`, `packages/db/src/schema/todo.ts`, and the frontend route `todos.tsx`.
    2.  **Update References**: Clean up `packages/db/src/schema/index.ts`, `apps/server/src/presentation/routers/index.ts`, `apps/web/src/components/header.tsx`, and `agents.local.md` to remove imports, exports, and guide references to Todos.
    3.  **Database Migration Reset**: 
        *   Delete the directory `packages/db/src/migrations/`.
        *   Run `bun run db:generate` to generate a fresh, clean base SQL schema migration that excludes the `todo` table.
    4.  **Verification**: Run the test suite and build verification script to ensure there are no compilation errors or residual imports.

---

## Task 3: Sync Legacies and Simplify Layout Styling (Item 3)
*   **Objective**: Clean up legacy project names and restore simple, standard shadcn layout/spacing colors.
*   **Tasks**:
    1.  **Name Refactor**: Rename `base-fullstack-template` to `neighborhood-showcase` in `index.html`, `__root.tsx`, `vite.config.ts`, `tsdown.config.ts`, and `packages/db/docker-compose.yml` (including container and volume names).
    2.  **Styling Simplification**:
        *   In `dashboard.tsx`, replace the dark-only `bg-slate-950 text-slate-100` wrapping div with `bg-background text-foreground flex flex-col min-h-screen` to support system-wide themes.
        *   Remove hardcoded custom slate backgrounds, radial gradient overlays, custom hover scale translations, and custom shadow offsets in `dashboard.index.tsx`, `dashboard.condo-setup.tsx`, `dashboard.anuncios.novo.tsx`, `dashboard.anuncios.$id.pagamento.tsx`, `auth.tsx`, `sign-in-form.tsx`, and `sign-up-form.tsx`.
        *   Ensure views use default shadcn `Card` headers, border colors (`border`), text colors (`text-foreground` / `text-muted-foreground`), and default padding coordinates (`p-4` / `p-6`).

---

## Task 4: Secure, Permission-Based Navigation Layout & Localization (Item 4)
*   **Objective**: Localize the navbar to pt-BR, secure route guard redirects, and hide menu actions based on logged-in permissions.
*   **Tasks**:
    1.  **Navbar UI & Localization**:
        *   Translate navigation and dropdown menu actions in `header.tsx` and `user-menu.tsx` to Portuguese (`Início`, `Painel`, `Moderação`, `Administração`, `Minha Conta`, `Sair`, `Entrar`).
        *   Place account settings and sign-in actions on the right side of the header alongside the theme toggle.
    2.  **Permission-Based Links**:
        *   Hide the `"Painel"` link unless the user is authenticated.
        *   Show `"Moderação"` only if the user has an approved `MODERATOR` assignment in their session assignments list.
        *   Show `"Administração"` only if the user has a `SYSTEM_MANAGER` global role.
    3.  **Strict URL Route Guards**:
        *   In route `beforeLoad` handlers for `/dashboard/*`, `/moderation`, and `/admin`:
            *   If the user is **unauthenticated**, redirect them to the home page `/` (Início).
            *   If an **authenticated** user attempts to access `/admin` or `/moderation` without the correct role or assignment, redirect them to `/dashboard` (Painel) and display a generic *"Página não encontrada"* message.
    4.  **Verification**: Test route accessibility for visitors, standard providers, moderators, and global admins.

---

## Task 5: Domain Entity Refactoring & Mapping (Item 5)
*   **Objective**: Migrate plain interfaces to encapsulated domain classes inheriting from a custom `Entity` structure and decouple repository schemas.
*   **Tasks**:
    1.  **Create Core Base Primitives**:
        *   Create `apps/server/src/shared/base-entity.ts` containing the abstract `Entity<TProps>` (managing ID and equals check) and `AuditableEntity<TProps>` (extending `Entity` and enforcing `createdAt`/`updatedAt` dates).
        *   Create `apps/server/src/shared/domain-error.ts` containing the base `DomainError` class extending native `Error`.
    2.  **Migrate Domain Entities**:
        *   Refactor `condominium.entity.ts`, `announcement.entity.ts`, `assignment.entity.ts`, and `payment.entity.ts` under `apps/server/src/domain/entities/` into class definitions extending `Entity` or `AuditableEntity`.
        *   Encapsulate properties with read-only getters and move validation logic directly into entity constructor checks, throwing custom `DomainError` subclasses (e.g. `InvalidCEPError`) instead of `TRPCError`.
    3.  **Implement Mappers**:
        *   Create a generic `EntityMapper<SchemaRow, DomainEntity, InsertRow>` interface in `apps/server/src/domain/mapper.ts`.
        *   Implement concrete mapper utilities in the database infrastructure layer: `condominium.mapper.ts`, `announcement.mapper.ts`, `assignment.mapper.ts`, and `payment.mapper.ts` inside `apps/server/src/infrastructure/db/mappers/`.
    4.  **Refactor Repository Adapters**:
        *   Update repository classes under `apps/server/src/infrastructure/db/` to consume their corresponding database mappers, mapping database query result rows into domain entity class instances before returning them to use cases, and mapping entities back to Drizzle formats for persistence.
    5.  **Configure global tRPC Error Formatting**:
        *   Modify the server setup/context/router configuration to capture caught `DomainError` exceptions and format them into bad-request `TRPCError` instances, decoupling the domain logic from the delivery mechanism.
    6.  **Verification**: Confirm the test suite compiles and succeeds, ensuring database rows do not leak beyond persistence boundaries and entities validate their invariants correctly.
