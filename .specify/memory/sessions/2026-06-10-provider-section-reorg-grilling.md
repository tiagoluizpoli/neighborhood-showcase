---
type: grilling-session-summary
date: 2026-06-10
participants: [user, hermes]
skill: grill-with-docs
status: decisions-locked, plan-not-yet-written
---

# Provider Section Reorg — Grilling Session Summary

## What was grilled

The User wanted to reorg the Provider section of the panel:
1. Move the announcements list OUT of the dashboard and INTO a dedicated "Meus Anúncios" page.
2. Move Provider config (channels, socials, branding) OUT of the account ("Conta") page and INTO a "Configurações" page under the Provedor sidebar group.
3. Build a real Provider Profile page (not just the 7 social link fields that lived on the old Conta).
4. Slim the dashboard to a true "at a glance" view.

The session ran 18 questions, captured decisions in CONTEXT.md, agents.local.md, backlog.md, and grilling_history.md, and surfaced real code-vs-glossary mismatches (Provedor sidebar group was `condition: true` instead of the glossary's "enabled assignment" rule).

## Decisions locked (18)

| # | Question | Decision |
| --- | --- | --- |
| 1 | User vs Provider Profile split | **Strict split (Option A).** Conta = User identity only. Configurações = Provider Profile only. Two separate tRPC procedures (`user.update`, `providerProfile.update`). |
| 2 | Configurações page scope | **Full branding set** — `displayName`, `companyName`, `tradeName`, `avatarUrl`, `logoUrl`, `bannerUrl`, `publicDescription`, 7 social links, `isProviderVisible` toggle. |
| 3 | Provider type (individual vs company) | **Option A — individual only in this pass.** `companyName`/`tradeName` are free-text branding, not legal data. **Option B (Company Provider with CNPJ, razão social, document upload, admin verification) is deferred to a future epic**, logged in `backlog.md`. |
| 4 | Dashboard scope after the move | **Summary view only.** No recent-announcements list. Just KPIs + chart. |
| 5 | KPI strip + chart type | **4 cards** (Views / Clicks / Conv% / combined Anúncios card). **Sparkline = B2a** (compact line/area section, 180px tall, full width, period selector 7d/30d/12m on the right, 3 series incl. conversion). **Full-width layout rule** added to `agents.local.md` §4. |
| 6 | Anúncios combined card | **Always shows 0 in all 4 sub-buckets** if no announcements. **Small colored dots**, no big backgrounds: Ativos green, Rascunhos muted, Expirados amber, Suspensos red. |
| 7 | Meus Anúncios page structure | **Header + tabs + cards** (lifted from dashboard). **Component state** for `activeTab` (no URL state in this pass). Same i18n key (`sidebar.item.meus_anuncios`). |
| 8 | Backend split + schema | New `trpc.providerProfile` router + entity + repository + use cases. `trpc.user.update` shrinks to `name` only. **Schema migrations via `bun run db:generate`**, not hand-written. **i18n keys in English**. |
| 9 | Provedor sidebar group visibility | **Option A — strict.** Hide the Provedor group unless the User has at least one Provider Assignment with `enabled = true`. A new user with zero assignments sees no Provedor items; the onboarding entry point is the public "Anunciar" CTA in the portal footer. **Code-vs-glossary mismatch fixed in this epic** (current `panel.tsx` has `condition: true`). |
| 10 | Provedor sidebar fix scope | **Fix in this epic.** Change `GROUP_PROVEDOR.condition` to `hasProviderAssignmentWithEnabledTrue`. Implicit follow-up: add route guards on the new `/panel/dashboard/configuration` and `/panel/dashboard/announcements` routes so direct-URL access by a non-Provider redirects to `/panel/conta`. The other groups' conditions (Moderação, Administração, Reports) already match the glossary — no change. |
| 11 | Conta page after slim | **Renamed "Conta e Segurança".** 4 fields in Profile (name, email read-only, phone, image avatar) + 2 preferences (language, theme — both NEW, persisted at user level) + 2 placeholder Security cards (Senha, Sessões ativas — "Em breve" placeholders, real DOM) + danger zone (deleteAccount). |
| 12 | Image upload widget scope | **Build the upload widget in this epic for both User and Provider.** User avatar uses ONLY the widget. Provider image fields accept BOTH URL paste AND the widget (dual-mode). Reuses the existing `/api/upload` endpoint. |
| 13 | Image upload widget design | **Generalize the existing `ProviderDashboardEditImageField`** into a shared `ImageUploadField` component (parameterized by `aspectRatio`, `label`, `helpText`). **Aspect ratios: User avatar 1:1, Provider avatarUrl 1:1, Provider logoUrl 1:1, Provider bannerUrl 16:9.** **URL paste = no crop** (no file to crop); upload = crop and store. **User avatar is widget-only** (no URL alternative). |
| 14 | Public Description field | **Plain text only** (no markdown). **500 char cap** at the application layer. **Full branding set rendered on the public profile page in this epic** — banner as 16:9 hero (when present), logo + displayName + companyName/tradeName + verified badge in an identity card, social links, "Sobre" section with description, active announcements list. **Public DTO `name` field replaced with `displayName`** per CONTEXT.md glossary. |
| 15 | Public page banner fallback + visual rule | **When `bannerUrl` is null, no banner block is rendered** at all (no placeholder, no gradient, no broken image). **Public provider page applies the full-width rule** (`w-full space-y-8 px-6 py-8` instead of `mx-auto max-w-6xl`). Public homepage stays centered as the documented exception. |
| 16 | Configurações save behavior | **Per-section save for 2 sections (Public Profile, Contact Channels), auto-save for 1 section (Public Visibility).** The Public Profile (7 fields) and Contact Channels (7 social links) sections are independent forms, each with its own save button, pending state, toast, and mutation. The Public Visibility section (single `isProviderVisible` toggle) auto-saves on toggle change with a 300ms debounce. Refined by Q25. |
| 17 | Provider Profile authorization | **`trpc.providerProfile.get` takes no input** — the procedure infers `userId` from `ctx.session.user.id`. A User can only read their own profile via this endpoint. **`trpc.providerProfile.update` is an upsert** (matches the existing `onConflictDoUpdate` pattern). **Public DTO extended** with `companyName?`, `tradeName?`, `logoUrl?`, `bannerUrl?`, `publicDescription?`. Public endpoint keeps its existing `isProviderVisible` / `BANNED` / soft-delete filters. |
| 18 | Meus Anúncios edit/analytics surface | **Provider-facing detail page** at `/panel/dashboard/announcements/:id` (or `/panel/dashboard/anuncios/:id` to match the existing PT route naming pattern used by `/pagamento`). The detail page contains: full announcement view + inline edit mode (toggle "Editar" → fields become editable → "Salvar"/"Cancelar") + inline analytics section (KPIs + small chart + period selector). List cards become real links. Pay/renew still navigate to the existing payment route. New route needs the same Provedor-group guard as Meus Anúncios. 404 / "not your announcement" cases redirect to Meus Anúncios with a toast. |
| 19 | Anúncios combined card sub-stat ordering | **A — Ativos → Rascunhos → Expirados → Suspensos** (lifecycle order, most-actionable first). Ativos is the primary metric, Suspensos is rare + high-friction so it sits at the bottom. Unblocks Q5 and Q6 for PRD scope. |
| 20 | Email verification badge on Conta e Segurança | **A — plain text indicator.** Next to the email field, show "Verificado" (with a small green checkmark icon) or "Pendente" (with a small amber dot icon). No button, no action — purely informational. When the future email verification epic lands, the indicator becomes interactive. |
| 21 | Theme/language persistence error handling | **A — silent best-effort, never block the toggle, and on next page load the local preference wins if it disagrees with the backend.** The local UI is the source of truth for "what the user sees right now"; the backend is "what we'll restore on the next device". They can disagree; that's OK. The user is not punished for a flaky network. |
| 22 | Sidebar footer avatar | **A — show `user.image` if set, fall back to initials.** One-line change to `panel.tsx` footer. The standard shadcn `<AvatarImage>` automatically falls back to `<AvatarFallback>` when `src` is null or the image fails to load — no extra `onError` handler needed. The User's `image` (account identity) and the Provider Profile's `avatarUrl` (public Provider avatar) are intentionally separate fields per the strict User/Provider Profile split (Q1) and do NOT auto-mirror. |
| 23 | Public page "Sobre" section placement | **A — below the social links, above the active announcements.** Identity → social links → pitch (Sobre) → inventory (announcements) is a natural narrative for a marketing-style profile page. Putting the description before social links (B) feels rushed; putting it at the bottom (C) buries the Provider's pitch as a footnote. |
| 24 | Route file naming for the new detail page | **A — English: `/panel/dashboard/announcements/:id`.** The sidebar already uses EN (`meus_anuncios` → `/panel/dashboard/announcements`); the new detail URL follows that convention. The existing PT `anuncios/$id/pagamento` is a known deferred item (logged in `backlog.md` "Mixed-language route naming fix"). The user re-asserted the "English in all code" rule from `RULES.md` §6 during this grilling; the cross-reference is now in `agents.local.md` §5. New routes MUST be EN. |
| 25 | Public Visibility toggle save behavior | **B — auto-save on toggle change (with 300ms debounce).** The Public Visibility section is a single field; explicit save is heavy. Toggles are universally auto-save in settings UIs (Gmail, Slack, GitHub). The other two Configurações sections keep their explicit per-section save buttons. Debounce handles accidental toggle-and-back. |

## Files to touch (consolidated)

### Frontend
- `apps/web/src/routes/panel.conta.tsx` — slim to User identity only, rename to "Conta e Segurança", drop centering
- `apps/web/src/routes/panel/dashboard/configuration.tsx` — replace placeholder with full Configurações page (3 sections, per-section save, upload widget)
- `apps/web/src/routes/panel/dashboard/announcements.tsx` — replace placeholder with real Meus Anúncios list page
- `apps/web/src/routes/panel/dashboard/announcements/$id.tsx` (NEW) — Provider-facing announcement detail page (view + inline edit + inline analytics)
- `apps/web/src/routes/panel/-provider-dashboard-content.tsx` — slim to header + KPIs + chart; remove announcement list, edit modal, analytics modal
- `apps/web/src/routes/panel/-provider-dashboard-performance-overview.tsx` — rebuild as 4-card KPI strip + compact line/area chart
- `apps/web/src/routes/panel/-provider-dashboard-announcement-list.tsx` — keep, but use it from the new Meus Anúncios route
- `apps/web/src/routes/panel/-provider-dashboard-edit-modal.tsx` — DELETE (replaced by inline edit on detail page)
- `apps/web/src/routes/panel/-provider-dashboard-analytics-modal.tsx` — DELETE (replaced by inline analytics section on detail page)
- `apps/web/src/routes/panel/-provider-dashboard-edit-image-field.tsx` — generalize into shared `ImageUploadField` (rename + aspectRatio prop)
- `apps/web/src/routes/panel.tsx` — fix `GROUP_PROVEDOR.condition` from `true` to `hasProviderAssignmentWithEnabledTrue(session, assignments)`; update sidebar footer avatar to show `user.image` if set
- `apps/web/src/routes/_portal.prestadores.$id.tsx` — render full branding set (banner, logo, companyName, tradeName, publicDescription); drop `mx-auto max-w-6xl` for full-width
- `apps/web/src/components/theme-cycle-toggle.tsx` — when toggled, also persist to backend via new mutation
- `apps/web/src/components/language-switcher.tsx` — when changed, also persist to backend
- `apps/web/src/locales/en/translation.json` + `apps/web/src/locales/pt/translation.json` — new keys for `configuracoes.*`, `dashboard.kpi.announcements.*`, `dashboard.chart.title`; remove Conta Provider-field keys
- `apps/web/src/utils/trpc.ts` — new `trpc.providerProfile.*` client + new `trpc.user.update` shape (auto-regenerated)
- New components:
  - `apps/web/src/routes/panel/-image-upload-field.tsx` (renamed from edit-image-field; aspectRatio prop)
  - `apps/web/src/routes/panel/-provider-dashboard-kpi-strip.tsx` (new 4-card KPI strip)
  - `apps/web/src/routes/panel/-provider-dashboard-announcement-detail-page.tsx` (or inlined into the route file)

### Backend
- `packages/db/src/schema/showcase.ts` — add 5 columns to `provider_profile`: `companyName`, `tradeName`, `logoUrl`, `bannerUrl`, `publicDescription` (all `text`, nullable)
- `packages/db/src/schema/auth.ts` — add 2 columns to `user`: `language` (text, default 'pt-BR'), `theme` (text, default 'system')
- `packages/db/src/migrations/` — auto-generated by `bun run db:generate` (two new migration files)
- `apps/server/src/domain/entities/provider-profile.entity.ts` (NEW) — `ProviderProfile` class extending `AuditableEntity`
- `apps/server/src/domain/entities/user.entity.ts` — add `image` getter; add `language`/`theme` getters; remove `socialLinks`/`isProviderVisible` getters (those move to ProviderProfile entity)
- `apps/server/src/domain/repositories/provider-profile.repository.ts` (NEW)
- `apps/server/src/domain/repositories/user.repository.ts` — `UserProfileDTO` extended with `image`, `language`, `theme`, `emailVerified`; `socialLinks` and `isProviderVisible` REMOVED from the DTO
- `apps/server/src/application/use-cases/provider-profile/update-provider-profile.ts` (NEW)
- `apps/server/src/application/use-cases/provider-profile/get-provider-profile.ts` (NEW)
- `apps/server/src/application/use-cases/user/update-user.ts` — input shrinks to `{ name?, language?, theme?, image?, phone? }`
- `apps/server/src/application/use-cases/user/get-user-profile.ts` — return shape extends to include `image`, `language`, `theme`, `emailVerified`; drops `socialLinks` and `isProviderVisible`
- `apps/server/src/application/use-cases/user/get-public-provider-profile.ts` — return shape extends to include `companyName`, `tradeName`, `logoUrl`, `bannerUrl`, `publicDescription`; `name` field replaced with `displayName`
- `apps/server/src/presentation/routers/provider-profile.ts` (NEW) — `get`, `update` (both `protectedProcedure`, no input on get)
- `apps/server/src/presentation/routers/user.ts` — `update` input shrunk; `getProfile` returns extended User-only shape
- `apps/server/src/main/di/index.ts` — wire new `ProviderProfile` use cases
- `apps/server/src/infrastructure/db/provider-profile-repository.ts` (NEW)
- `apps/server/src/infrastructure/db/mappers/provider-profile.mapper.ts` (NEW)
- `apps/server/src/infrastructure/db/user-repository.ts` — `updateProfile` simplifies to User-row only; remove the `provider_profile` write
- `apps/server/src/presentation/routers/announcement/provider.ts` — `getDashboardData` and the detail-page data fetch stay the same shape; the edit flow now happens on a separate page route, but the underlying tRPC procedures (`announcement.update`, `announcement.getAnalytics`) are unchanged

### ADRs (recommended)
- `docs/adr/0005-user-vs-provider-profile-strict-split.md` (NEW)
- `docs/adr/0006-no-centered-content-full-width-layout.md` (NEW)

## Deferred items (logged in `backlog.md` and `grilling_history.md`)

- **Company Provider (Option B)** — `providerType: COMPANY`, CNPJ + razão social + nome fantasia + document upload, separate onboarding, CNPJ validation, admin verification. **Grilled 2026-06-10 — deferred to a future epic.** Logged in `CONTEXT.md` ("Provider Profile (future — Option B, deferred)") and `backlog.md`.
- **Password change flow** — the "Senha" card on Conta e Segurança is a placeholder ("Em breve"). Building it requires Better Auth's password-change API integration. Separate epic.
- **Active sessions UI** — the "Sessões ativas" card is a placeholder. Building it requires reading from the `session` table and adding a `revokeSession` flow. Separate epic.
- **Mixed-language route naming fix (PT → EN)** — `panel.conta`, `panel/dashboard/anuncios/$id/pagamento` are PT; `panel/dashboard/announcements` (sidebar link) is EN. Standardize in a future epic.
- **Backend language preference persistence** — was the "i18n" item already in `backlog.md`. The Q11 decision adds it to this epic's scope (Conta e Segurança Preferences section), so this backlog item is now active in this epic. Update `backlog.md` status from `deferred` to `active` when the epic starts.
- **Image upload UX for Provider fields (deep crop/replace flows)** — Q12 decided to build the upload widget in this epic. The "follow-up slice for upload UX" the user mentioned is still a future improvement (e.g. multi-image gallery, advanced crop tools, image library), but the basic upload-and-crop flow is in scope now.

## Open UX questions (not grilled, for future sessions)

These are smaller polish decisions that don't block writing a plan. Listed in priority order. **All of them can be defaulted by Ralph Loop** if no further grilling happens — the defaulting is documented in the "Default" column. None of them block the 18 locked decisions.

| # | Question | Default if not grilled | Blocks any locked decision? |
| --- | --- | --- | --- |
| 1 | Anúncios combined card sub-stat ordering | **Ativos → Rascunhos → Expirados → Suspensos** (lifecycle order, most-actionable first) — **LOCKED Q19** | No — Q6 is locked without this |
| 2 | Auto-save vs explicit save for the Public Visibility toggle | **Per-section save** (Q16) with a single-field form. A toggle with no save button feels half-built, so this stays explicit. Auto-save is a follow-up. — **LOCKED Q25 (overridden — auto-save IS the answer for the Public Visibility section; the other two sections keep per-section save)** | No — Q16 is locked without this |
| 3 | Email verification badge on Conta e Segurança | **Inline "Verificado" / "Pendente" text** next to the email field, no CTA. Email verification flow is a separate epic. — **LOCKED Q20 (option A)** | No — Q11 is locked without this |
| 4 | Theme/language persistence error handling | **Silent retry on failure, never block the toggle.** `next-themes` and `i18next-browser-languagedetector` stay as the source of truth for the instant UI; the backend is a best-effort write. If the write fails, the user sees no error and the next page load re-fetches the saved preference (which still works locally). — **LOCKED Q21 (option A)** | No — Q11 is locked without this |
| 5 | Sidebar footer avatar | **Show `user.image` if set, fall back to initials.** One-line change to `panel.tsx` footer. — **LOCKED Q22 (option A)** | No — Q11 is locked without this |
| 6 | Public page "Sobre" section placement | **Below the social links, above the active announcements.** Description is metadata; announcements are the primary surface. — **LOCKED Q23 (option A)** | No — Q14c is locked without this |
| 7 | Route file naming for the new detail page | **`/panel/dashboard/announcements/:id`** (English, matches sidebar `meus_anuncios` link). The existing PT `:id/pagamento` is a known deferred item and stays for now. — **LOCKED Q24 (option A, re-asserted by the user via the "English in all code" rule in `RULES.md` §6)** | No — Q18 is locked without this |
| 8 | Public DTO field order | **N/A** — DTOs are TS interfaces, no "order". Page layout is a separate question (covered by Q14c, Q15, and #6 above). | No |

**Recommendation: do not block Ralph Loop on any of these 8.** They are cosmetic. Ralph can apply the defaults above; the user can override in code review or in a follow-up grilling session.

## What CAN move forward regardless (the "ready for PRD/Ralph" set)

**Update 2026-06-10 (end of session):** All 25 decisions are now locked (Q1–Q18 from the original pass; Q19–Q25 from the "finish grilling" pass that resolved the 8 open UX questions). The PRD-scope rule (locked + zero open-question dependencies) is satisfied for every decision. **The entire scope of this session can be PRD'd and handed to Ralph Loop without further grilling.**

### Operational rules added this session (live in `agents.local.md`)

- **§4 "No centered content — full-width layout by default"** — every page fills the available width; `mx-auto max-w-*` is forbidden except for the documented exceptions.
- **§5 "English in all code"** — cross-references `RULES.md` §6. All code artifacts (file names, variable names, function names, route paths, i18n key paths) must be English.
- **§5 "Act on PT-named items in touched scope; stack leftovers"** — when a task touches a PT-named item, translate it as part of the same change; log any other PT-named items found in the same area but not in scope as a new `deferred` row in `.specify/memory/backlog.md` (under the "Mixed-language route naming fix" policy row). The backlog file is the stacking point — `agents.local.md` holds the policy, not the items. 3 initial items stacked: `panel.conta` (file + URL), `panel.dashboard.anuncios.*` (file family + URLs), `dashboard.anuncios.*` i18n keys.

### Backend / non-UI subset (the most "ready to start" group)

These decisions are purely architectural and have no UI surface. Ralph can build them in any order without waiting on UI:

- **Q1** — User/Provider Profile strict split (API surface decision)
- **Q3** — No CNPJ in this pass (scope cut)
- **Q8** — Backend split; schema via `db:generate`; i18n keys English
- **Q9** — Provedor sidebar group visibility rule (the rule, not the UI rendering)
- **Q10** — Fix Provedor condition in `panel.tsx` (code fix)
- **Q11 (schema part)** — Add `language` and `theme` columns to `user` table
- **Q14 (data part)** — Public Description 500 char cap (Zod validator)
- **Q17** — Provider Profile authorization model (self-read, upsert, public DTO extension)
- **Q18 (backend part)** — The new `/panel/dashboard/announcements/:id` route needs a tRPC procedure for fetching one announcement by id + Provider-ownership check

### Frontend / UI subset (ready but bigger)

These decisions are locked and have default values for the 8 open UX questions. Ralph can build them. The defaults are documented above and in the session summary table.

- **Q2, Q4, Q5, Q6, Q7, Q11 (UI part), Q12, Q13, Q14 (UI part), Q15, Q16, Q18 (UI part)** — All 12 frontend/UI decisions.

### ADRs (recommended in this epic)

- **ADR 0005** — User vs Provider Profile strict split
- **ADR 0006** — No centered content — full-width layout by default

## Recommendation for the next step

The user can now write the PRD (or have the agent write it). The PRD should cover all 25 decisions in this single document, since the open-question dependencies are fully resolved. The user explicitly stated they will run the `to-prd` skill themselves; this summary is the input the skill will consume.

## What was NOT grilled (out of scope or known)

- The actual `announcement.update` use case / tRPC procedure (no change needed — the edit form just moves from modal to inline page).
- The actual `announcement.getAnalytics` use case (no change needed — the chart moves from modal to inline section).
- The pay/renew flows (still navigate to `/panel/dashboard/anuncios/:id/pagamento`).
- The existing `user.getPublicProfile` (public endpoint, just extends the DTO).
- The admin list providers flow (no change in this epic).

## Captured in project files

- `CONTEXT.md` — added "User vs Provider Profile ownership" + "Provider Profile (current scope — Option A)" + "Provider Profile (future — Option B, deferred)" + "Provedor group visibility for new users (Option A — strict)"
- `agents.local.md` §4 — added "No centered content — full-width layout by default" rule
- `backlog.md` — two items moved from `deferred` to `active` (Provider config page, Meus Anúncios page); one item ADDED as `deferred` (Company Provider — Option B); new "Backend language preference persistence" status update recommended when epic starts
- `grilling_history.md` — 18 question/answer entries appended under "Session 2026-06-10"

## What the user can do next

- **Write a high-level plan** (`.specify/memory/plans/provider-section-reorg.md`) that consolidates the 18 decisions + the open UX questions + the file impacts into a single document. This is the precursor to the epic.
- **Or write the epic directly** (using the `to-epic-issues` skill or manually), with task files at `.specify/memory/epics/13-provider-section-reorg/`. The skill note: this user has the to-epic-issues skill as hub-protected, so manual creation is fine. Recommended epic decomposition (subject to user approval): 8–10 task files, ordered by dependency (schema → backend → Conta slim → Configurações page → Meus Anúncios list → Meus Anúncios detail → Dashboard slim → public page rendering → i18n keys → ADRs).
- **Or do nothing yet** — the decisions are captured in the four project files. Revisit when ready to plan/implement.

---

## Post-grilling activity log (2026-06-10)

### Event: PRD-v7 merged into root PRD + epic 13 created (10 task files)

**Trigger:** User invoked the `to-epic-issues` skill with the intent to merge PRD-v7 (`/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/prds/PRD-v7-provider-section-reorg.md`) into the root PRD and create the epic + task files.

**Outcome:**
1. Two non-versioned files in `.specify/memory/prds/` that looked like root PRDs (`prd.md`, `prd-technical-debt-round-2.md`) were renamed to `_DEPRECATED_prd.md` and `_DEPRECATED_prd-technical-debt-round-2.md` with deprecation headers pointing to the active root PRD at `/PRD.md`. This prevents the "wrong root PRD" misread on future runs.
2. PRD-v7 was **merged into the root PRD INDEX** at `/PRD.md` (the active root PRD at the repository root). A new row for PRD-v7 was added to the index table and marked **CURRENT**; PRD-v6 was demoted to **SUPERSEDED**. The versioned source `PRD-v7-provider-section-reorg.md` is the single source of truth — `/PRD.md` does NOT inline PRD-v7's content. (Initial attempt inlined PRD-v7 as Module 25; the user course-corrected to the index model, and Module 25 was reverted. `/PRD.md` now ends at Module 24 for the historical inlined modules, with the index appended at the end.)
3. Epic `13-provider-section-reorg` was created at `.specify/memory/epics/13-provider-section-reorg/` with 10 dependency-ordered task files:
   - `01_schema_migrations.md` — Drizzle schema additions (5 `provider_profile` columns + 2 `user` columns), generated migration.
   - `02_provider_profile_backend.md` — `ProviderProfile` entity + repository + use cases.
   - `03_provider_profile_router.md` — new `trpc.providerProfile` router with `get` and `update`.
   - `04_shrink_user_update_and_dtos.md` — `trpc.user.update` shrinks to User identity; DTOs extend with new fields; `name` → `displayName`.
   - `05_configuracoes_page.md` — full Configurações page (3 sections, per-section save, upload widget).
   - `06_conta_e_seguranca.md` — slim `panel.account.tsx` (renamed from `panel.conta.tsx`) to User identity only; Preferences section; email verification indicator.
   - `07_meus_anuncios_list.md` — real list page (4 tabs, count badges, "+ Criar Anúncio" button).
   - `08_meus_anuncios_detail.md` — new detail page at `/panel/dashboard/announcements/:id` with inline edit + inline analytics; deletes the two modals.
   - `09_dashboard_slim_and_sidebar.md` — slim dashboard to 4-card KPI strip + chart; fix `GROUP_PROVEDOR.condition` to `hasProviderAssignmentWithEnabledTrue`; add route guards; wire header toggles to backend persistence.
   - `10_public_page_and_adrs.md` — render the full branding set on the public Provider page; translate the public route to English; write ADR 0005 + ADR 0006.
4. `.specify/memory/index.md` was updated with the new epic and the 10 task rows (epic row + status updates).
5. `agents.local.md` was updated: the PRD directory list was corrected (added v6 + v7; marked the two orphan files as deprecated); the "Current Plan Reference" section was rewritten to describe the index structure (thin INDEX in `/PRD.md` pointing to the versioned PRDs, with PRD-v7 as CURRENT); the next-active-epic was updated from Panel Layout to `13-provider-section-reorg`.
6. `backlog.md` was updated: two items already `active` (Provider configuration page, Meus Anúncios) had their linked PRD reference corrected from PRD-v5 to PRD-v7 (the current PRD) and their scope updated; the "Backend language preference persistence" item was moved from `deferred` → `active` (now in scope for epic 13 task `06_conta_e_seguranca`).

**Important course-correction (mid-task):** the user clarified that "merge" in this project should mean "thin INDEX in `/PRD.md` pointing to the versioned PRDs in `prds/`" — not inlining. The first attempt inlined PRD-v7 as Module 25 of `/PRD.md`; the user caught it, the inlining was reverted, and the index structure was appended instead. This rule was saved to memory and is now also documented in `/PRD.md` itself as "Root PRD Contract — This File Is An Index, Not An Inline Compilation". From PRD-v8+ on this project, the agent maintains only the index — never inlines.

**Testing policy baked into every task file:**
- No `test.skip()`. If a test needs seed data, Ralph Loop creates the seed; the test runs for real.
- Visual regressions are test failures. Every Playwright test verifies the visual contract.
- No mocked end-to-end flows. Backend tests use the real test database; frontend tests use the real tRPC client.
- Black-box behavior only. Tests should not reference internal function names or rely on a particular component tree.

**Implementation order is dependency-driven and mandatory:**
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10. Each task's `blocked-by` frontmatter enforces this; Ralph Loop must respect it.

**Files touched in this event:**
- `/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/PRD.md` (Module 25 inlined, then reverted; thin-index section appended at end)
- `/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/prds/_DEPRECATED_prd.md` (renamed from `prd.md`, deprecation header added)
- `/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/prds/_DEPRECATED_prd-technical-debt-round-2.md` (renamed from `prd-technical-debt-round-2.md`, deprecation header added)
- `/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/epics/13-provider-section-reorg/epic.md` (new)
- `/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/epics/13-provider-section-reorg/tasks/01..10_*.md` (new, 10 files)
- `/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/index.md` (epic + task rows added, deprecation note updated)
- `/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/agents.local.md` (PRD directory list + Current Plan Reference updated)
- `/home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/backlog.md` (2 active items updated, 1 deferred → active)

---

<!-- INDEX SYNC: After completing or modifying this file, update .specify/memory/index.md in the same turn. -->
