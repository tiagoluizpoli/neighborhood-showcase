---
type: epic
id: E-20
name: "Provider Entity Refactor"
status: ready
blocked-by: []
---

## About this Epic

Make `provider` a first-class entity so one USER can own MANY PROVIDERS, each bound to exactly ONE condo with its own profile, assignment, and announcements. Today "provider" is just the user account: `provider_profile.providerId`, `provider_location.providerId` (providerAssignment), and `announcement.providerId` are all FKs straight to `user.id` (1:1), so a human gets exactly one profile, one condo binding, one announcement stream. This epic introduces a `provider` table (`id`, `ownerId → user.id`, soft-delete `deletedAt`), re-keys those three tables from `user.id` → `provider.id`, rebuilds the seed to the new model, layers auth (minimal global `user.role` + provider-scoped ownership/approved-assignment gating), and reworks the panel: `$providerId` in the URL, a My Providers management page, a persistent header switcher, and `condo-setup` turned into the repeatable create-provider flow. This is the load-bearing deliverable (A); the verified resident stamp (E-21) rides on top of the new `provider.id` keying.

## Context

Canonical PRD: `.plan/prds/PRD-v13-provider-entity-and-verified-stamp.md`

Canonical PRD handoff: `.plan/handoffs/prd-to-issues-provider-entity-and-verified-stamp.md`

Code truth at grill time: schema `packages/db/src/schema/showcase.ts` — `providerAssignment` (`provider_location`, line 122, `providerId` FK→user line 124), `providerProfile` (`provider_profile`, line 148, `providerId` FK→user line 149), `announcement` (`providerId` FK→user line 248). `announcement.showVerifiedBadge` already exists. Global role lives in `packages/db/src/schema/auth.ts`. Migrations are additive over the single base migration `packages/db/src/migrations/0000_concerned_violations.sql`; rebuilding the base drops embedded postgis + category-seed SQL drizzle will not regenerate, so the migration MUST be additive and the re-key SQL hand-fixed. `db:push` blocks on postgis — apply schema directly to dev (`neighborhood_showcase`) + test (`neighborhood_showcase_test`) DBs. NO data-row migration — rebuild `apps/server/src/infrastructure/db/seed.ts` instead (MVP, undeployed; seed is the only data). Soft-delete adds `deletedAt` filter obligations on EVERY provider + announcement read path (public + panel). Auth context: `apps/server/src/presentation/trpc.ts`, `apps/server/src/presentation/context.ts`. Panel routes under `apps/web/src/routes/panel/provider/` and `apps/web/src/routes/panel.provider.*.tsx`; condo-setup at `apps/web/src/routes/panel.provider.condo-setup.tsx` + `apps/web/src/routes/panel/-provider-dashboard-condo-setup-*.tsx`. Verify suspicious `bun test` failures per-file due to known cross-file `mock.module` leakage.

## Child Tasks

| Task ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| T-20-01 | Provider table, re-key migration, domain/repo plumbing, seed rebuild | ready | — | `.plan/epics/20-provider-entity-refactor/tasks/01-provider-table-rekey-and-seed.md` |
| T-20-02 | Provider-profile read/write re-key + soft-delete exclusion | ready | T-20-01 | `.plan/epics/20-provider-entity-refactor/tasks/02-provider-profile-rekey.md` |
| T-20-03 | Announcement read/write re-key + soft-delete exclusion | ready | T-20-01 | `.plan/epics/20-provider-entity-refactor/tasks/03-announcement-rekey.md` |
| T-20-04 | Layered auth — global role + provider-scoped gating | ready | T-20-01 | `.plan/epics/20-provider-entity-refactor/tasks/04-layered-auth.md` |
| T-20-05 | Panel `$providerId` routing + My Providers + switcher + onboarding | ready | T-20-01, T-20-04 | `.plan/epics/20-provider-entity-refactor/tasks/05-panel-routing-and-my-providers.md` |

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update .plan/index.md in the same turn. -->
