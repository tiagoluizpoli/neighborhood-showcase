# Neighborhood Showcase Grilling Session Log

This log tracks all questions, answers, and design choices resolved during the planning phase.

## Resolved Decisions

### Question 1: Domain Mapping of Users, Residents, and Providers
*   **Decided**: 
    *   Since visitors browse publicly and do not need to sign in, every registered user account in the system is a **Provider** (or Moderator/Admin).
    *   We don't need a separate "User" vs "Resident" model; the Provider is the base user account.
    *   A Provider can hold one or more **Assignments** to represent different relationships with condominiums or the neighborhood.

### Question 2: Relationship between Announcements and Products/Services
*   **Decided**:
    *   Strict 1-to-1 relationship between an Announcement and its flyer banner content. The application does not manage a reusable "Product Catalog".
    *   A Provider creates an Announcement directly, indicating its type (Service, Product, or Donation) and optional value.
    *   For multi-product showcases, Providers utilize a PDF link (menu/catalog) or external link (Instagram/Facebook) inside a single general Announcement.

### Question 3: Announcement Creation and Moderation Workflow
*   **Decided**:
    *   **Self-Service**: Providers register themselves and create their own Announcements.
    *   **Paywall**: Providers must pay a publication fee to set the Announcement to live.

### Question 4: Payment Integration
*   **Decided**:
    *   **Automated Pix**: Dynamic Pix QR code integration using **AbacatePay**.
    *   Payments are verified via HMAC-SHA256 signature webhooks, which automatically set the Announcement to `Active` and configure `ExpiredAt` (30 days).

### Question 5: Classification (Categories and Tags)
*   **Decided**:
    *   **Predefined Categories**: Clean navigation categories managed by the system.
    *   **Dynamic Tags**: Free-text keywords entered by the Provider on creation.
    *   **Source Filter**: Automatically populated or chosen based on the selected Assignment.

### Question 6: Managing Multiple Roles / Non-duplication of Users
*   **Decided**:
    *   A Provider (user account) can hold multiple **Assignments** (e.g. living in Villa Bella as an internal neighbor, while managing a store outside).
    *   When creating an Announcement, the Provider selects which Assignment it belongs to, prompting them if they have multiple.

### Question 7: Moderator Scope and Target Audience
*   **Decided**:
    *   **Post-Moderation Queue**: Paid Announcements go live immediately, but are added to a Moderator's review list. The Moderator can suspend/delete them if they violate rules.
    *   **Moderator Scope**: Moderators are tied to a specific Condominium. A Moderator can only approve/verify `INTERNAL_NEIGHBOR` Assignments for their own Condominium.
    *   **Neighborhood Providers**: Loose providers (e.g., houses on neighboring streets) register without being tied to a specific condominium.
    *   **Announcement Targeting**: When publishing, a Provider can choose the target audience/visibility:
        *   Only their own Condominium.
        *   Specific neighboring Condominiums.
        *   Public (the whole neighborhood).

---

## Active Questions

### Question 8: Visibility Filters and "Loose" Neighborhood Providers (Simplified for MVP)
*   **Decided**:
    *   **Deferred Complexity**: We will leave the complex `INTERNAL_NEIGHBOR`, `EXTERNAL_NEIGHBOR`, and `LOCAL_COMMERCE` target routing and filters for a future version to ensure a faster MVP launch.
    *   **Simple Self-Registration**: Providers register easily.
    *   **System Managers vs. Condo Moderators**: 
        *   System Managers (global admins) can manage, block, or expel any provider who violates the community code of conduct.
        *   Each Condominium has its own Moderator(s) who only verify the local internal neighbors claiming association with that specific condominium.
    *   **Moderation Focus**: The main moderation effort is localized: Condo Moderators verify who is allowed to be labeled as a verified resident for their specific condo.

### Question 9: Condominium Creation and Discovery
*   **Decided**:
    *   **Controlled Registry**: To prevent duplicate or typo-ridden entries, only System Managers (global admins) can create a new Condominium.
    *   **Provider Discovery**: Providers search from the verified list of Condominiums when adding Assignments.
    *   **Missing Request**: Providers can submit a request to add a new Condominium, which System Managers review and approve/create.

### Question 10: Modifying an Active Announcement
*   **Decided**:
    *   **Payment & Expiration**: Editing an Active Announcement does not require a new payment and does not extend the 30-day publication period. The original `ExpiredAt` remains unchanged.
    *   **Moderation Flow**: Edits go live immediately. However, modifying key fields (title, subtitle, description, value, image, contact links) automatically re-flags the Announcement in the Moderator review queue to prevent misuse.

### Question 11: Announcement Expiration and Renewal Flow
*   **Decided**:
    *   **State Transition**: Expired Announcements are not deleted. They transition to the `Expired` state, hiding them from Visitors while remaining visible to the Provider on their dashboard.
    *   **Renewal**: The Provider can renew an Announcement via a new Pix payment.
    *   **Early Renewal Stacking**: If a renewal payment is completed before expiration, the 30 days stack: `New ExpiredAt = Current ExpiredAt + 30 days`. If it is already expired, the new expiration is `Payment Confirmation Time + 30 days`.

### Question 12: Visitor Contact & Analytics Tracking
*   **Decided**:
    *   **Multiple Contact Methods**: An Announcement can support multiple contact methods. The Provider can configure any combination of:
        *   **WhatsApp**: Direct wa.me link.
        *   **External URL**: Instagram, website, or social page link.
        *   **PDF Download**: Link or file upload for menus, catalogs, or additional info.
    *   **Redirect Tracking**: Contact buttons point to redirect routes (e.g., `/api/announcements/:id/contact?type=whatsapp|external|pdf`) to register the click event before redirecting the Visitor.
    *   **Analytics Dashboard**: The Provider's dashboard displays:
        *   **Impressions**: Total views in listing/showcase pages.
        *   **Interaction Counters**: Breakdown of clicks for each contact type (WhatsApp, External URL, PDF), showing which method performs best.

### Question 13: File & Media Storage (Images and PDF Catalogs)
*   **Decided**:
    *   **Unified Storage Abstraction**: The application will support two storage backends, switchable via environment variables:
        *   **Local Disk Storage**: Uploads saved directly to `public/uploads/` for zero-configuration local development.
        *   **S3-Compatible Storage**: Uploads saved to Cloudflare R2, AWS S3, or MinIO for stateless, serverless-friendly production environments.

### Question 14: Authentication Method and Providers
*   **Decided**:
    *   **Better Auth Engine**: Use Better Auth to power registration and logins.
    *   **Auth Methods**:
        *   **Email & Password**: Primary method for local development and base security.
        *   **Social OAuth (Google/GitHub)**: Configurable optionally in production via environment variables.
    *   **Verification & Reset Emails**: Integrated via a mock/console mailer locally and Resend (or another SMTP client) in production.

### Question 15: Primary Language & Localization
*   **Decided**:
    *   **Portuguese (pt-BR)**: The platform will be built entirely in Portuguese (pt-BR) to match the target audience (Brazilian condominiums) and integrations (Pix/AbacatePay).
    *   **No i18n Translation Overhead**: Copy will be written directly in pt-BR, avoiding translation library overhead for the MVP.

### Question 16: Core Technology Stack
*   **Decided**:
    *   **Template Source**: We will use the `neighborhood-showcase` (Better-T-Stack) as our baseline.
    *   **Frontend**: React + TanStack Router (fully type-safe, file-based routing) + TailwindCSS v4 + next-themes + packages/ui (shadcn/ui primitives).
    *   **Backend & API**: Fastify + tRPC (`@trpc/server`, `@trpc/client`).
    *   **Database**: PostgreSQL + Drizzle ORM.
    *   **Auth**: Better-Auth.
    *   **Runtime & Tooling**: Bun, Turborepo, Biome, Lefthook.

---

### Question 17: Local Webhook testing & AbacatePay integration flow
*   **Decided**:
    *   **Mock Dev Endpoint**: Expose a development-only endpoint/flag when `NODE_ENV === 'development'` to allow developers to simulate Pix payments locally using curl/Postman without signature checks.
    *   **Tunneling Guidelines**: Document in the README how to run tunneling tools like `localtunnel` or `ngrok` for testing the live AbacatePay webhook flow.

---

### Question 18: Notification Mechanisms for Providers
*   **Decided**:
    *   **Transactional Emails (via Resend)**:
        *   **Expiration Warning**: Sent 3 days before expiration with a renew link.
        *   **Expiration Confirmation**: Sent when the Announcement expires.
        *   **Moderator Actions**: Sent when a Moderator suspends or deletes the Announcement, explaining the reason.
    *   **In-App Alerts**: Simple notification badge/inbox on the Provider's dashboard.
    *   **Deferred SMS/WhatsApp**: SMS and WhatsApp gateway notifications are deferred for the MVP to minimize costs.

### Question 19: Image Optimization & Constraints
*   **Decided**:
    *   **Format & Size Limits**: Cap maximum initial upload size at **10MB** (providing convenience for raw mobile photos) and limit formats to standard images (WebP, PNG, JPG/JPEG).
    *   **Server-Side Optimization**: Process all uploads via `sharp` before saving: convert to WebP, resize to a max resolution of 1200x800px, and compress at quality level 80 to minimize final storage consumption.

### Question 20: Moderator Alerting and Moderation Dashboard
*   **Decided**:
    *   **Moderator Dashboard**: Specialized workspace for Condo Moderators to review pending Assignments and flagged Announcements for their specific Condominium.
    *   **Alerting Channels**:
        *   **In-App Badges**: Real-time pending count badges on their header navigation.
        *   **Daily Digest Email**: A daily compiled mail of pending tasks to avoid instant email overload.
        *   **Telegram Bot Integration**: Free, optional integration where Condo Moderators and System Managers can link their Telegram account/Chat ID to receive instant Telegram notifications when a new moderation task arises.

### Question 21: Condominium Selection & Request Flow
*   **Decided**:
    *   **Onboarding & Verification Details**: When requesting a new Condominium, we collect:
        *   **Condominium Name** and **Location Details** (City, State, CEP/ZIP).
        *   **Contact Info**: Website link, phone, or email.
    *   **Síndico (Condominium Manager) Link**: The registration flow is designed so the person requesting the creation is typically the **Síndico** (or an authorized administrative manager). They provide proof of representation or contact info.
    *   **Verification Workflow**: 
        *   A System Manager manually verifies the request (confirming the Condominium is real and the applicant is indeed the Síndico/authorized manager).
        *   Upon approval, the Condominium is activated (`Approved`), and the requesting user is automatically granted the **Moderator** role for that Condominium, serving as its primary administrator.

### Question 22: Provider Verification Status & Public Badging
*   **Decided**:
    *   **Opt-in Trust Badge**: If a Provider has an approved `INTERNAL_NEIGHBOR` Assignment, they can choose whether to display the `"Morador Verificado de [Condomínio Name]"` trust badge on a per-Announcement basis.
    *   **Privacy Control**: Displaying the badge is optional to protect the Provider's privacy (e.g. they might not want to publicize where they live until contacting a buyer).

### Question 23: Deletion Policy & LGPD Anonymization
*   **Decided**:
    *   **Right to be Forgotten (LGPD Compliance)**: When a Provider requests account deletion, we soft-delete the account row (`deletedAt`) and **immediately scrub/anonymize all Personally Identifiable Information (PII)**:
        *   Replace Name with `[Usuário Deletado]`.
        *   Clear or cryptographically hash the Email.
        *   Clear phone number, WhatsApp links, and delete uploaded files (profile image, PDF catalogs).
    *   **Data Retention**: We retain only the anonymized transaction records (Pix payment logs and amounts) for fiscal/accounting audits and global metrics, fully complying with Brazil's General Personal Data Protection Law (LGPD).

### Question 24: Dynamic Pricing / Announcement Publication Fees
*   **Decided**:
    *   **Environment Configuration**: For the MVP, the publication fee (e.g., R$ 2,00) is defined as a global constant or environment variable (`PUBLICATION_FEE_CENTS=200`). This keeps database schemas and configuration UIs simple.
    *   **Future Migration**: If dynamic/geographical pricing is required later, it can be refactored into a dynamic system configuration table.

---

### Question 25: Moderator Violation Enforcement & Banning
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

## Active Questions

*None - All initial planning questions have been processed!*

---

## Upcoming Questions

*None - All initial planning questions have been processed!*









