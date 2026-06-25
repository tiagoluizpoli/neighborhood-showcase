# Handoff: PRD To Issues

Date: 2026-06-24
Source PRD: .plan/prds/PRD-v13-provider-entity-and-verified-stamp.md
Status: ready-for-issues
Scope: Two coupled deliverables sequenced together — (A) provider-entity refactor
(user→many providers, provider→one condo; new `provider` table + re-key of
provider_profile / provider_location / announcement off `provider.id`; soft-delete;
seed rebuild; layered auth; My Providers page + header switcher; URL `$providerId`
context; repeatable condo-setup onboarding), then (B) verified resident stamp
(check-seal + condo name on profile hero always-on and announcement cards via
hybrid gate; `get-public-profile` condo contract; pt/en i18n).

## Locked Decisions

- `provider` is a first-class entity: `id`, `ownerId → user.id`, soft-delete
  `deletedAt`. Ownership = `provider.ownerId === user.id`.
- User owns MANY providers; each provider bound to exactly ONE condo. NO unique
  constraint on `(ownerId, condominiumId)` — two providers in the same condo are
  allowed.
- Re-key `provider_location.providerId`, `provider_profile.providerId`, and
  `announcement.providerId` from `user.id` → `provider.id`. All three tables stay
  separate. Each provider owns exactly one assignment + one profile.
- Soft-delete a provider hides it + its announcements; preserve payment/analytics
  history. Every public + panel read path must exclude soft-deleted providers and
  their announcements.
- Auth layered: minimal global `user.role` (admin vs user) + provider-scoped
  actions gated by the active provider's APPROVED assignment + ownership.
- Migration is additive/incremental (new table, FKs, re-key columns); base
  migration untouched (postgis + category seed hazard). Hand-fix re-key SQL. NO
  data-row migration — rebuild the SEED instead.
- Seed exercises THREE states: user with 2 verified providers in 2 condos; a
  single-provider verified user; a provider with no approved assignment.
- Panel: BOTH a My Providers management page AND a persistent header switcher.
  Active provider lives in URL `/panel/provider/$providerId/...` (no extra store).
  `condo-setup` is the repeatable create-provider flow; zero-provider users get a
  My Providers empty state.
- Stamp: check-seal icon + condo name only (no "verified" word in chip), pill
  top-right of hero, single condo name (never `+N`). Eligibility = RESIDENT +
  APPROVED only. Profile hero always-on when eligible; announcement card = hybrid
  gate (APPROVED RESIDENT AND `showVerifiedBadge`). EXTERNAL/MODERATOR = no stamp,
  neutral hero state.
- `get-public-profile` keyed by `provider.id` returns approved-RESIDENT condo as
  `{condoId, condoName} | null`.
- i18n: visible chip = condo name; aria-label/tooltip "Morador verificado em
  {condo}" / "Verified resident at {condo}". New pt+en keys; no hardcoded UI text.

## Decomposition Constraints

- Sequence (A) BEFORE (B). The `provider.id` re-key is the load-bearing first
  slice; the stamp rides on top. Stamp UI/contract must stay stable across the
  keying change.
- Carry the schema/migration + seed rebuild as the foundational slice, then the
  re-key of each read/write path (profile, assignment, announcement), then panel
  routing ($providerId) + My Providers + switcher + onboarding, then the stamp
  backend contract, then the stamp UI (hero + announcement card) + i18n.
- The routing refactor must handle redirects for old `/panel/provider/...` links.
- Confirm a neutral hero state for MODERATOR/EXTERNAL providers (no broken slot).
- Pin down platform-admin vs provider-scoped actions to avoid cross-provider
  permission leaks.

## Out Of Scope

- Data-row migration of existing rows (seed rebuild replaces it).
- Rebuilding the base migration.
- A distinct MODERATOR badge.
- Any `+N` / multi-condo stamp display rule.
- Cross-provider aggregate views beyond the My Providers list.

## Next Step

- Run `luna-to-issues` using this handoff plus the canonical PRD
  (.plan/prds/PRD-v13-provider-entity-and-verified-stamp.md).
