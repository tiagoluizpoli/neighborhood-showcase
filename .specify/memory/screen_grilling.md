# Neighborhood Showcase Screen Grilling Session Log

This log tracks all questions, answers, and screen-wise content mapping choices resolved during the screen-mapping planning phase.

## Resolved Decisions

### Question 1: Public Showcase (`/`) — Entry Point and Discovery
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

---

## Active Questions

### Question 2: Announcement Detail View (`/announcements/:id` or modal)
*   **Context**: How do visitors view the full details of an announcement?
*   **Decided**: **Hybrid Contextual Presentation.**
	*   **Direct Link (Shared)**: If accessed via a shared link (e.g. from WhatsApp), the announcement renders as a dedicated full-page route, fully optimized for mobile browsers.
	*   **Vitrine Navigation**: If clicked from the Showcase (`/`):
		*   **Mobile**: Renders as a sliding **Bottom Sheet / Drawer** (giving a native app feel) which can be swiped down to close.
		*   **Desktop**: Renders as a centered **Modal Dialog** overlay.
		*   **URL Sync**: In both overlay modes, the URL updates to `/announcements/:id` without triggering a full page reload, enabling easy copying and sharing of the link.
	*   **Interactions & Tracking**: A floating action button/bar is sticky to the bottom of the screen. Any click to WhatsApp, External URL, or PDF redirects through `/api/announcements/:id/contact?type=...` to record the analytics click event first.

### Question 3: Mandatory Image Upload & Aspect Ratio Enforcement
*   **Context**: How do we handle announcement images in terms of schema validation, creation form constraints, and performance?
*   **Decided**: **Mandatory Fixed Aspect Ratio Upload.**
	*   **Enforcement**: The cover image is **strictly mandatory** for all announcements (`imageUrl` is a NOT NULL column in the DB schema). Creating an announcement without an image is blocked.
	*   **Frontend Aspect Ratio**: The creation form enforces a **fixed 4:3 aspect ratio** via a client-side cropper widget (e.g., `react-image-crop`). Users can upload files up to 10MB (PNG, JPG, WebP) and crop them to 4:3 before uploading.
	*   **Server Processing & Constraints**: The server processes the uploaded file via `sharp`, resizing it to a fixed **800x600px WebP** at quality 80. This minimizes disk space usage and guarantees consistent layout alignment across the public showcase cards and detail views.

---

### Question 4: Onboarding & Authentication (`/auth`)
*   **Context**: The sign-up/login screen experience for Providers.
*   **Decided**: **Standardized Dual Tabs & Enforced Setup Redirect.**
	*   **Layout**: Swappable tabs ("Entrar" and "Criar Conta") in a clean, centered card. Social login (Google) button is located below the tab forms.
	*   **Registration Inputs**: Full Legal Name (Nome Civil), Email, Password, Phone Number (WhatsApp format with auto-masking), and CPF (with auto-masking and instant client-side validation).
	*   **Security Separation (Public vs Legal Identity)**:
		*   **Public Exhibition**: Providers can set a public "Nome Fantasia" (Trading/Exhibition Name) for their announcements.
		*   **Legal Identity**: The user's Full Legal Name, CPF, and Phone are stored securely. These details are hidden from the public and are only queryable under strict backend role-based access control (RBAC) by approved Condo Moderators (for residents of their condo) and System Managers (global audit/abuse tracking).
	*   **Safety checks**: On submit, the system hashes the CPF. If it is blacklisted, it displays: *"Este CPF está impedido de realizar novos cadastros na plataforma."*
	*   **Setup Enforcement**: Newly registered providers who do not have any condo assignment are immediately redirected to the Condominium Setup screen (`/dashboard/condo-setup`) to link their account before accessing the main dashboard.

---

### Question 5: Condominium Creation & Join Requests (`/dashboard/condo-setup`)
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

---

### Question 6: Provider Dashboard (`/dashboard`)
*   **Context**: The primary management screen for logged-in providers.
*   **Decided**: **Consolidated Metrics & Tabbed Status Listing.**
	*   **Metrics (Consolidated)**: Displays total impressions (views), total interactions (clicks), and conversion rate (%) for active ads at the top.
	*   **Announcements Tabbed Views**:
		*   **Ativos**: Lists active ads. Shows thumbnail, statistics, remaining days, with quick actions to *Editar*, *Pausar* (archive to draft).
		*   **Aguardando Pagamento**: Lists drafts/checkouts. Features a prominent **"Pagar com Pix"** button.
		*   **Expirados**: Ads older than 30 days. Features a **"Renovar Anúncio"** button (triggers checkout billing flow).
		*   **Suspensos**: Ads suspended by moderators. Displays a warning banner with the **suspension reason** and actions to *Editar* (to correct and submit back to queue) or *Excluir*.
	*   **Profile & LGPD Deletion**: Exposes a "Minha Conta" sub-view allowing profile updates (Name, WhatsApp number) and a destructive styled "Excluir Conta" button which triggers a confirmation modal to permanently anonymize data.

---

### Question 7: Announcement Creation/Edition Form (`/dashboard/announcements/new` or `/edit/:id`)
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

---

### Question 8: Pix Payment Screen (`/dashboard/announcements/:id/payment`)
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

---

### Question 9: Condo Moderation Panel (`/moderation`)
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

---

### Question 10: System Manager Portal (`/admin`)
*   **Context**: The administrative dashboard for global System Managers.
*   **Decided**: **Multi-Tabbed Admin Portal.**
	*   **Condominium Requests**: Lists pending condos (`PENDING_APPROVAL`). System managers audit ZIP codes, contact info, and review the uploaded election document. Upon approval, condo status becomes `APPROVED` and the creator receives a `MODERATOR` assignment.
	*   **Blacklist Manager**: Form to add CPF hashes to the blacklist (`blacklisted_identifiers`). If a matching account is active, it is immediately banned. Includes access to search and remove hashes.
	*   **Providers Directory**: Searchable list of all platform users. Allows System Managers to ban any user, which immediately removes all their active announcements, revokes active sessions, and hashes their CPF into the global blacklist.

---

## Active Questions

*None! All screen-wise content mappings and interactions have been fully resolved.*
