# Product Requirement Document (PRD) — Neighborhood Showcase v2: Backlog Overhaul

This PRD defines the scope, user stories, implementation decisions, and test criteria for the 14-item backlog overhaul of the Neighborhood Showcase platform. All decisions were resolved during a grilling session (Questions 15–34) documented in [`backlog_grilling.md`](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/backlog_grilling.md).

---

## Problem Statement

The Neighborhood Showcase platform has a functional MVP but suffers from significant UX, architectural, and feature gaps that prevent it from scaling:

1. **No proximity awareness**: Visitors must manually select a condominium — there is no geolocation-based discovery or distance-ranked feed.
2. **Improvised UI**: Announcement cards, the image cropper, and the dashboard navigation all feel like prototype-quality components rather than a polished product.
3. **Missing trust infrastructure**: The "Morador Verificado" badge has a backend enforcement gap, there is no user reporting system, and no provider public profile page exists.
4. **Monolithic layout**: The public consumer portal and the authenticated provider/admin panel share the same layout, leaking authentication concerns into the browsing experience.
5. **Admin blind spots**: Role management is CLI-only, the providers directory has filtering bugs, and the blacklist requires raw CPF hashes.
6. **Limited analytics**: Providers see only aggregate metrics — no per-announcement breakdowns, no charts, no time-period filtering.

---

## Solution

A comprehensive overhaul across 14 backlog items, organized into 11 major modules, that transforms the platform from an MVP into a geo-aware, trust-driven, and visually premium neighborhood services marketplace:

- **For Visitors**: A geolocation-powered public portal with proximity-ranked announcements, rich cards with provider identity and trust badges, dedicated announcement detail pages (SEO-friendly), and provider profile pages.
- **For Providers**: An upgraded authenticated panel (`/panel/*`) with a sidebar navigation, premium image cropper (`react-easy-crop`), per-announcement analytics with charts, an account management page, and expanded social/contact channels.
- **For Moderators**: A moderation queue with spotlight flagging for reported announcements, multi-condominium management, and role-grouped sidebar navigation.
- **For System Managers**: A full user/role management UI with strict hierarchy enforcement and audit trail, a reporting review queue replacing the raw CPF blacklist, and geographic filtering in the providers directory.

---

## User Stories

### Visitor — Geolocation & Discovery (Items 2, 3)
1. As a Visitor, I want the platform to request my location via a friendly modal explaining why, so that I can see announcements ranked by proximity.
2. As a Visitor who grants location, I want the system to detect nearby condominiums (within 100m direct, 1km listed), so that I can quickly link to my condominium context.
3. As a Visitor who denies location, I want to see all announcements in chronological order with a subtle banner to re-enable geolocation, so that I am not blocked from browsing.
4. As a Visitor who denies location, I want to manually filter by city or neighborhood, so that I can self-select my area without geolocation.
5. As a Visitor, I want the system to passively estimate my city via IP geolocation (without storing or tracking it), so that I see a relevant default view.
6. As a Visitor, I want announcements from my linked condominium to always appear at the top of the feed, so that I see my neighbors' services first.
7. As a Visitor, I want verified providers to rank higher than unverified ones at similar distances, so that I can trust the results.
8. As a Visitor, I want the feed to be limited to a configurable radius (default 10km), with an option to expand up to 25km with a warning, so that results remain relevant.
9. As a Visitor, I want to revoke my location permission from within the app at any time, so that I maintain control over my privacy (LGPD).

### Visitor — Announcement Card & Detail (Items 13, 14)
10. As a Visitor, I want announcement cards to show the provider's avatar, name, and verified badge, so that I can assess trust at a glance.
11. As a Visitor, I want a primary contact button (e.g., WhatsApp) directly on each card, so that I can reach providers with minimal clicks.
12. As a Visitor, I want to click a card and navigate to a dedicated `/anuncios/:id` detail page, so that I can see full details and share the URL.
13. As a Visitor, I want the detail page to show all contact options, social links, category, location context, and a link to the provider's profile, so that I have complete information before contacting.
14. As a Visitor, I want each provider to have a public profile page at `/prestadores/:id`, so that I can see all their active announcements and contact channels in one place.
15. As a Visitor, I want to see an empty state message on a provider profile with no active announcements, so that the page still provides contact information.

### Visitor — Public Portal Experience (Item 11)
16. As a Visitor, I want the public portal to have zero authentication friction (no login buttons, no sign-up prompts), so that I can browse freely without feeling pressured.
17. As a Visitor interested in becoming a provider, I want a subtle "Quer anunciar seus serviços?" section at the bottom of the home page and in the footer, so that I can discover the option without it being intrusive.

### Provider — Image Cropper (Item 6)
18. As a Provider, I want to crop my announcement cover image using drag-to-pan and pinch-to-zoom gestures (via `react-easy-crop`), so that I can intuitively position my image.
19. As a Provider, I want a larger preview during the cropping step, so that I can clearly see the result before confirming.
20. As a Provider editing an existing announcement, I want the same cropper experience available when replacing an image, so that I have parity between creation and editing flows.

### Provider — Analytics & Charts (Item 4)
21. As a Provider, I want to view per-announcement analytics (impressions, contact clicks), so that I can measure the effectiveness of each listing.
22. As a Provider, I want to filter analytics by time period (Last 7 days, Last 30 days, Last 12 months), so that I can identify trends and peak times.
23. As a Provider, I want to see charts (line/bar graphs via shadcn charts / Recharts) on my dashboard, so that I can visualize my performance data.
24. As a Provider, I want announcement cards in my panel to have "View Analytics" and "View Details" action buttons, so that I can quickly access detailed information.

### Provider — Verified Badge (Item 5)
25. As a Provider with an approved `RESIDENT` assignment, I want to toggle the "Morador Verificado" badge on my announcements, so that I can signal trust.
26. As a Provider without verification, I want the badge toggle to appear disabled with a tooltip explaining how to get verified, so that I understand the path to verification.
27. As a Provider whose assignment is revoked, I want the system to automatically remove the verified badge from my active announcements, so that stale trust signals are prevented.

### Provider — Account & Profile (Items 7, 14)
28. As a Provider, I want to see my avatar (initials fallback) in the panel header, so that I have a personalized visual indicator.
29. As a Provider, I want to click my avatar and see a popover with my name, email, links to "Minha Conta" and "Sair", so that I can access account actions quickly.
30. As a Provider, I want a dedicated account page at `/panel/conta` where I can edit my display name, so that I can manage my profile information.
31. As a Provider, I want the "Delete Account" action to live exclusively on the account page, so that it is not accidentally triggered from the dashboard.
32. As a Provider, I want to add WhatsApp, Phone, Email, Instagram, TikTok, Facebook, and Website links to my profile, so that Visitors can contact me through their preferred channel.
33. As a Provider, I want to opt out of being listed in the providers directory, so that I can control my visibility.

### Provider — Panel Navigation (Items 11, 12)
34. As a Provider, I want all panel routes unified under `/panel/*`, so that navigation is consistent and auth-guarded from a single parent.
35. As a Provider, I want a collapsible sidebar (icon-only when collapsed), so that I can maximize content area when needed.
36. As a Provider on mobile, I want the sidebar to appear as an off-canvas drawer triggered by a hamburger icon, so that I have a native-feeling mobile experience.

### Authenticated User — Reporting (Item 8)
37. As an authenticated user, I want to report an announcement by selecting a predefined reason (Fraude/Golpe, Assédio/Ofensivo, Spam, Serviço/Produto Ilegal, Outros), so that I can flag inappropriate content.
38. As an authenticated user, I want my report to contribute to a threshold count, so that highly-reported announcements are spotlighted for admin review.

### Moderator — Panel & Moderation (Items 10, 12)
39. As a Moderator assigned to multiple condominiums, I want to moderate all of them from the same panel, so that I don't need separate accounts.
40. As a Moderator, I want sidebar navigation items grouped under a "Moderação" header, so that I can distinguish moderation actions from provider actions.

### System Manager — Role Management (Item 10)
41. As a System Manager, I want a full user listing with search and filtering, so that I can find any user in the system.
42. As a System Manager, I want to promote users to `SYSTEM_MANAGER`, so that I can delegate administrative responsibilities.
43. As a System Manager, I want to assign `MODERATOR` roles tied to specific condominiums (one moderator to many condominiums), so that I can set up moderation scopes.
44. As a System Manager, I want role changes to be logged in an audit trail (who changed what, when), so that there is accountability.
45. As a System Manager, I want only `SYSTEM_MANAGER` users to be able to promote others to `SYSTEM_MANAGER` (strict hierarchy), so that privilege escalation is prevented.
46. As a System Manager, I want the CLI bootstrap command preserved for the first admin in fresh deployments, so that initial setup remains possible.

### System Manager — Reporting & Moderation Queue (Item 8)
47. As a System Manager, I want reported announcements spotlighted (highlighted) in my admin queue after reaching a threshold (e.g., 5 reports), so that I can prioritize review.
48. As a System Manager, I want to dismiss reports, suspend announcements, or blacklist/ban users from the review queue, so that all moderation actions are manual and deliberate.
49. As a System Manager, I want block/ban reasons to be predefined enums (not free text), so that ban patterns can be analyzed.

### System Manager — Providers Directory (Item 9)
50. As a System Manager, I want composable geographic filters (Condominium, City, Neighborhood dropdowns) in the providers directory, so that I can quickly locate providers by area.
51. As a System Manager, I want every user to appear as a potential provider by default (automatic on account creation), with an opt-out toggle, so that the directory is comprehensive.
52. As a System Manager, I want moderators and admins who are also providers to appear in the directory, so that role does not hide provider status.

### Visual Consistency (Item 1)
53. As a user of the platform, I want all UI components to be visually consistent (using `base-lyra` shadcn style with strict semantic tokens), so that the application feels cohesive and premium.
54. As a developer, I want all shadcn components batch-installed fresh from the registry, so that no ad-hoc overrides corrupt the design system.
55. As a developer, I want new semantic tokens (`--success`, `--warning`, `--info` + foreground variants) added to `globals.css` for both light and dark modes, so that replacements are ready before the route audit.
56. As a developer, I want all new shadcn components (`sidebar`, `avatar`, `chart`, `dialog`, `popover`, `tabs`, `select`, `badge`, `separator`, `sheet`, `tooltip`, `table`, `alert-dialog`, `scroll-area`, `textarea`, `command`, `navigation-menu`) batch-installed in one commit, so that the component foundation is complete.

### Cross-Cutting — Privacy & LGPD
57. As a Visitor, I want the geolocation permission modal to explicitly state that my location is used only for personalizing nearby announcements and is not shared with third parties, so that I can make an informed consent decision.
58. As a Visitor, I want the system's IP-based city estimation to not be stored, tracked, or linked to my profile, so that my privacy is respected under LGPD legitimate interest.

---

## Implementation Decisions

### Module 1: Geospatial Infrastructure (Items 2, 3)
- Add `latitude` (decimal), `longitude` (decimal), and `geog` (PostGIS `geography(Point, 4326)`) columns to the `condominium` table (gate/entrance coordinate) and the `providerLocation` table (provider's specific street entrance; only populated for independent/external locations — condominium-based providers inherit the condo's coordinates).
- Use PostGIS `ST_DWithin` and `ST_Distance` for proximity queries and ranking.
- Geolocation permission is user-initiated via a friendly modal (not automatic browser prompt). The modal includes LGPD transparency text.
- Fallback chain: denied → IP-based city estimation (not stored) → chronological feed + manual city/neighborhood filter + subtle re-enable banner.
- Condominium matching uses a two-tier radius: 100m (Tier 1: prompt directly "Do you live here?") and 1km (Tier 2: list nearby options closest-first for selection).
- Ranking engine: own-condominium announcements pinned to top (distance = 0), verified providers boosted above unverified at equal distance, configurable feed radius (default 10km, expandable to 25km with warning).
- The feed radius threshold is stored as a backend environment variable for easy configuration.

### Module 2: Analytics & Charts (Item 4)
- Install `shadcn charts` (Recharts wrapper using Tailwind CSS variables).
- Time-period selectors: Last 7 Days (daily granularity), Last 30 Days (daily/weekly), Last 12 Months (monthly).
- Track `IMPRESSION` and `CONTACT_CLICK` (with `targetType`: WhatsApp, Instagram, Website). The `analyticsEventTypeEnum` and `analyticsTargetTypeEnum` already exist in the schema — design queries to be extensible for future event types (e.g., `SHARE`, `EXPAND_CARD`).
- Per-announcement analytics views accessible from dashboard announcement cards via "View Analytics" action button.

### Module 3: Verified Badge Enforcement (Item 5)
- Enforce the same residency verification check on the `update` tRPC procedure in `announcementRouter` as exists on `create` — verify that the provider has an `APPROVED` assignment of type `RESIDENT` before allowing `showVerifiedBadge = true`.
- Auto-revocation: if a provider's `providerLocation` assignment status changes from `APPROVED` to `REJECTED`/`PENDING` or is deleted, set `showVerifiedBadge = false` on all their active announcements.
- Frontend: show the "Morador Verificado" toggle as disabled with a tooltip/helper text linking to the location verification form when the provider is not verified.

### Module 4: Image Cropper (Item 6)
- Replace the custom HTML5 Canvas slider-based cropper (currently in `dashboard.anuncios.novo.tsx` and `dashboard.index.tsx`) with `react-easy-crop`.
- Enforce 4:3 aspect ratio.
- Provide a larger preview area during the cropping step.
- Ensure edit flow parity: the cropper must be available when replacing an image on the edit form (currently missing).
- Remove the custom `cropper.ts` utility and the zoom/xOffset/yOffset range sliders.

### Module 5: Account & User Menu (Item 7)
- Replace the current name/email text in the panel header with a shadcn `Avatar` component with initials fallback (e.g., "TP" for Tiago Poli).
- Clicking the avatar opens a shadcn `Popover` showing name, email, "Minha Conta" link, and "Sair" (Sign Out) button.
- Create a new route at `/panel/conta` (nested under the panel layout so it inherits the sidebar) containing: edit display Name form, Delete Account action (moved from `dashboard.index.tsx`), and future settings placeholders.

### Module 6: Reporting & Moderation Queue (Item 8)
- Report submission restricted to authenticated/registered users only.
- Predefined report reason enum: `FRAUDE_GOLPE`, `ASSEDIO_OFENSIVO`, `SPAM`, `SERVICO_ILEGAL`, `OUTROS`.
- New database tables: `report` (reporterId, announcementId, reason, createdAt) and a derived spotlight threshold query.
- No automatic suspension. When an announcement reaches a configurable threshold of reports (e.g., 5 from unique users), it is highlighted ("Spotlight") in the moderator/admin dashboard queue for manual review.
- Admin actions from the queue: Dismiss (clear reports), Suspend Announcement (with predefined reason), Blacklist/Ban User (resolves CPF hash internally).

### Module 7: Admin Directory & Role Management (Items 9, 10)
- Provider opt-in is automatic on account creation — every user is a potential provider by default. Provide an opt-out toggle in account settings to hide from the directory.
- Geographic filters in admin providers directory: composable select inputs (Condominium, City, Neighborhood dropdowns).
- Fix the display bug where external providers are excluded from the directory query.
- User/role management admin screen: all-users listing with search, role promotion/demotion UI.
- Strict role hierarchy: only `SYSTEM_MANAGER` can promote to `SYSTEM_MANAGER`. Any admin can assign `MODERATOR` roles.
- Moderator scope: one-to-many (a single moderator can be assigned to multiple condominiums).
- Audit trail: a `role_change_log` table recording (actorId, targetUserId, previousRole, newRole, condominiumId, timestamp).
- CLI bootstrap preserved for initial `SYSTEM_MANAGER` creation in fresh deployments.

### Module 8: Portal/Panel Separation & Sidebar (Items 11, 12)
- Unify all authenticated routes under `/panel/*`: `/panel/dashboard`, `/panel/admin`, `/panel/moderation`, `/panel/conta`.
- Public portal (home page, `/anuncios/:id`, `/prestadores/:id`) and authenticated panel have completely independent layouts — zero shared components.
- Visual identity divergence via CSS variable scoping: `[data-theme="portal"]` for the consumer-facing experience, `[data-theme="panel"]` for the management experience. Same shadcn components render differently based on wrapper.
- Panel uses the official shadcn `Sidebar` component: collapsible (icon-only rail when collapsed), navigation grouped by role under labeled headers ("Provedor", "Moderação", "Administração") — only groups relevant to the user's roles are rendered.
- Mobile: off-canvas drawer triggered by hamburger icon (standard shadcn Sidebar mobile behavior).
- "Become a Provider" entry point: subtle section at the bottom of the home page + footer link.

### Module 9: Announcement Card & Detail Page (Item 13)
- Redesign announcement cards using proper shadcn `Card` component with rich provider identity: avatar, name, verified badge, and link to provider profile.
- Primary contact action (e.g., WhatsApp button) displayed directly on the card for quick access.
- Card click navigates to a dedicated detail page at `/anuncios/:id` (SEO-friendly, shareable URL). The detail page surfaces all contact options, social links, category, location context, verified badge, and provider profile link.

### Module 10: Provider Public Profile Page (Item 14)
- New route at `/prestadores/:id` (raw ID, no slug).
- Profile page shows: provider name, avatar, description, all contact channels (WhatsApp, Phone, Email, Instagram, TikTok, Facebook, Website — all optional), and a grid of all active announcements by this provider.
- Empty profile handling: show the profile with contact info and an empty state message ("Este prestador não possui anúncios ativos no momento").
- Expanded contact channels require schema changes: extend the `contactLinks` JSONB on the `announcement` table and add a new `socialLinks` JSONB on the `user` table to support: `whatsapp`, `phone`, `email`, `instagram`, `tiktok`, `facebook`, `website`.

### Module 11: Visual Consistency (Item 1)
- Keep `base-lyra` shadcn style.
- Strict semantic tokens only: zero hardcoded Tailwind color classes. Add `--success`, `--warning`, `--info` (+ foreground variants) to `globals.css` for both light and dark modes.
- Border radius normalized to use the `--radius` token system exclusively.
- Batch-install all anticipated shadcn components in one commit: `sidebar`, `avatar`, `chart`, `dialog`, `popover`, `tabs`, `select`, `badge`, `separator`, `sheet`, `tooltip`, `table`, `alert-dialog`, `scroll-area`, `textarea`, `command`, `navigation-menu`.
- Reinstall all 8 existing components fresh from the registry.
- Full route audit to strip all ad-hoc style overrides.

---

## Testing Decisions

### Testing Philosophy
- **Black-box testing priority**: Test external behaviors (API contracts, state transitions, route guards, query results) rather than private implementation details.
- A good test verifies observable outcomes from the perspective of the module's consumer — not internal wiring.

### Modules to Test

1. **Geospatial Infrastructure**
   - Unit: PostGIS query builders return correct SQL for `ST_DWithin` and `ST_Distance` at configured radii.
   - Integration: Seed test condominiums with known coordinates, verify proximity ranking returns them in expected order.
   - Integration: Verify two-tier condominium matching (100m direct prompt vs. 1km list) with seeded data.

2. **Verified Badge Enforcement**
   - Integration: Verify `update` tRPC procedure rejects `showVerifiedBadge = true` when provider has no approved `RESIDENT` assignment.
   - Integration: Verify auto-revocation cascades `showVerifiedBadge = false` when assignment status changes.

3. **Reporting & Moderation Queue**
   - Integration: Verify duplicate reports from the same user are rejected.
   - Integration: Verify spotlight threshold triggers correctly after N unique reports.
   - Integration: Verify admin dismiss/suspend/ban actions update the correct records.

4. **Role Management**
   - Integration: Verify strict hierarchy enforcement — non-`SYSTEM_MANAGER` users cannot promote to `SYSTEM_MANAGER`.
   - Integration: Verify audit trail records are created on every role change.
   - Integration: Verify moderator multi-condominium scope works correctly.

5. **Portal/Panel Route Guards**
   - E2E: Verify unauthenticated access to `/panel/*` redirects to `/`.
   - E2E: Verify authenticated users only see sidebar groups matching their roles.

6. **Analytics Queries**
   - Integration: Verify time-period aggregation queries return correct counts for seeded analytics events across daily, weekly, and monthly granularities.

### Prior Art
- Existing integration tests in `apps/web/src/routes/-analytics.test.tsx` and `-guards.test.ts` provide patterns for route guard testing and analytics verification.
- Existing Vitest configuration and test PostgreSQL instance setup in the monorepo.

---

## Out of Scope

- **Native mobile apps**: This overhaul is strictly for the web platform (mobile browser Web App).
- **Real-time notifications**: No WebSocket/SSE push notifications for reports, role changes, or analytics events.
- **Appeal flow for banned users**: Bans are final in this version. An appeal system is deferred to a future milestone.
- **Auto-moderation / AI content filtering**: All moderation is manual via the admin queue.
- **Full visual rebrand / new design system**: We keep `base-lyra` and focus on consistency. A full visual overhaul with custom `data-theme="portal"` palette is deferred — this PRD only establishes the CSS variable scoping infrastructure.
- **Provider avatar/logo upload**: Providers use initials fallback for now. Custom avatar upload is a future enhancement.
- **Advanced analytics**: Funnel analysis, A/B testing, heatmaps, or custom event tracking beyond `IMPRESSION` and `CONTACT_CLICK`.
- **Multi-language expansion**: The existing i18n system (EN/PT) is maintained but not expanded to new languages.

---

## Further Notes

- **LGPD Compliance Continuity**: The geolocation modal, IP estimation policy (no storage/tracking), and data revocation controls established in this PRD extend the LGPD compliance direction from the original PRD (account deletion, PII scrub).
- **Migration Strategy**: PostGIS extension must be enabled on the production PostgreSQL instance (`CREATE EXTENSION IF NOT EXISTS postgis`). The `geography(Point, 4326)` column type requires the extension to be available before running migrations.
- **Dependency Additions**: `react-easy-crop` (frontend), `recharts` via shadcn charts (frontend), PostGIS extension (database). No new backend framework dependencies.
- **Backward Compatibility**: The `/panel/*` route migration from the current `/dashboard/*`, `/admin`, `/moderation` routes should include redirects from old paths to prevent broken bookmarks.
- **Grilling Session Reference**: All decisions in this PRD trace directly to the 34 questions resolved in [`backlog_grilling.md`](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/backlog_grilling.md) (Questions 15–34, covering Items 1–14).
