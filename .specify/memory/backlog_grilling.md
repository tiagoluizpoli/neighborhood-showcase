# Backlog & Items Grilling Session Log

This log tracks all questions, answers, and decisions resolved during the planning phase for adding and refining new items to be addressed.

## Resolved Decisions

### Item 1: Visual Consistency & Shadcn Component Reset
* **Decided**: Enforce absolute visual consistency across the entire application by:
  1. Listing and reinstalling/replacing all locally installed shadcn UI components with fresh, untouched versions from the official registry.
  2. Reviewing all component consumption points in the codebase and stripping away any ad-hoc/custom override style classes (e.g., custom rounded corners, border variations, spacing) that violate default out-of-the-box shadcn aesthetics.

### Item 2: Geolocation-First Onboarding on Home Page
* **Decided**: Replace the current "select a condominium" prompt with a geolocation permission request on first home page visit. Use the user's coordinates to detect nearby registered condominiums and suggest them ("Do you live in one of these?"). If the user confirms, link that condominium as their context. If not, store the geolocation anyway to power proximity-based content.

### Item 3: Proximity-Based Announcement Ranking Engine
* **Decided**: Implement a geo-aware ranking system to sort and surface announcements based on proximity to the user's location. Requires infrastructure for geospatial queries (e.g., PostGIS, Solr, or similar). Nearest announcements appear first. This system should be extensible to incorporate other ranking signals beyond location in the future.

### Item 4: Enriched Per-Announcement Analytics & Dashboard Charts
* **Decided**: Expand the analytics system beyond the current aggregate-only view:
  1. **Per-announcement analytics**: Each announcement should have its own analytics breakdown (impressions, clicks, conversion) accessible from the dashboard.
  2. **Time-period filtering**: Allow providers to see how an announcement performed over a specific period (e.g., last 7 days, last 30 days) and identify peak access/click times.
  3. **Charts & visualizations**: Add chart components (graphs, sparklines) to both the dashboard home (aggregate) and per-announcement detail views.
  4. **Richer announcement card actions**: Add more action buttons on announcement cards in the panel (e.g., "View Analytics", "View Details") beyond just edit.
  5. **Richer event gathering**: Enrich the analytics data collection to capture more granular interaction events for deeper insights.
* **Open for grilling**: Exactly which charts, which events, what's feasible now vs. deferred.

### Item 5: "Morador Verificado" Badge — Enforcement & Eligibility Fix
* **Decided**: The "Morador Verificado" (Verified Resident) checkbox is currently available to all providers, including external ones not associated with any condominium. This is a bug. The fix:
  1. **Backend enforcement**: The verified resident toggle should only be settable when the provider has an approved `RESIDENT` assignment inside a condominium (i.e., a moderator has approved their residency request).
  2. **Frontend gate**: The checkbox should be hidden or disabled in the announcement creation/edit form when the provider's location type is not `RESIDENT` or their assignment status is not `APPROVED`.
  3. **Verification origin**: Verification status is derived from the moderator approval flow — it is NOT a self-declared toggle. The option only becomes available after the condominium moderator approves the provider's residency.

### Item 6: Image Cropper UX Overhaul & Edit Flow Parity
* **Decided**: The current image selection and cropping experience is subpar:
  1. **Better cropper interaction**: Replace the slider-based zoom/position controls with a proper drag-to-pan, pinch/scroll-to-zoom canvas cropper. The user should be able to intuitively move and resize the crop area directly on the image.
  2. **Larger preview**: The current preview is too small. Provide a larger, more prominent view of the image during the cropping step so the user can see what they're doing.
  3. **Edit flow parity**: The announcement edit page currently allows image replacement but does NOT expose the cropper. After replacing an image, the user must be able to crop/reposition it — identical to the creation flow.
  4. **Overall polish**: The cropper component should feel premium and modern, not like a debug tool with raw sliders.

### Item 7: Account Page & User Menu Overhaul
* **Decided**: Account-related actions are currently misplaced (e.g., "Excluir Conta" button lives on the dashboard). Consolidate all account management into a dedicated page and improve the user menu:
  1. **User avatar in header**: Replace the current name/email text display with a shadcn `Avatar` component — show the user's profile picture if available, fall back to initials.
  2. **Popover menu**: Clicking the avatar opens a popover showing the user's name and email, with links to "Minha Conta" (My Account) / "Configurações" (Settings) and "Sair" (Sign Out).
  3. **Dedicated `/account` page**: Create a new account management route containing all user-related actions: change password, update profile info, delete account (moved from dashboard), and any future account settings.
  4. **Remove from dashboard**: The "Excluir Conta" button and account-related UI must be removed from the provider dashboard — it belongs exclusively on the account page.

### Item 8: Admin Blacklist & User Reporting System Overhaul
* **Decided**: The current blacklist UX requires pasting a raw CPF hash, which is impractical for administrators. The entire system needs to be rethought:
  1. **User reporting**: Users should be able to report other users/providers. Reports feed into a review queue visible to admins.
  2. **Review queue / threat list**: Reported users land in a "threat list" or review queue where admins can see the number of reports, reasons, and context before deciding to blacklist.
  3. **Blacklist by user identity**: Admins should be able to blacklist a user directly from the review queue (system resolves the CPF hash internally). Direct CPF blacklisting remains as an advanced option if the admin has the CPF.
  4. **Predefined block reasons**: Block/ban reasons must be a predefined enum list (e.g., "Fraude", "Assédio", "Conteúdo Impróprio", "Spam"), NOT free text — enabling structured logging and future analytics on ban patterns.
  5. **Open for grilling**: Additional ideas to make the reporting/moderation pipeline more robust (e.g., escalation tiers, appeal flow, auto-suspension thresholds).

### Item 9: Admin Providers Directory — Filters, Bug Fix & Role Clarification
* **Decided**: The providers directory tab in the admin panel needs significant improvements:
  1. **Richer filter system**: Beyond name/email search, add filters for geographic parameters — filter providers by condominium, city, neighborhood, area. Make the filter system robust and composable.
  2. **Display bug**: The current user (registered as an external provider) does not appear in the directory. Investigate and fix — likely a query filter issue excluding certain roles or location types.
  3. **Role ≠ Provider status**: Being a moderator or administrator should NOT exclude someone from being a provider. "Provider" is an orthogonal concern — a moderator or admin can also sell services. The directory must show ALL users who have provider status, regardless of their admin/moderator role.
  4. **Opt-in provider status for mods/admins**: Moderators and administrators should be able to opt in as providers (related to next item about role management). The system should let them decide if they are "just" a mod/admin or also a provider.

### Item 10: User & Role Management Admin Panel
* **Decided**: There is currently no UI for managing user roles — admin promotion is done via CLI command. A full user/role management system is needed:
  1. **All-users listing**: An admin screen listing ALL users (not just providers), with search and filtering capabilities.
  2. **Role promotion/demotion**: Admins should be able to promote users to `SYSTEM_MANAGER` (admin), assign `MODERATOR` roles tied to specific condominiums, and manage provider opt-in status.
  3. **CLI bootstrap preserved**: The CLI command for promoting the first admin remains as the bootstrap mechanism for fresh deployments. After that, all role management happens through the UI.
  4. **Open for grilling**: Full scope of what configuration pages/sections are needed — user details, role history, assignment management, condominium-moderator bindings, etc.

### Item 11: Public Consumer Portal vs. Authenticated Panel Separation
* **Decided**: The home page and the provider/admin panel must feel like two separate experiences, even though they live in the same project:
  1. **Public portal (home page)**: A clean, consumer-facing experience for browsing announcements and services. Zero authentication friction — no login buttons, no "sign up" prompts, no indication that accounts even exist. The user just searches, browses, and contacts providers.
  2. **Authenticated panel**: The dashboard, admin, and moderation sections live under a dedicated path (e.g., `/panel/*` or `/dashboard/*`). Only accessible to users who already know they want to be providers and have consciously chosen to sign up.
  3. **Discovery path**: If a consumer decides they want to become a provider, there should be a deliberate, non-intrusive entry point (e.g., a "Become a Provider" link in a footer or subtle section) that leads them to sign-up — NOT something shoved in their face during browsing.
  4. **Open for grilling**: Exact routing strategy, how to connect both sides without leaking auth concerns into the public portal, shared layout vs. separate layouts, URL structure.

### Item 12: Panel Sidebar Navigation (shadcn Sidebar Component)
* **Decided**: Replace the current top header bar in the panel (dashboard/admin/moderation) with the official shadcn `Sidebar` component:
  1. **Use the official shadcn Sidebar**: No custom sidebar — use the exact component from the shadcn registry as-is.
  2. **Panel layout overhaul**: The panel sections (dashboard, moderation, admin) get a sidebar-driven layout. The header remains but in a cleaner, more structured form — not the current ugly top bar.
  3. **Better screen composition**: Navigation, user info, and section links live in the sidebar. Content area gets the full remaining width.
  4. **Public portal unaffected**: The public consumer portal (Item 11) keeps its own layout — the sidebar is exclusively for the authenticated panel experience.

### Item 13: Announcement Card & Detail View Redesign
* **Decided**: The current announcement card on the home page looks improvised. A full redesign is needed:
  1. **Card component**: Replace the current card with a proper component from the shadcn registry or a vetted community registry. No custom-built cards — use an established, polished pattern.
  2. **Missing provider info**: The card and detail view must show the provider's identity — name, logo/avatar — and link to their public profile page (Item 14). Builds trust between consumer and provider.
  3. **Detail view enrichment**: The announcement detail (modal/page) must surface all relevant information: provider link, full contact options, social networks, category, location context, verified badge, etc.
  4. **Open for grilling**: Exact card layout, which community registry components to evaluate, information hierarchy on the card vs. detail view.

### Item 14: Provider Public Profile Page
* **Decided**: Each provider should have a dedicated public-facing profile page accessible from announcement cards:
  1. **Provider page**: A `/providers/:id` (or similar) route showing the provider's logo, name, description, all contact methods, and social network links.
  2. **All announcements by provider**: The profile page lists all active announcements from that provider, so consumers can browse everything they offer in one place.
  3. **Expanded social/contact options**: Beyond just Instagram — support WhatsApp, phone, email, TikTok, Facebook, Twitter/X, website, and any other relevant contact channels. Both on the provider profile AND on individual announcements.
  4. **Trust signal**: The provider page is a trust-building feature — consumers can see the provider's full presence, history, and offerings before engaging.

### Question 15: Item 1 — shadcn Style: `base-lyra` vs Default
* **Decided**: Keep `base-lyra` (Option A). Reinstall the 8 existing components fresh under the current style. A full style change is deferred to a future milestone when a broader visual overhaul is warranted.

### Question 16: Item 1 — Hardcoded Colors: Semantic Tokens Only or Allow Accent Exceptions?
* **Decided**: Option A — strict semantic only. ALL colors must use design system tokens. Zero hardcoded Tailwind color classes (`bg-slate-*`, `bg-emerald-*`, `bg-indigo-*`, etc.). New semantic variables (`--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground`) will be added to `globals.css` with proper light/dark mode values. Border radius will also be normalized to use the `--radius` token system exclusively.

### Question 17: Item 1 — globals.css Token Review: Add Missing Semantics Now or Later?
* **Decided**: Option A — add all missing semantic tokens (`--success`, `--warning`, `--info` + foreground variants) upfront during Item 1 in `globals.css` (both light and dark mode values). This ensures replacements are ready before the route audit pass.

### Question 18: Item 1 — New shadcn Components: Batch Install or Incremental?
* **Decided**: Option A — batch install all anticipated components during Item 1. Full list to install: `sidebar`, `avatar`, `chart`, `dialog`, `popover`, `tabs`, `select`, `badge`, `separator`, `sheet`, `tooltip`, `table`, `alert-dialog`, `scroll-area`, `textarea`, `command`, `navigation-menu`. One commit, clean foundation.

### Question 19: Item 2 — Geolocation Permission UX: When and How to Ask?
* **Decided**: Option B — user-initiated with context. Show a friendly modal explaining WHY we need location before triggering the browser prompt. Additionally:
  1. **Privacy transparency**: The modal must explicitly state that location data is used ONLY for personalizing nearby announcements, is NOT shared with third parties, and can be revoked at any time.
  2. **Revocation mechanism**: Provide an accessible (but not intrusive) way for the user to revoke location permission from within the app (e.g., in settings or a subtle footer control).
  3. **LGPD compliance direction**: This is part of a broader effort to make the app LGPD-compliant — including cookie consent, data usage transparency, and user data control. The geolocation modal sets the tone for this privacy-first approach across the entire platform.

### Question 20: Item 2 — Fallback When User Denies Location Permission
* **Decided**: Option C — Hybrid fallback. If the user denies or dismisses location permission:
  1. Show all active announcements in chronological order (newest first) without proximity ranking.
  2. Display a subtle reminder banner at the top of the feed allowing them to activate geolocation if they change their mind.
  3. Offer a manual city/neighborhood filter input directly in the public portal search bar so users can self-select their area without geolocation.
  4. **Estimated Location Fallback**: On the server/API layer, we will passively estimate their city/region via IP Geolocation (e.g., lookup based on connection IP address) as an initial default view before they select manually. This IP data is personal but will not be stored, tracked, or linked to individual profiles, keeping it compliant under LGPD legitimate interest.

### Question 21: Item 2 — Proximity Check: Condominium Matching Radius and UX Flow
* **Decided**: Yes, we will implement the suggested default behaviors:
  1. **Matching Distance**: Two-tier check — 100m (Tier 1: prompt directly) and 1km (Tier 2: list nearby options).
  2. **Multiple Matches**: List them closest-first for user selection.
  3. **No Matches**: Skip condominium prompts completely and show feed sorted by distance.

### Question 22: Item 2 — Schema Changes: Where to Store Lat/Lng & Geolocation Coordinates?
* **Decided**: Entity-Level Coordinates. We will store coordinates (`latitude`, `longitude`, and the PostGIS `geography(Point, 4326)` custom column) directly on:
  1. The `condominium` table (representing the gate/entrance coordinate).
  2. The `providerLocation` table (representing the provider's specific street entrance coordinate, only populated for independent/external locations since condominium-based providers inherit the condo's coordinates).
* **Onboarding Benefit**: During onboarding/registration, if a user (or provider) shares their geolocation, we can run a PostGIS proximity check against the `condominium` table (using Tier 1/2 radius rules from Q21). If they are near/inside an existing condominium, we prompt them to select it and fill in their unit number, making onboarding extremely low-friction.

### Question 23: Item 3 — Proximity Ranking Engine: Sorting Priority & Feed Boosts
* **Decided**: Yes, we will implement the following ranking/boost rules:
  1. **Own Condominium Boost**: Announcements from the user's linked condominium always pin to the very top (effectively distance = 0).
  2. **Verified Badge Boost**: Verified providers get a ranking priority boost (they rank higher than unverified providers at similar distances).
  3. **Configurable Feed Radius**: Limit the default feed radius to 10km (starting threshold, configurable in backend environment variables). At the bottom of the feed, show a friendly message and a button allowing users to manually "expand search radius" (e.g., search up to 25km) with a warning that providers at greater distances might not serve/deliver to their area.

### Question 24: Item 4 — Analytics & Charts: Metrics, Granularity, and Libraries
* **Decided**: Yes, we will implement the following:
  1. **Chart Library**: Install and use **shadcn charts** (which wraps Recharts nicely with Tailwind CSS variables).
  2. **Time-Period Granularity**: Provide Last 7 Days (daily), Last 30 Days (daily/weekly), and Last 12 Months (monthly) selectors.
  3. **Event Tracking**: Keep tracking simple with `IMPRESSION` and `CONTACT_CLICK` (WhatsApp, Instagram, Website), but build the database schema and queries in an extensible way (with room for growth, e.g. easily adding custom event types like `SHARE` or `EXPAND_CARD` in the future).

### Question 25: Item 5 — Morador Verificado: Backend Enforcement & Frontend Experience
* **Decided**: Yes, we will implement the following:
  1. **Backend Security Gap**: Enforce the exact same residency verification check on the `update` procedure as we do on the `create` procedure to prevent any privilege bypass.
  2. **Revocation Rule**: If a provider's location assignment changes to anything other than `APPROVED` (e.g., `REJECTED`, `PENDING`, or is deleted), any active announcements associated with that location will automatically have `showVerifiedBadge` set to `false`.
  3. **Frontend Toggle Experience**: Option B. Show the "Morador Verificado" toggle disabled, with a helpful tooltip/text explaining that verification is required, linking to the location setup/verification form.

### Question 26: Item 6 — Image Cropper: Library vs. Custom Refinement
* **Decided**: Option A. Replace the custom slider-based HTML5 Canvas cropper with **`react-easy-crop`** to provide a direct drag-to-crop, pinch-to-zoom, and boundary-box visual experience, which is far superior for mobile-first users.

### Question 27: Item 7 — Account Page & Header Menu Details
* **Decided**: Yes, we will implement the following:
  1. **Avatar Fallback Style**: Display the user's initials (e.g., "TP") as the fallback style.
  2. **Editable Fields**: Add an edit form to allow updating the user's display Name.
  3. **Route Nesting**: Nest the account page route under `/dashboard/conta` so it automatically inherits the authenticated panel layout.

### Question 28: Item 8 — User Reporting & Moderation Queue Details
* **Decided**: Yes, we will implement the following:
  1. **Report Access**: Restrict report submission to authenticated/registered users only (prevents anonymous spam/bots). Normal logged-in residents/users can submit reports.
  2. **Moderation Flow (Spotlight)**: No automatic suspension. Instead, when an announcement receives a certain threshold of reports (e.g., 5 flags), it gets highlighted ("Spotlight") as a high-priority item in the moderator/admin dashboard queue for manual review. All bans and suspensions remain manual to avoid malicious competitor takedowns.
  3. **Predefined Reasons**: Offer standard report categories: "Fraude / Golpe", "Assédio / Ofensivo", "Spam", "Serviço / Produto Ilegal", "Outros".

### Question 29: Item 9 — Admin Providers Directory Filters & Opt-In Details
* **Decided**: Yes, we will implement the following:
  1. **Provider Opt-In**: Automatic on account creation — every user is a potential provider by default. However, users must be able to opt out of being listed as a provider (e.g., a toggle in their account settings to hide their provider profile from the directory).
  2. **Geographic Filters UI**: Option A — composable select inputs (distinct dropdowns/comboboxes for Condominium, City, and Neighborhood) for structured, scalable filtering.

### Question 30: Item 10 — User & Role Management Admin Panel Details
* **Decided**: Yes, we will implement the following:
  1. **Role Hierarchy**: Option A — strict hierarchy. Only `SYSTEM_MANAGER` can promote other users to `SYSTEM_MANAGER`. Lower-level admins can assign `MODERATOR` roles tied to specific condominiums.
  2. **Moderator Scope**: Option B — one-to-many. A single moderator can be assigned to moderate multiple condominiums simultaneously.
  3. **Audit Trail**: Option A — store a simple audit log of role changes (who promoted/demoted whom, which role, and when) for accountability.

### Question 31: Item 11 — Public Consumer Portal vs. Authenticated Panel Separation
* **Decided**: Yes, we will implement the following:
  1. **URL Structure**: Option B — unify all authenticated routes under a single `/panel/*` prefix (`/panel/dashboard`, `/panel/admin`, `/panel/moderation`). One parent route = one auth guard, one sidebar layout.
  2. **"Become a Provider" Discovery**: Option B — footer link plus a subtle section at the bottom of the home page (e.g., "Quer anunciar seus serviços? Saiba mais").
  3. **Shared Layout Components**: Option A — completely independent layouts. The public portal and the authenticated panel share zero layout components. Visual identity divergence is handled via CSS variable scoping (`data-theme="portal"` vs `data-theme="panel"`) on the respective layout wrappers.

---
### Question 32: Item 12 — Panel Sidebar Navigation Details
* **Decided**: Yes, we will implement the following:
  1. **Sidebar Mode**: Option A — collapsible. Full sidebar with labels when expanded, icon-only rail when collapsed. User can toggle.
  2. **Navigation Grouping**: Option B — grouped by role. Sections grouped under labeled headers (e.g., "Provedor", "Moderação", "Administração"). Only groups relevant to the user's roles are shown.
  3. **Mobile Sidebar Behavior**: Option A — off-canvas drawer. Sidebar slides in from the left as an overlay, triggered by a hamburger menu icon (standard shadcn Sidebar mobile behavior).

### Question 33: Item 13 — Announcement Card & Detail View Redesign
* **Decided**: Yes, we will implement the following:
  1. **Card Click Behavior**: Option B — navigates to a dedicated detail page (`/anuncios/:id`). Full page with richer layout and SEO benefits (each announcement gets its own indexable, shareable URL).
  2. **Contact Actions Visibility**: Option A — show the primary contact action (e.g., WhatsApp button) directly on every card for quick access and higher conversion.
  3. **Provider Identity on Card**: Option B — rich. Provider name + avatar + verified badge + link to provider profile displayed directly on the card for trust at first glance.

### Question 34: Item 14 — Provider Public Profile Page Details
* **Decided**: Yes, we will implement the following:
  1. **Profile URL Slug**: Option A — raw ID (`/prestadores/:id`). Simple, no collision handling needed.
  2. **Social/Contact Channels**: Support the following optional fields on the provider profile: WhatsApp, Phone, Email, Instagram, TikTok, Facebook, Website.
  3. **Empty Profile Handling**: Option A — show the profile with an empty state message (e.g., "Este prestador não possui anúncios ativos no momento"). The profile still has value for contact info and social links.

---

## ✅ Grilling Session Complete

All 14 backlog items have been fully grilled and resolved across **34 questions** (Q15–Q34). Every item now has clear, actionable decisions covering:
- Technical architecture and schema design
- UX/UI patterns and component choices
- Privacy/LGPD compliance constraints
- Role hierarchies and permission models
- Frontend/backend parity and validation rules

**Next step**: Use these resolved decisions as the foundation for specification writing (`/speckit.specify`) and implementation planning (`/speckit.plan`).

