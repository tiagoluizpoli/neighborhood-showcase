# PRD-v7 — Provider Section Reorg: User/Provider Profile Split, Slim Dashboard, Meus Anúncios, Configurações, Conta e Segurança

## Problem Statement

Today, the panel's Provider experience is a tangle of three concerns in two pages, with the wrong fields in the wrong places:

1. **The dashboard tries to be two pages at once.** It shows performance KPIs and analytics on top, then a heavy tabbed list of announcements (active / draft / expired / suspended) with edit and analytics modals underneath. On a 1080p monitor, the announcement list pushes the analytics out of view — the dashboard is a "kitchen sink" that does neither job well.

2. **The account ("Conta") page conflates User identity with Provider Profile fields.** It edits `name`, the directory visibility toggle (`isProviderVisible`), and seven social-link fields together. There is no dedicated "Provider Profile" page at all — Providers have no first-class place to manage their branding, contact channels, or visibility. A Provider who wants to upload a profile picture, change a logo, or write a "public description" has nowhere to do it.

3. **The User/Provider Profile split exists in the glossary but not in the code.** `CONTEXT.md` defines `User` and `Provider Profile` as separate domain concepts, and the schema even has a separate `provider_profile` table. But the `user.update` mutation writes `socialLinks` and `isProviderVisible` to BOTH the `user` row and the `provider_profile` row, mirroring them. The Conta page reads and writes the merged shape. The result: the glossary and the implementation disagree, and any new Provider Profile field (logo, banner, company name) would force the same conflation.

4. **The Provedor sidebar group is always visible — even to users with no Provider assignment.** The glossary says it should be gated by "at least one Provider Assignment with `enabled = true`", but the current code has `condition: true`. A new user lands on the panel and sees a Provedor group with three items they have no data for.

5. **Preferences (language, theme) live in the browser only.** The header toggles change the UI instantly but the choice is lost on the next device. Theme and language are cross-device identity, not per-session UI state.

6. **The public Provider profile page only renders `name`, `avatarUrl`, and `socialLinks`.** The new Provider Profile fields (logo, banner, public description, company name) are saved but not visible to visitors. A Provider who fills them in sees no change on their public page.

This PRD fixes all six problems in one coordinated epic: the strict User/Provider split becomes real in code, the Conta page shrinks to User identity, a new Configurações page becomes the Provider Profile home, Meus Anúncios becomes a real page (with a detail page for view + edit + analytics), the dashboard becomes a slim "at a glance" view, the sidebar group is gated correctly, preferences persist, and the public profile renders the full branding set.

## Solution

Split the panel's Provider experience into four focused surfaces, each with one clear job:

1. **Conta e Segurança** — User identity only. Profile (name, email, phone, avatar), Preferences (language, theme, both persisted to the backend), Security placeholders (password change, active sessions, "Em breve"), Danger zone (deleteAccount). Renamed from "Conta".

2. **Meus Anúncios** — Provider announcements only. List page with tabs (active / draft / expired / suspended) and a "+ Criar Anúncio" button. Each card is a link to a new detail page that shows the full announcement, has an inline edit mode (toggle "Editar" → form becomes editable → "Salvar"/"Cancelar"), and an inline analytics section (KPIs + small chart + period selector). The modals go away.

3. **Configurações** — Provider Profile only. Three sections: Public Profile (displayName, companyName, tradeName, avatarUrl, logoUrl, bannerUrl, publicDescription) with a shared upload widget, Contact Channels (7 social links), Public Visibility (auto-saving isProviderVisible toggle). The Public Profile and Contact Channels sections have explicit "Salvar" buttons; the Public Visibility section auto-saves on toggle.

4. **Dashboard** — Summary view only. Header + 4-card KPI strip (Visualizações, Interações, Taxa de Conversão, Anúncios combined card with 4 sub-buckets) + a compact line/area chart (180px tall, full width, period selector 7d/30d/12m, 3 series including conversion). Designed to fit in a 1080p viewport with no scrolling.

The User/Provider split becomes real in the backend: a new `trpc.providerProfile` router owns 9 Provider Profile fields; `trpc.user.update` shrinks to User identity only. The `user.update` mutation stops writing to the `provider_profile` table. The public Provider DTO gets the 4 new branding fields and the `name` field is replaced with `displayName` per the glossary.

The Provedor sidebar group becomes capability-gated: a User with zero Provider assignments sees no Provedor items. The route guards on the new pages mirror the same rule.

A new full-width visual rule replaces today's `mx-auto max-w-*` centering. Every panel page and the public Provider page fill the available width. The public homepage stays centered as the documented exception.

## User Stories

### Account (Conta e Segurança)

1. As a User, I want to view and edit my display name, email, and phone number, so that my account identity is current.
2. As a User, I want my profile picture (avatar) to be uploaded through a file picker with cropping, so that I can show a real photo of myself in the panel sidebar and (in the future) on public surfaces.
3. As a User, I want the email field to show whether my email is verified, so that I know the status of my account.
4. As a User, I want the email field to be read-only (with a clear "verified" or "pending" indicator), so that I cannot accidentally change my login email without going through a verification flow.
5. As a User, I want the language switcher in the panel header to persist my choice to the backend, so that the same language is restored when I sign in on a different device.
6. As a User, I want the theme switcher in the panel header to persist my choice to the backend, so that the same theme is restored when I sign in on a different device.
7. As a User, I want language/theme persistence to never block my interaction (no loading spinners, no toasts on success, no error toasts on failure), so that the toggle feels instant.
8. As a User, I want a "Senha" card on the Conta page that I can see is not yet functional, so that I know the feature is planned. (Actual password change is a follow-up epic.)
9. As a User, I want a "Sessões ativas" card on the Conta page that I can see is not yet functional, so that I know the feature is planned. (Actual session management is a follow-up epic.)
10. As a User, I want to delete my account (LGPD), so that I can exercise my right to be forgotten. (Existing behavior, preserved.)

### Provider Profile (Configurações)

11. As a Provider, I want a dedicated "Configurações" page under the Provedor sidebar group, so that all Provider-specific configuration lives in one place.
12. As a Provider, I want to set a "display name" that visitors see in the directory and on my announcements, separate from my User account name, so that my public identity can differ from my account identity.
13. As a Provider, I want to set a "company name" and a "trade name" (nome fantasia) as free-text fields, so that I can brand my listings with my business name.
14. As a Provider, I want to upload a profile picture (avatar), a logo, and a banner image, so that my public profile has visual identity. (Image upload widget, parameterized by aspect ratio: avatar 1:1, logo 1:1, banner 16:9.)
15. As a Provider, I want to also paste a hosted URL for the logo and banner (in case my brand assets live on my own CDN), so that I don't have to re-upload them. (Dual-mode: URL input + "ou faça upload" button.)
16. As a Provider, I want the User avatar to use ONLY the upload widget (no URL alternative), so that my account picture is always on our platform's CDN, not a third-party host that might go down.
17. As a Provider, I want a "public description" (max 500 chars, plain text) that I can write once, so that visitors see a paragraph about my business.
18. As a Provider, I want to set 7 contact channels (WhatsApp, phone, email, Instagram, TikTok, Facebook, website), so that visitors can reach me however they prefer.
19. As a Provider, I want the Public Profile section and the Contact Channels section to have explicit "Salvar" buttons that only save their own section, so that a validation error in one section doesn't block the other.
20. As a Provider, I want the Public Visibility toggle to auto-save when I flip it, so that the change feels instant and I don't have to click a save button for a single field.
21. As a Provider, I want each section to give me its own success/error toast, so that I know which section's save succeeded.
22. As a Provider, I want to be the only one who can read and edit my Provider Profile, so that no other User can impersonate my public identity.

### Meus Anúncios (list)

23. As a Provider, I want the announcements list to live on its own page (Meus Anúncios), so that the dashboard can be a slim summary and the announcement management has room to breathe.
24. As a Provider, I want 4 tabs in Meus Anúncios (Ativos / Rascunhos & Pendentes / Expirados / Suspensos), each with a count badge, so that I can find my ads by status.
25. As a Provider, I want a "Criar Anúncio" button on the Meus Anúncios page header, so that the creation entry point is visible right where I'll look for it.
26. As a Provider, I want each card to be a clickable link to a detail page, so that I can see the full announcement, edit it, and see its analytics in one place.
27. As a Provider, I want the existing edit and analytics modals to be replaced by inline surfaces on the detail page, so that I don't lose context (close the modal, return to the list) when I edit or check analytics.
28. As a Provider, I want pay and renew actions to still work and navigate to the existing payment route, so that my existing flow doesn't break.

### Meus Anúncios (detail page)

29. As a Provider, I want a detail page that shows the full announcement (image, title, subtitle, description, price, category, tags, contact links, status, dates, payment/expiry info), so that I can see everything about an ad in one place.
30. As a Provider, I want an inline "Editar" toggle on the detail page that switches the view into edit mode, so that the edit flow doesn't require a separate page or a modal.
31. As a Provider, I want "Salvar" and "Cancelar" buttons that appear only in edit mode, so that the view mode stays clean.
32. As a Provider, I want an analytics section on the detail page (KPIs for that ad + small chart + period selector), so that I can see how a single ad is doing without going to the dashboard.
33. As a Provider, I want the detail page to redirect me to Meus Anúncios with a toast if I try to view an ad that doesn't exist or isn't mine, so that I can't see or break other Providers' ads.

### Dashboard (slim view)

34. As a Provider, I want the dashboard to fit in one 1080p screen with no scrolling, so that I see my KPIs, my announcement counts, and my trend chart at a glance.
35. As a Provider, I want 4 KPI cards: Visualizações (impressions), Interações (clicks), Taxa de Conversão (clicks/views), Anúncios (combined card with 4 sub-buckets), so that the dashboard summarizes my business at a glance.
36. As a Provider, I want the Anúncios combined card to show 4 sub-buckets (Ativos / Rascunhos / Expirados / Suspensos) with small colored dots, so that I can see my portfolio shape in one card.
37. As a Provider, I want a compact line/area chart on the dashboard (180px tall, full width, 3 series: impressions, clicks, conversion rate), so that I can see the trend without the chart dominating the page.
38. As a Provider, I want a period selector (7d / 30d / 12m) on the chart, so that I can switch the chart's time window without page reloads.
39. As a Provider, I want the dashboard to NO LONGER embed the announcements list, so that the dashboard is a true summary, not a list-with-KPIs-above-it.
40. As a Provider, I want clicking a sub-bucket on the Anúncios card to navigate to the corresponding tab on Meus Anúncios, so that I can drill from the summary into the detail. (Stretch goal — not strictly required; default is no drill-through.)

### Sidebar

41. As a User, I want the Provedor sidebar group to be hidden when I have zero Provider assignments, so that I don't see menu items I can't use.
42. As a User, I want a new user with no assignments to be onboarded via the public "Anunciar" CTA in the portal footer (NOT the panel sidebar), so that the onboarding entry point is clear and outside the panel.
43. As a User, I want direct-URL access to `/panel/dashboard/configuration` and `/panel/dashboard/announcements` to redirect me to the Conta page if I'm not a Provider, so that I can't see or break Provider-specific pages.
44. As a User, I want the other sidebar groups (Moderação, Administração, Spectrum) to keep their existing visibility rules, since those already match the glossary.

### Public provider page

45. As a Visitor, I want the public Provider page to show the new branding fields (logo, banner, company name, trade name, public description), so that I see the Provider as they want to be seen.
46. As a Visitor, I want the banner to be a 16:9 hero image at the top of the page (when present), so that the page feels branded.
47. As a Visitor, I want the page layout to flow naturally: hero banner → identity card (logo + displayName + companyName/tradeName + verified badge) → social links → "Sobre" paragraph → active announcements, so that the narrative reads top-to-bottom.
48. As a Visitor, I want the page to NOT render a banner block at all when the Provider hasn't uploaded one, so that I don't see a placeholder, gradient, or broken image.
49. As a Visitor, I want the page to apply the full-width layout rule (no centered column), so that the page uses the available width.
50. As a Visitor, I want the public DTO to use the Provider Profile's `displayName` (NOT the User's `name`), so that the public identity matches what the Provider configured.
51. As a Visitor, I want the page to keep its existing filters (BANNED, soft-deleted, isProviderVisible = false are hidden), so that the public directory stays clean.

### Visual rule

52. As a developer working on any panel page, I want the page content to fill the available width by default (no `mx-auto max-w-*` centering), so that we use the full monitor instead of wasting screen real estate on side margins.
53. As a developer, I want the documented exceptions to the full-width rule to be clear (auth flows, legal/printable layouts, modals, intentionally-constrained public marketing sections), so that I know when centering is acceptable.

### Persistence & cross-device

54. As a User, I want my theme choice to be saved on the backend, so that signing in on a different device gives me the same theme.
55. As a User, I want my language choice to be saved on the backend, so that signing in on a different device gives me the same language.
56. As a User, I want local UI (next-themes, i18next) to remain the source of truth for the instant toggle, so that the UI feels instant.
57. As a User, I want the local preference to win over the backend on the next page load if they disagree (e.g. after a flaky network), so that I'm not punished for a transient network error.

### Code & naming hygiene

58. As a developer, I want all code artifacts (file names, variable names, function names, route paths, i18n key paths) to be in English, so that the codebase is consistent and the new "announcements" naming matches the new glossary usage.
59. As a developer, when my task touches a Portuguese-named item, I want to translate that item as part of the same change, so that the mixed-language state shrinks over time.
60. As a developer, when my task touches a Portuguese-named area and finds OTHER Portuguese items not in my scope, I want to log them as a `deferred` row in the backlog under the "Mixed-language route naming fix" policy, so that a future sweep epic can clean them up.

### Future (deferred — NOT in this PRD)

61. As a Provider who is also a legal entity, I want a "Company Provider" mode with CNPJ, razão social, nome fantasia, document upload, and admin verification. (Future epic, "Company Provider (Option B)".)
62. As a User, I want to change my password from the Conta page. (Future epic, password change flow.)
63. As a User, I want to see and revoke active sessions from the Conta page. (Future epic, active sessions UI.)
64. As a Visitor, I want to see a logo image on the public Provider page, full-bleed at the top of the identity card. (Will work after this PRD; rendering is in scope.)
65. As a Visitor, I want to see a public description paragraph on the public Provider page. (Will work after this PRD; rendering is in scope.)

## Implementation Decisions

### Domain glossary (locked in `CONTEXT.md`)

- **User** owns: account identity (`name`, `email`, `phone`), `image` (avatar), `language` preference, `theme` preference, authentication credentials, and the LGPD `deleteAccount` flow. The `User.name` is the account identity used in moderation / admin contexts.
- **Provider Profile** owns: `displayName` (public-facing, may differ from `User.name`), `logoUrl`, `bannerUrl`, `companyName`, `tradeName`, `publicDescription`, `avatarUrl` (Provider public portrait), `socialLinks` (contact channels), `isProviderVisible` (public availability toggle). The `displayName` is what Visitors see in the directory and on announcements.
- The two entities are linked by `providerId = user.id` but never merged at the API surface. A User's `name` and a Provider Profile's `displayName` are intentionally separate fields and may diverge.

### Architecture: strict User/Provider Profile split

- **New `trpc.providerProfile` router** owns all 9 Provider Profile fields.
  - `trpc.providerProfile.get` — `protectedProcedure`, no input, infers `userId` from `ctx.session.user.id`. Returns the Provider Profile for the calling User only.
  - `trpc.providerProfile.update` — `protectedProcedure`, accepts all 9 Provider Profile fields. Upserts (insert or update on `providerId` conflict). Validates `displayName` length (3+ chars) if provided. Rejects attempts to read or write another User's profile.
- **Existing `trpc.user.update` shrinks to User identity only.** New input shape: `{ name?, language?, theme?, image?, phone? }`. The old `socialLinks` and `isProviderVisible` fields are REMOVED from this mutation. The mutation stops writing to the `provider_profile` table.
- **Existing `trpc.user.getProfile` returns User only.** The DTO is extended with `image`, `language`, `theme`, `emailVerified` (new). The old `socialLinks` and `isProviderVisible` fields are REMOVED from the DTO. The Conta page reads this DTO and nothing else.
- **Existing public `trpc.user.getPublicProfile` (which is the public Provider DTO) is extended.** Adds `companyName?`, `tradeName?`, `logoUrl?`, `bannerUrl?`, `publicDescription?`. The `name` field is REPLACED with `displayName` (the Profile's display name, NOT the User's name) per the glossary. Existing filters (BANNED, soft-deleted, isProviderVisible = false) are preserved.
- **No admin-read of Provider Profile in this PRD.** The admin list-providers flow continues to work as today (reads from `user` table).

### Domain layer

- New `ProviderProfile` domain entity extends `AuditableEntity<ProviderProfileProps>`. Read-only getters for all 9 fields. Constructor validates required fields; throws `DomainError` subclasses on failure.
- New `ProviderProfileRepository` interface with `findByProviderId`, `upsert`, `delete`.
- New `UpdateProviderProfile` use case (input: `{ providerId, ...fields }`; trims strings, validates `displayName`, calls `repo.upsert`).
- New `GetProviderProfile` use case (input: `{ providerId }`; throws `ProviderProfileNotFoundError` if missing; returns the DTO).
- New `ProviderProfileMapper` and `ProviderProfileRepositoryImpl` (Drizzle-based, uses `onConflictDoUpdate` to handle first-time provider onboarding where the row may not exist yet).
- `User.updateUser` use case shrinks: drops `socialLinks` and `isProviderVisible` from input.
- `User.getUserProfile` use case returns the extended User-only shape.
- `GetPublicProviderProfile` use case returns the extended public DTO with the new branding fields and `displayName` replacing `name`.

### Schema changes (generated by `bun run db:generate`, not hand-written)

- **`provider_profile` table — 5 new columns** (all `text`, all nullable, all snake_case in DB, camelCase in TS):
  - `companyName` — free-text branding.
  - `tradeName` — free-text branding (nome fantasia).
  - `logoUrl` — URL of the brand logo (1:1, public-facing).
  - `bannerUrl` — URL of the brand banner (16:9, public-facing hero).
  - `publicDescription` — plain text, max 500 chars (Zod-enforced in the API layer, not in the DB).
- **`user` table — 2 new columns**:
  - `language` (text, default `'pt-BR'`, nullable=false). The allowed set is enforced in the application layer.
  - `theme` (text, default `'system'`, nullable=false). Allowed values: `'light' | 'dark' | 'system'`.
- **No data loss**: existing rows survive. The new columns are nullable, the new `user` columns have safe defaults.
- **Migration discipline**: per `agents.local.md` §8, this is an additive migration. No DROP, no RENAME. Generated by `bun run db:generate` and applied via `bun run db:migrate`.

### Backend: DTO shapes (the type shapes encode the decisions precisely)

```ts
// User profile (the calling User's own account identity)
interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  image: string | null;       // NEW — account-level avatar
  language: 'pt-BR' | 'en';   // NEW — persisted preference
  theme: 'light' | 'dark' | 'system';  // NEW — persisted preference
}

// trpc.user.update input (shrunk)
interface UpdateUserInput {
  name?: string;       // 3-100 chars
  phone?: string;
  image?: string;
  language?: 'pt-BR' | 'en';
  theme?: 'light' | 'dark' | 'system';
}

// Provider profile (the calling User's own Provider data, if any)
interface ProviderProfileDTO {
  providerId: string;
  displayName: string;          // 3+ chars if provided in update
  companyName: string | null;
  tradeName: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  publicDescription: string | null;  // max 500 chars
  socialLinks: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    website?: string;
  };
  isProviderVisible: boolean;
}

// trpc.providerProfile.update input (all 9 fields, all optional)
interface UpdateProviderProfileInput {
  displayName?: string;
  companyName?: string | null;        // null clears it
  tradeName?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  publicDescription?: string | null;  // max 500
  socialLinks?: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    website?: string;
  };
  isProviderVisible?: boolean;
}

// Public Provider profile (visible to Visitors)
interface PublicProviderProfileResult {
  provider: {
    id: string;
    displayName: string;        // REPLACES the old `name` field
    avatarUrl: string | null;
    companyName: string | null;     // NEW
    tradeName: string | null;       // NEW
    logoUrl: string | null;         // NEW
    bannerUrl: string | null;       // NEW
    publicDescription: string | null;  // NEW
    socialLinks: Record<string, string | undefined>;
    isVerified: boolean;
  };
  announcements: ProviderAnnouncementDTO[];
}
```

### Frontend: pages

#### Conta e Segurança (`/panel/conta`)

- **Header**: "Conta e Segurança" + a one-line description.
- **Section 1 — Profile** (Card):
  - `name` (text input, 3+ char validation)
  - `email` (read-only, with a "Verificado" or "Pendente" indicator next to it — green checkmark icon for verified, amber dot for pending; no CTA)
  - `phone` (text input, optional)
  - `image` (avatar upload widget, 1:1, with preview)
  - One "Salvar alterações" button at the bottom of the section.
- **Section 2 — Preferences** (Card):
  - `language` (dropdown: Português (Brasil) / English)
  - `theme` (radio: Claro / Escuro / Sistema)
  - One "Salvar alterações" button at the bottom of the section.
  - **Important**: the header toggles (existing `ThemeCycleToggle` and `LanguageSwitcher` in the panel top bar) ALSO write to the backend on change, with the same silent best-effort semantics. The Conta page Preferences section is the place to edit them in a focused way; the header toggles are the quick-switch UX. The two UIs stay in sync.
- **Section 3 — Security** (placeholder Cards):
  - "Senha" card: title + "Em breve" message. (Real password change is a follow-up epic.)
  - "Sessões ativas" card: title + "Em breve" message. (Real session management is a follow-up epic.)
- **Section 4 — Danger zone** (Card, full-width or right column):
  - "Zona de Risco" + "Excluir minha conta" button + LGPD notice + confirmation modal. (Existing behavior, preserved.)
- **Layout**: full-width per the visual rule (`w-full` + reasonable padding; no `mx-auto max-w-*`).

#### Configurações (`/panel/dashboard/configuration`)

- **Header**: "Configurações do Prestador" + a one-line description.
- **Section 1 — Public Profile** (Card, 7 fields, explicit "Salvar" button):
  - `displayName` (text input, 3+ char)
  - `companyName` (text input, optional)
  - `tradeName` (text input, optional)
  - `avatarUrl` (image upload widget 1:1, widget only, no URL alternative)
  - `logoUrl` (dual-mode: URL input + "ou faça upload" button, 1:1 crop)
  - `bannerUrl` (dual-mode: URL input + "ou faça upload" button, 16:9 crop)
  - `publicDescription` (textarea, max 500 chars, character counter)
- **Section 2 — Contact Channels** (Card, 7 fields in a 2-column grid on `sm+`, explicit "Salvar" button):
  - `whatsapp`, `phone`, `email`, `instagram`, `tiktok`, `facebook`, `website` (all text inputs, all optional)
- **Section 3 — Public Visibility** (Card, 1 field, auto-save on toggle change with 300ms debounce):
  - `isProviderVisible` (checkbox + help text explaining "off = hidden from public search, existing announcements remain visible")
- **Layout**: full-width.
- **i18n**: every label and help text comes from the `configuracoes` namespace. The namespace contains all 9 field labels, 3 section titles, 1 button label, 1 page title + subtitle. Keys are English; values are in `en` and `pt` translation files.

#### Meus Anúncios list (`/panel/dashboard/announcements`)

- **Header**: "Meus Anúncios" + a "+ Criar Anúncio" primary button on the right (links to the existing PT route `/panel/dashboard/anuncios/novo`, per the "act on PT names" rule the agent will translate that path as part of this task).
- **Tab bar**: 4 tabs with counts — Ativos / Rascunhos & Pendentes / Expirados / Suspensos. State is component-local (not URL state in this pass).
- **Card grid**: existing card component, reused. Each card is a `<Link>` to the detail page.
- **Edit and analytics modals from the current dashboard are DELETED** (the detail page takes over).
- **Empty state per tab**: "Nenhum anúncio ativo" + "Criar Anúncio" button (links to the same create route).
- **Layout**: full-width.

#### Meus Anúncios detail page (`/panel/dashboard/announcements/:id`) — NEW

- **Route**: NEW file at this path. Provedor-group guarded (redirects to `/panel/conta` if the user is not a Provider; redirects to `/panel/dashboard/announcements` with a toast if the announcement is not found or not theirs).
- **Back link**: "← Voltar para Meus Anúncios".
- **View mode (default)**: full announcement presentation — image, title, subtitle, description, price, category, tags, contact links, status, dates, payment/expiry info.
- **Edit mode**: toggled by an "Editar" button. The view fields become editable form fields. "Salvar" and "Cancelar" buttons appear. "Cancelar" reverts the form to the loaded data. "Salvar" calls the existing `announcement.update` tRPC procedure (no change to the procedure itself).
- **Analytics section** (always visible, below the announcement presentation): the same KPIs and small chart that the deleted modal had, but inline. Period selector 7d/30d/12m.
- **Pay / Renew actions**: same as today, navigate to the existing payment route.

#### Dashboard (`/panel/dashboard`) — slim view

- **Header**: provider name (existing).
- **4-card KPI strip** (`sm:grid-cols-2 lg:grid-cols-4`):
  - Card 1 — Visualizações (Eye icon, big number, small caption "Exibições na vitrine pública").
  - Card 2 — Interações (MousePointerClick icon, big number, small caption "Cliques em WhatsApp/Instagram/Site").
  - Card 3 — Taxa de Conversão (TrendingUp icon, big number + `%`, small caption "Interações / visualizações").
  - Card 4 — Anúncios combined card (Megaphone icon, 4 sub-stats stacked vertically with small colored dots: Ativos green, Rascunhos muted, Expirados amber, Suspensos red). Sub-stats ordered Ativos → Rascunhos → Expirados → Suspensos (lifecycle order). Always shows 0 in all 4 if no announcements.
- **Chart card** (one card, full width below the KPI strip):
  - Title + period selector 7d/30d/12m on the right.
  - Recharts `LineChart` (or `AreaChart`) at 180px tall, full width.
  - 3 series: Visualizações, Interações, Taxa de Conversão.
  - No Y-axis labels (values are in the KPI cards above). Bottom X axis with period labels.
  - Small legend above or below the chart.
  - Loading + error states.
- **Removed from this page**: the announcements list, the edit modal, the analytics modal.
- **Layout**: full-width per the visual rule.
- **1080p fit**: page height ≤ ~880px in the panel main area. No scroll on a 1280×1024 viewport.

### Image upload widget (shared component)

- The existing `ProviderDashboardEditImageField` (used in the announcement edit modal today) is **generalized** into a shared `ImageUploadField` component.
- New props: `aspectRatio: number` (e.g. `1`, `16/9`), `label: string`, `helpText: string`, `value: string` (the URL), `onChange: (url: string) => void`.
- Internal behavior preserved: file picker → react-easy-crop → crop → upload to `/api/upload` → returns URL → set into form state.
- Used by:
  - The Conta page User avatar (widget only, no URL alternative).
  - The Configurações page `avatarUrl` / `logoUrl` / `bannerUrl` (dual-mode: URL input + "ou faça upload" button).
- Aspect ratios per use: User avatar 1:1, Provider avatarUrl 1:1, Provider logoUrl 1:1, Provider bannerUrl 16:9.
- **URL paste = no crop** (we don't have the file to crop). Upload = crop and store. No "URL → crop" flow.

### Sidebar

- The `Provedor` group condition is **fixed**: it is now computed from `assignments` (a query that already exists) and is `true` iff the user has at least one Provider Assignment with `enabled = true`. Today the code has `condition: true` (a code-vs-glossary bug).
- The Provedor group's items remain: Dashboard, Meus Anúncios, Configurações. Same labels, same i18n keys.
- The other groups (Moderação, Administração, Spectrum) keep their existing conditions — they already match the glossary.
- Sidebar footer avatar: shows `user.image` if set, falls back to initials. The standard shadcn `<AvatarImage>` automatically falls back to `<AvatarFallback>` when `src` is null or fails to load — no extra `onError` handler needed.

### Header preference toggles (theme + language)

- The existing `ThemeCycleToggle` and `LanguageSwitcher` keep their local-first behavior (instant UI change via `next-themes` / `i18next-browser-languagedetector`).
- **They ALSO call the backend mutation** (`trpc.user.update` with `theme` or `language`) on each change.
- The backend mutation is best-effort: on failure, no toast, no error to the user, the local change stays.
- On the next page load, the local preference wins over the backend if they disagree. (The backend is the "restore on next device" signal; the local is the "what the user sees right now" signal. They can disagree; the user is not punished for a flaky network.)
- These are NOT in the same render path as the Conta page Preferences section — the header is a quick-switch UI, the Conta page is a focused-edit UI. They share the same backend mutation, so they stay in sync.

### Visual rule (locked in `agents.local.md` §4)

- Every page fills the available width by default. `mx-auto max-w-*` is forbidden on the top-level page wrapper.
- Acceptable exceptions: (a) auth flows (sign-in / sign-up), (b) legal/printable document layouts, (c) modals/dialogs with a fixed max-width by design, (d) intentionally-constrained public marketing sections.
- This rule applies project-wide (panel, public portal). The public homepage stays centered as the documented exception. The public provider page becomes full-width.

### English in all code (locked in `RULES.md` §6, cross-referenced in `agents.local.md` §5)

- All code artifacts (file names, variable names, function names, route paths, i18n key paths) are in English. Only the translated *values* are in the respective language.
- New routes in this PRD use English paths (`/panel/dashboard/announcements`, `/panel/dashboard/announcements/:id`).
- The existing PT paths (`/panel/dashboard/anuncios/novo`, `/panel/dashboard/anuncios/$id/pagamento`, `/panel/conta`) are PT and get translated as part of this task (per the "act on PT names" rule).

### Operational rule: act on PT names, stack leftovers

- When this task touches a Portuguese-named item, it translates the item as part of the same change.
- When this task encounters OTHER Portuguese-named items in the same touched area that are NOT in scope, it logs them as new `deferred` rows in `.specify/memory/backlog.md` (under the "Mixed-language route naming fix" policy row). The backlog is the single place for these stacked items.
- 3 initial items stacked on 2026-06-10 (before this PRD was written): `panel.conta` route file + URL, `panel.dashboard.anuncios.*` route file family + URLs, `dashboard.anuncios.*` i18n key prefix. The translation of these specific items IS in scope for the tasks that touch them, and gets logged again if it slips.

### ADRs (recommended, written as part of this PRD's work)

- **ADR 0005 — User vs Provider Profile strict split.** Context: the codebase conflated User identity and Provider Profile fields, contradicting the glossary. Decision: separate the two concepts in code, with separate tRPC procedures and a strict rule that the Conta page exposes User identity only and the Configurações page exposes Provider Profile only. Alternatives considered: soft split (rejected), Company Provider as a separate entity (rejected as out of scope).
- **ADR 0006 — No centered content, full-width layout by default.** Context: the original panel pages used `mx-auto max-w-*` creating side margins on wide monitors. Decision: every page fills the available width, with documented exceptions for auth, legal/printable, modals, and intentionally-constrained marketing sections. Alternatives considered: keep centered for now (rejected — every new page is a temptation), per-page opt-in (rejected — default should be full-width), per-route-group opt-out (rejected — single rule is simpler to enforce).

## Testing Decisions

### What makes a good test

- **Only test external behavior, not implementation details.** The tests should be readable by someone who hasn't seen the code; if a test references an internal function name or relies on a particular component tree, it's testing the wrong thing.
- **Visual regressions are test failures.** A test that passes but the rendered UI is wrong (wrong order, wrong colors, wrong proportions, missing elements) is a broken test. The test must verify the visual contract.
- **No skipped tests.** If a test needs seed data, the agent (Ralph Loop) creates the seed data; the test runs for real. `test.skip()` with a "TODO: seed" comment is not acceptable.
- **No mocked end-to-end flows.** Backend integration tests use a real test database (the existing pattern). Frontend tests use the real tRPC client (or the in-process server). Mocking the database or the router to make a test "easier" hides bugs.

### Test seams (highest available)

1. **Playwright (E2E)** — the highest seam. A user journey in a real browser against a running backend. Used for:
   - Provider logs in, lands on dashboard, sees slim view (4 KPIs + chart, no announcement list).
   - Provider navigates to Meus Anúncios, sees the tabbed list, clicks a card, lands on the detail page with inline edit and analytics.
   - Provider edits a field on the detail page, saves, reloads, asserts persistence.
   - Provider navigates to Configurações, edits `displayName` and one social link, saves, reloads, asserts persistence.
   - Provider navigates to Conta e Segurança, sees the email verification indicator, edits `name`, saves, reloads, asserts persistence.
   - User with no Provider assignment logs in, sees no Provedor group; direct-URL access to a Provider page redirects to Conta.
   - Visitor opens the public provider page, sees the new branding set (banner, logo, displayName, companyName, tradeName, publicDescription).
   - User toggles theme in the header, reloads, sees the theme persisted; same for language.
   - Provider uploads an avatar (User) and a logo (Provider), the cropped image is shown after the flow completes.

2. **Backend integration tests (tRPC + real test DB)** — the second-highest seam. The existing pattern in `apps/server/src/application/use-cases/` and `apps/server/src/presentation/routers/`. Used for:
   - `trpc.providerProfile.get` / `update` round-trips.
   - `trpc.user.update` rejects the old `socialLinks` / `isProviderVisible` input (backwards-compatibility check).
   - `trpc.user.getProfile` returns the extended User-only shape.
   - Public `trpc.user.getPublicProfile` returns the extended DTO with `displayName` (replacing `name`) and the 4 new fields.
   - The Provider Profile upsert handles the first-time-onboarding case (no existing row).
   - `displayName` length validation (3+ chars).
   - `publicDescription` length cap (500 chars).
   - Provider-ownership check: User A cannot read or write User B's Provider Profile.

3. **Frontend unit tests (Vitest)** — the lowest seam. The existing pattern in `apps/web/src/**/*.test.ts(x)`. Used for:
   - The shared `ImageUploadField` with parameterized aspect ratios (1:1, 16:9).
   - The 4-card KPI strip renders the 4 sub-stats in the locked order.
   - The Configurações per-section save behavior (each section's save button calls its own mutation; the Public Visibility auto-save debounce fires the mutation after 300ms).
   - The Conta page form validation (name 3+ chars, email read-only with verification indicator).
   - The image upload widget's URL-paste vs upload paths.

### Prior art

- **Backend integration tests**: the existing pattern at `apps/server/src/application/use-cases/**/*-integration.test.ts` (e.g. `update-user.integration.test.ts`, `get-public-provider-profile.integration.test.ts`). New tests follow the same shape.
- **Frontend unit tests**: the existing pattern at `apps/web/src/**/*.test.ts(x)` (e.g. `language-switcher.test.tsx`, `-provider-dashboard-message-handler.test.ts`). New tests follow the same shape.
- **Playwright setup**: PRD-v6 established Playwright as mandatory for every UI change. The existing `apps/web/tests/` directory has the pattern; the same skip-with-reason pattern is replaced by "create the seed and run" per the user's rule.
- **Test data seeding**: the `provider@test.com` user exists in the seed with an approved Provider assignment (per `progress.txt`). The Conta page needs the same user but with a verified email — extend the seed, don't skip the test. The Configurações page needs a Provider Profile row — create it in the seed. The dashboard tests need a few announcements in each bucket — create them in the seed.

### Seams matched to user expectation (confirmed in grilling)

- No test is skipped. Ralph Loop has the autonomy to extend the seed data so every test runs for real.
- Tests cover both code-level correctness AND visual regression. A test that lets an off-by-one in the Anúncios sub-stat order slip through is a broken test.
- Tests catch the "code says done but UI is wrong" failure mode.

## Out of Scope

The following are explicitly NOT in this PRD. Each is either deferred to a future epic or a known backlog item:

- **Company Provider (Option B)** — `providerType: COMPANY`, CNPJ + razão social + nome fantasia + document upload, separate onboarding step, CNPJ validation, admin verification. Logged in `CONTEXT.md` "Provider Profile (future — Option B, deferred)" and `backlog.md` "Company Provider (CNPJ / legal-entity profile type — Option B)".
- **Password change flow** — the "Senha" card on Conta e Segurança is a placeholder. Building it requires Better Auth's password-change API integration. Separate epic.
- **Active sessions UI** — the "Sessões ativas" card is a placeholder. Building it requires reading from the `session` table and adding a `revokeSession` flow. Separate epic.
- **Mixed-language route naming sweep** — the 3 stacked items in `backlog.md` (`panel.conta`, `panel.dashboard.anuncios.*`, `dashboard.anuncios.*` i18n keys) get translated by the tasks that touch them; a future sweep epic handles any leftovers. Not in this PRD as a dedicated effort.
- **Image upload deep flows** — multi-image gallery, advanced crop tools, image library management. The basic upload-and-crop widget is in scope; the rest is future UX work.
- **Logo display rendering polish** — when this PRD lands, the logo will render on the public provider page. Future work: a logo-on-card treatment, animated logo on hover, etc.
- **URL state for Meus Anúncios tabs** — component state only. Promoting the `activeTab` to a URL search param is a follow-up.
- **Email verification flow** — the "Pendente" indicator is read-only. The actual flow (send verification email, click link, mark verified) is a follow-up epic.
- **Drill-through on Anúncios sub-buckets** — clicking a sub-bucket on the Anúncios combined card to navigate to the corresponding Meus Anúncios tab. (User story 40 marks this as a stretch; not in scope.)
- **Admin list-providers view update** — the existing admin list-providers flow reads from the `user` table and is not updated to include Provider Profile fields in this PRD.

## Further Notes

### Grilling session source of truth

- This PRD is the output of the grilling session on 2026-06-10. The full session summary — every question, every answer, every alternative considered, every default, every dependency chain — is at `.specify/memory/sessions/2026-06-10-provider-section-reorg-grilling.md`. That file is the authoritative reference; this PRD is the requirements distillation.
- 25 decisions locked (Q1–Q25). All have zero open-question dependencies. No follow-up grilling is required.

### Glossary & ADR cross-references

- This PRD introduces or reinforces entries in `CONTEXT.md` (User vs Provider Profile ownership, Provider Profile current scope Option A, Provider Profile future Option B, Provedor group visibility for new users Option A) and in `agents.local.md` (§4 full-width visual rule, §5 English in all code, §5 act on PT names + stack leftovers).
- This PRD recommends writing 2 ADRs as part of the implementation work: ADR 0005 (User vs Provider Profile strict split) and ADR 0006 (No centered content — full-width layout by default). These are formal decisions; the implementation work should write them, not just follow the rules.

### Glossary usage

- Throughout this PRD: "User" refers to the authenticated account identity (per `CONTEXT.md`); "Provider" refers to a User who can publish announcements; "Provider Profile" refers to the public-facing presentation record; "Provider Assignment" refers to the verified link between a Provider and a Condominium or Address. "Announcement" (NOT "ad", "post", or "advertisement") refers to a standardized flyer/banner publication.

### Visual rule is global, not just for the panel

- The "no centered content — full-width layout by default" rule applies project-wide. This PRD applies it to the panel pages and the public provider page. Other public pages may also be affected by future work; the rule is in `agents.local.md` §4 for everyone to follow.

### Why strict is the right reading of the user stories

- The user said the dashboard should be "at a glance", the Conta page should be "the account", and the Provider section should be "the provider section". The strict split, the dedicated pages, the per-section save, the auto-save toggle, the new full-width rule — all flow from those one-line demands. The user wants the application to feel like a focused product, not a kitchen sink. This PRD delivers that.

### Implementation order (a hint, not a binding plan)

- A natural implementation order is: schema migrations → backend entity + repository + use cases → `trpc.providerProfile` router → shrink `trpc.user.update` and DTOs → Configurações page → Conta e Segurança slim → Meus Anúncios list → Meus Anúncios detail page (which deletes the two modals) → dashboard slim view → public page rendering → ADRs.
- The order is dependency-driven. The schema and the new `trpc.providerProfile` router must land before the UI that consumes them. The Conta and Configurações pages can ship in either order once the backend is in. The dashboard slim view should land after the Meus Anúncios list, because the dashboard no longer needs to host the announcement list once it has its own home.
- The Epic + Task Files are the next deliverable. This PRD is the input.

---

<!-- END PRD-v7 -->
