---
type: epic
name: "Provider Section Reorg"
status: ready
blocked-by: null
---

## About this Epic

Reorg the panel's Provider experience into four focused surfaces — Conta e Segurança (User identity only), Meus Anúncios list + detail page (Provider announcements only), Configurações (Provider Profile only), and a slim Dashboard. Make the User/Provider Profile split real in code (new `trpc.providerProfile` router, shrunk `trpc.user.update`), gate the Provedor sidebar group by capability, persist theme/language preferences to the backend, and render the full branding set on the public Provider page.

## Context

PRD Module 25 (merged 2026-06-10 from `prds/PRD-v7-provider-section-reorg.md`). The 25 decisions of the 2026-06-10 grilling session are all locked, with zero open-question dependencies. Two non-versioned files in `prds/` were deprecated on 2026-06-10 to prevent the "wrong root PRD" misread.

This epic also produces two ADRs (0005 User vs Provider Profile strict split, 0006 no centered content — full-width layout by default) and generalizes the existing image upload widget into a shared `ImageUploadField` component.

## Implementation Order (dependency-driven)

Tasks MUST be executed in this order. Each task builds on the previous and is not safe to start until its blocked-by is complete.

1. **01_schema** — Drizzle schema additions (5 `provider_profile` columns + 2 `user` columns), generated migration.
2. **02_provider_profile_backend** — `ProviderProfile` entity, `ProviderProfileRepository` interface, `UpdateProviderProfile` and `GetProviderProfile` use cases, mapper, repository impl.
3. **03_provider_profile_router** — new `trpc.providerProfile` router with `get` and `update`, wired through DI.
4. **04_shrink_user_update_and_dtos** — `trpc.user.update` shrinks to User identity; `trpc.user.getProfile` returns extended User-only shape; public DTO extends with 4 new branding fields and `name` → `displayName`; `user-repository.updateProfile` stops writing to `provider_profile`.
5. **05_configuracoes_page** — replace placeholder at `/panel/dashboard/configuration` with full Configurações page (3 sections, per-section save, upload widget), i18n keys, integration with `trpc.providerProfile.update`.
6. **06_conta_e_seguranca** — slim `panel.conta.tsx` to User identity only, rename to "Conta e Segurança", add email verification indicator, add Preferences section, drop centering, full-width layout.
7. **07_meus_anuncios_list** — replace placeholder at `/panel/dashboard/announcements` with real list page (4 tabs, count badges, "+ Criar Anúncio" button, card grid, empty states).
8. **08_meus_anuncios_detail** — NEW route at `/panel/dashboard/announcements/:id` with view mode + inline edit mode + inline analytics section; deletes the two modals from the dashboard.
9. **09_dashboard_slim_and_sidebar** — slim the dashboard to header + 4-card KPI strip + 180px chart; fix `GROUP_PROVEDOR.condition` to `hasProviderAssignmentWithEnabledTrue`; add route guards for the new Provider pages; wire header toggles to persist theme/language via the shrunk `trpc.user.update`; update sidebar footer avatar to use `user.image` if set.
10. **10_public_page_and_adrs** — render the full branding set on the public Provider page (banner, logo, displayName, companyName, tradeName, publicDescription); apply full-width layout; write ADR 0005 and ADR 0006.

## Child Tasks

- [x] 01_schema_migrations.md
- [x] 02_provider_profile_backend.md
- [x] 03_provider_profile_router.md
- [x] 04_shrink_user_update_and_dtos.md
- [x] 05_configuracoes_page.md
- [x] 06_conta_e_seguranca.md
- [x] 07_meus_anuncios_list.md
- [ ] 08_meus_anuncios_detail.md
- [ ] 09_dashboard_slim_and_sidebar.md
- [ ] 10_public_page_and_adrs.md

---

<!-- INDEX SYNC: After completing or modifying any child task file, update .specify/memory/index.md in the same turn. Keep the child task checklist above in sync with actual file statuses. -->
