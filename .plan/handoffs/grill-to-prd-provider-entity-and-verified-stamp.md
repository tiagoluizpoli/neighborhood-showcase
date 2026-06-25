# Handoff: Grilling To PRD

Date: 2026-06-24
Source Session: .plan/grilling/2026-06-24-provider-verified-stamp-and-multi-condo-grilling.md
Status: ready-for-prd
Scope: Foundational provider-entity refactor (user→many providers, provider→one condo) + verified-resident STAMP redesign on provider hero and announcement cards.

## Headline Reframe (overturned the seed)

The grill overturned the seed's locked premise. The seed assumed "one provider in many condos." The real intent is the inverse:

- A USER owns MANY PROVIDERS.
- Each PROVIDER is bound to exactly ONE condo and has its own profile, announcements, and stamp.
- Today the schema is `provider == user` (1:1): `provider_profile.providerId`, `providerAssignment.providerId`, and `announcement.providerId` are all FKs to `user.id`. There is no standalone provider entity. That is the gap.

## Stable Decisions

### Domain / data model
- Introduce `provider` as a first-class entity: `id`, `ownerId → user.id`, plus existing identity belongs to it.
- A user can own multiple providers; each provider has exactly ONE condo.
- Keep `providerAssignment` as a SEPARATE table; each provider owns exactly one. Re-key `providerAssignment.providerId` from user.id → provider.id. Preserves the type (RESIDENT/MODERATOR/EXTERNAL) + status (PENDING/APPROVED/REJECTED) + proof lifecycle.
- Keep `provider_profile` as a SEPARATE table, re-keyed to provider.id (least churn; identity stays distinct from ownership/condo binding).
- Re-key `announcement.providerId` → provider.id.
- NO unique constraint on (ownerId, condominiumId): a user MAY own two providers in the same condo (provider = business identity, not membership).
- Provider deletion = SOFT delete (`deletedAt` on provider); hide provider + its announcements; preserve payments + analytics history. Matches existing soft-delete convention.

### Auth / role
- Layered: keep a minimal global `user.role` for platform level (admin vs ordinary user). Provider-scoped actions (manage announcements/profile) are gated by the ACTIVE provider's own APPROVED assignment. Ownership established by `provider.ownerId === user.id`.

### Migration / data
- Additive INCREMENTAL migration (new `provider` table, FKs, re-key columns). DO NOT rebuild the base migration (would drop embedded postgis + category seed SQL drizzle won't regenerate). Hand-fix the userId→provider.id re-key SQL.
- NO data-row migration of existing rows. Rebuild the SEED to the new model instead (MVP, undeployed, seed is the only data).
- Seed must exercise THREE states: (1) a user owning 2 providers in 2 different condos (verified in both), (2) a single-provider verified user, (3) a provider with no approved assignment (stamp-absent).

### Panel UX
- BOTH a "My Providers" list/management page AND a persistent header switcher.
- Active-provider context lives in the URL route param: `/panel/provider/$providerId/...` (refresh-safe, deep-linkable; switcher navigates). No session/localStorage store.
- Onboarding: `condo-setup` becomes the REPEATABLE "create a provider" flow, launched from My Providers. A zero-provider user lands on the My Providers empty state → "create your first provider" → condo-setup. One flow for first + Nth provider.

### Verified STAMP (visual + semantics)
- Replaces the "Morador verificado" text badge. Visual = CHECK-SEAL icon + CONDO NAME ONLY (no "verified" word shown). Pill/chip docked top-right of the hero banner.
- Because a provider has exactly one condo, the stamp shows a SINGLE condo name — NO `+N`, ever.
- Eligibility: shows ONLY for assignment type RESIDENT + status APPROVED. EXTERNAL and MODERATOR do NOT earn the resident stamp (MODERATOR could get a distinct badge later).
- Profile hero stamp: ALWAYS shown when eligible (no provider hide-toggle) — it is the condo vouching, not self-promotion.
- Announcement-card mark: HYBRID gate — shows when (provider APPROVED RESIDENT) AND (per-announcement `showVerifiedBadge` = true). Same check-seal + condo-name visual.
- Backend: `get-public-profile` (keyed by provider.id) returns the provider's approved-RESIDENT condo as `{condoId, condoName} | null`, via the existing assignment→condominium join.
- Copy/i18n: visible chip = condo name only; add aria-label + tooltip = pt "Morador verificado em {condo}" / en "Verified resident at {condo}". New keys in BOTH locales (no hardcoded UI text).

## Open Tensions

- Soft-delete provider adds `deletedAt` + query-filter obligations across provider/announcement read paths — make sure every public + panel query excludes soft-deleted providers (and their announcements).
- Re-keying `providerId` user.id → provider.id touches many use-cases/mappers/repositories/tests; the PRD should sequence this as the load-bearing first slice, with the stamp riding on top once the key is in place.
- "Active provider" in the URL means existing `/panel/provider/...` routes must gain a `$providerId` segment — a routing refactor with redirect handling for old links.
- MODERATOR/EXTERNAL providers get NO stamp; confirm there is a sensible empty/neutral hero state for them (no broken slot).
- Auth layering: define exactly which actions are platform-admin vs provider-scoped to avoid permission leaks across a user's own providers.

## PRD Expectations

- Treat this as TWO coupled deliverables sequenced together: (A) provider-entity refactor (schema + re-key + seed + auth + My Providers/switcher + onboarding rewrite), then (B) the verified stamp (hero + announcement card + get-public-profile field + i18n). B depends on A's provider.id keying.
- Preserve every decision above verbatim; the stamp's UI/contract must be stable across the keying change.
- Honor project conventions: no hardcoded UI text (pt+en), additive migration (no base rebuild), seed-over-row-migration, soft-delete convention.

## Next Step

- Run `luna-to-prd` using this handoff plus the canonical grilling session (.plan/grilling/2026-06-24-provider-verified-stamp-and-multi-condo-grilling.md).
