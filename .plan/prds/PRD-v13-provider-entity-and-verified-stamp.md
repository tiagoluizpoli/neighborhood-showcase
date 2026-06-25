# PRD-v13 — Provider Entity Refactor and Verified Resident Stamp

> Source grilling: `.plan/grilling/2026-06-24-provider-verified-stamp-and-multi-condo-grilling.md`
> Source handoff: `.plan/handoffs/grill-to-prd-provider-entity-and-verified-stamp.md`

## Problem Statement

A neighborhood-services user cannot run more than one business identity, and the
trust signal that proves a provider lives in the condo they serve is weak and
ambiguous.

Two coupled problems, from the user's perspective:

1. **No real provider entity.** Today "provider" is just the user account.
   `provider_profile.providerId`, `provider_location.providerId`
   (providerAssignment), and `announcement.providerId` are all foreign keys
   straight to `user.id` (1:1). A single human therefore gets exactly one
   profile, one condo binding, and one announcement stream. But a real user owns
   *many* businesses — e.g. a cleaning service in condo A and a pet-sitting
   service in condo B — each with its own identity, its own announcements, and
   its own verified standing. The product cannot express this at all.

2. **Weak, text-heavy verified badge.** The current "Morador verificado" text
   badge does not tell a neighbor *which* condo vouches for the provider. With
   the new model — each provider bound to exactly one condo — the badge can and
   should name that condo, as a clean visual seal rather than a generic word.

The first problem is foundational and load-bearing: the stamp's contract is
keyed by provider, so the entity refactor must land first and the stamp rides on
top of it.

## Solution

Deliver two coupled deliverables, sequenced: **(A)** make `provider` a
first-class entity, then **(B)** redesign the verified stamp on top of the new
provider key.

**(A) Provider as a first-class entity.**

- A USER owns MANY PROVIDERS. Each PROVIDER is bound to exactly ONE condo and
  has its own profile, announcements, and assignment/stamp.
- `provider` becomes its own table (`id`, `ownerId → user.id`), with a soft-delete
  `deletedAt`. Ownership is `provider.ownerId === user.id`.
- A user MAY own two providers in the same condo — provider is a business
  identity, not a membership — so there is NO unique constraint on
  `(ownerId, condominiumId)`.
- `provider_profile`, `provider_location` (providerAssignment), and
  `announcement` are re-keyed from `user.id` to `provider.id`, each kept as its
  own separate table (least churn, identity stays distinct from ownership/condo
  binding). Each provider owns exactly one assignment and one profile.
- The panel gains a "My Providers" management page AND a persistent header
  switcher. Active-provider context lives in the URL route param
  `/panel/provider/$providerId/...` — refresh-safe, deep-linkable, no extra state
  store. The switcher navigates.
- Onboarding `condo-setup` becomes the REPEATABLE "create a provider" flow. A
  zero-provider user lands on the My Providers empty state → "create your first
  provider" → condo-setup. One flow for the first and the Nth provider.

**(B) Verified resident stamp.**

- Replaces the "Morador verificado" text badge with a CHECK-SEAL icon + CONDO
  NAME ONLY (no "verified" word in the visible chip). Pill/chip docked top-right
  of the hero banner. Because a provider has exactly one condo, the stamp shows a
  SINGLE condo name — NO `+N`, ever.
- Eligibility: shows ONLY for assignment type RESIDENT + status APPROVED.
  EXTERNAL and MODERATOR do NOT earn the resident stamp.
- Profile hero stamp: ALWAYS shown when eligible (no provider hide-toggle) — it
  is the condo vouching, not self-promotion.
- Announcement-card mark: HYBRID gate — shows when (provider is APPROVED
  RESIDENT) AND (per-announcement `showVerifiedBadge` = true). Same check-seal +
  condo-name visual.
- Accessibility/i18n: visible chip = condo name only; add `aria-label` + tooltip
  pt "Morador verificado em {condo}" / en "Verified resident at {condo}". New
  keys in BOTH locales — no hardcoded UI text.

## User Stories

1. As a user, I want to own more than one provider, so that I can run separate
   businesses in different condos under one account.
2. As a user, I want each of my providers bound to exactly one condo, so that the
   provider's identity and verified standing are unambiguous.
3. As a user, I want to create a second provider in a condo where I already own
   one, so that I can run two distinct businesses in the same building.
4. As a user, I want a "My Providers" page listing all providers I own, so that I
   can see and manage them in one place.
5. As a zero-provider user, I want a clear empty state inviting me to create my
   first provider, so that I know how to get started.
6. As a user, I want one onboarding flow (condo-setup) reused for my first and
   every subsequent provider, so that creating a provider is consistent.
7. As a user, I want a persistent header switcher to change my active provider,
   so that I can move between my businesses quickly.
8. As a user, I want the active provider encoded in the URL, so that refreshing
   or deep-linking keeps me in the right provider context.
9. As a user, I want to manage each provider's profile, announcements, and
   configuration scoped to that provider, so that one business's data never
   bleeds into another.
10. As a user, I want to soft-delete a provider, so that it and its announcements
    disappear from view while payment and analytics history is preserved.
11. As a platform admin, I want a minimal global role distinguishing admins from
    ordinary users, so that platform-level actions stay gated.
12. As a provider owner, I want provider-scoped actions gated by that provider's
    approved assignment and my ownership, so that I cannot act on a provider I do
    not own.
13. As a neighbor viewing a public provider page, I want a check-seal stamp
    naming the condo, so that I instantly trust the provider lives where they
    serve.
14. As a neighbor, I want the stamp to show ONLY for approved resident providers,
    so that the trust mark is never misapplied to external or moderator
    providers.
15. As a neighbor, I want the profile hero stamp always shown when eligible, so
    that verification is the condo vouching, not something the provider can hide
    or fake.
16. As a neighbor browsing announcements, I want the verified mark on a card only
    when the provider is an approved resident AND the provider opted that
    announcement in, so that the mark is both earned and intentional.
17. As a screen-reader user, I want the stamp to expose "Morador verificado em
    {condo}" / "Verified resident at {condo}", so that the meaning is clear even
    though the visible chip shows only the condo name.
18. As a Portuguese or English speaker, I want every new stamp and provider string
    localized in both locales, so that no UI text is hardcoded.
19. As a provider that is EXTERNAL or MODERATOR, I want a sensible neutral hero
    state with no broken stamp slot, so that the page still looks complete.
20. As a developer maintaining read paths, I want every public and panel query to
    exclude soft-deleted providers and their announcements, so that deleted
    businesses never leak.
21. As a developer, I want `get-public-profile` keyed by `provider.id` to return
    the provider's approved-RESIDENT condo as `{condoId, condoName} | null`, so
    that the stamp has a stable data contract.
22. As a developer, I want a rebuilt seed exercising all three states (a user with
    2 verified providers in 2 condos, a single-provider verified user, and a
    provider with no approved assignment), so that every stamp/empty path is
    demonstrable without deployed data.

## Implementation Decisions

**Domain / data model**

- Introduce `provider` as a first-class entity: `id`, `ownerId → user.id`, plus a
  soft-delete `deletedAt`. The provider's identity (profile), condo binding
  (assignment), and announcements belong to it.
- A user can own multiple providers; each provider has exactly one condo. NO
  unique constraint on `(ownerId, condominiumId)` — provider is a business
  identity, not a membership.
- Keep `provider_location` (providerAssignment) a SEPARATE table; each provider
  owns exactly one. Re-key `provider_location.providerId` from `user.id` →
  `provider.id`. Preserve type (RESIDENT/MODERATOR/EXTERNAL) + status
  (PENDING/APPROVED/REJECTED) + proof lifecycle.
- Keep `provider_profile` a SEPARATE table, re-keyed to `provider.id` (least
  churn; identity stays distinct from ownership/condo binding).
- Re-key `announcement.providerId` → `provider.id`.
- Provider deletion = SOFT delete (`deletedAt` on provider). Hide the provider +
  its announcements; preserve payment + analytics history. Matches the existing
  soft-delete convention.

**Auth / role**

- Layered model. Keep a minimal global `user.role` for platform level (admin vs
  ordinary user). Provider-scoped actions (manage announcements/profile) are
  gated by the ACTIVE provider's own APPROVED assignment. Ownership is
  established by `provider.ownerId === user.id`.
- Define explicitly which actions are platform-admin vs provider-scoped to avoid
  permission leaks across a single user's own providers.

**Migration / data**

- Additive INCREMENTAL migration: new `provider` table, FKs, re-key columns. DO
  NOT rebuild the base migration (would drop embedded postgis + category seed SQL
  that drizzle won't regenerate). Hand-fix the `userId → provider.id` re-key SQL.
- NO data-row migration of existing rows. Rebuild the SEED to the new model
  instead (MVP, undeployed, seed is the only data).
- Seed must exercise THREE states: (1) a user owning 2 providers in 2 different
  condos (verified in both), (2) a single-provider verified user, (3) a provider
  with no approved assignment (stamp-absent).

**Panel UX / routing**

- BOTH a "My Providers" list/management page AND a persistent header switcher.
- Active-provider context lives in the URL route param
  `/panel/provider/$providerId/...` (refresh-safe, deep-linkable; switcher
  navigates). No session/localStorage store. Existing `/panel/provider/...`
  routes gain a `$providerId` segment — a routing refactor with redirect handling
  for old links.
- `condo-setup` becomes the REPEATABLE create-provider flow launched from My
  Providers. Zero-provider users get the My Providers empty state → "create your
  first provider".

**Verified stamp contract + UI**

- Backend: `get-public-profile` (keyed by `provider.id`) returns the provider's
  approved-RESIDENT condo as `{condoId, condoName} | null`, via the existing
  assignment→condominium join.
- Stamp visual = check-seal icon + condo name only (no "verified" word in the
  chip), pill docked top-right of the hero banner. Single condo name; never `+N`.
- Eligibility = assignment type RESIDENT + status APPROVED only. EXTERNAL and
  MODERATOR earn no resident stamp (a distinct MODERATOR badge may come later).
- Profile hero: stamp ALWAYS shown when eligible — no provider hide-toggle.
- Announcement card: HYBRID gate — APPROVED RESIDENT provider AND per-announcement
  `showVerifiedBadge = true`.
- EXTERNAL/MODERATOR providers get a sensible neutral/empty hero state with no
  broken stamp slot.
- i18n: visible chip = condo name only; `aria-label` + tooltip "Morador
  verificado em {condo}" / "Verified resident at {condo}". New keys in BOTH pt+en
  locales.

**Sequencing**

- Treat as TWO coupled deliverables sequenced together: (A) provider-entity
  refactor (schema + re-key + seed + auth + My Providers/switcher + onboarding
  rewrite) lands first as the load-bearing slice; (B) the verified stamp (hero +
  announcement card + `get-public-profile` field + i18n) rides on top once the
  `provider.id` keying is in place. The stamp's UI/contract must stay stable
  across the keying change.

## Testing Decisions

- A good test exercises external behavior, not implementation detail: given a
  provider/assignment/announcement state, assert the public contract and rendered
  trust mark — not internal mapper shapes.
- **Re-key correctness (highest seam: use-cases + repositories).** Extend the
  existing integration tests for provider-profile and announcement read paths
  (`get-provider-profile`, `get-public-provider-profile`, `list-public-announcements`,
  `find-public-announcement-by-id`) to assert they key on `provider.id` and that
  soft-deleted providers + their announcements are excluded from every public and
  panel query.
- **`get-public-profile` condo contract.** Integration test that an approved
  RESIDENT provider returns `{condoId, condoName}`, while EXTERNAL/MODERATOR or
  no-approved-assignment providers return `null`.
- **Stamp gating (component).** Profile-hero stamp renders the condo name when
  eligible and is absent otherwise; announcement-card mark renders only under the
  hybrid gate (APPROVED RESIDENT AND `showVerifiedBadge`). Follow existing E-19
  component-test prior art (the ImageUploadField / hero recomposition tests).
- **Multi-provider + switcher + routing (E2E).** Extend the E-19 Playwright
  matrix: a user owns two providers, switches active provider via the header
  switcher, the URL `$providerId` segment updates, deep-link/refresh stays in
  context, and the My Providers empty state routes into condo-setup.
- **i18n parity.** Assert every new stamp/provider key resolves in both pt and en
  (no hardcoded UI text), matching the existing i18n parity pass.
- **Seed smoke.** The rebuilt seed produces the three required states so each
  stamp/empty path is observable.

## Out of Scope

- Data-row migration of existing rows — replaced by a rebuilt seed (MVP,
  undeployed).
- Rebuilding the base migration — additive incremental migration only.
- A distinct MODERATOR badge — EXTERNAL/MODERATOR get no stamp now; a separate
  moderator mark may come in a later effort.
- Any `+N` / multi-condo stamp display rule — dead under provider→one-condo.
- Provider-to-provider data sharing or cross-provider aggregate views beyond the
  My Providers list.

## Further Notes

- Open tensions to honor during build:
  - Soft-delete adds `deletedAt` query-filter obligations across every provider
    and announcement read path (public + panel).
  - The `providerId` re-key (user.id → provider.id) touches many
    use-cases/mappers/repositories/tests; sequence it as the load-bearing first
    slice with the stamp riding on top.
  - URL `$providerId` means the routing refactor must handle redirects for old
    `/panel/provider/...` links.
  - Confirm a sensible neutral hero state for MODERATOR/EXTERNAL providers (no
    broken slot).
  - Pin down exactly which actions are platform-admin vs provider-scoped to avoid
    permission leaks across a user's own providers.
- Project conventions enforced: no hardcoded UI text (pt+en); additive migration
  (no base rebuild); seed-over-row-migration; soft-delete convention.
- Code truth at grill time: `provider_profile.providerId` (PK), 
  `provider_location.providerId`, and `announcement.providerId` are all FKs to
  `user.id`; `announcement.showVerifiedBadge` already exists.
