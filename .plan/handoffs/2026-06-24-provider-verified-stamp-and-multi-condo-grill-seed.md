---
type: grill-seed
date: 2026-06-24
status: to-grill
title: Provider verified stamp redesign + multi-condo management gap
---

# Grill Seed — Provider Verified Stamp & Multi-Condo Gap

This document is a **briefing to be grilled before any implementation**. It states only what was verified in the code, the one product decision already made, and the open questions. Nothing here is built yet. Treat every "fact" below as something to re-confirm if the grill goes deep; treat every "open question" as unresolved.

## Origin

User reviewing the provider public profile + configuration work (epic E-19). Two things triggered this:

1. The verified-resident badge ("Morador verificado") wording and placement felt wrong. User wants it reframed as a **stamp** (the condominium vouching for the provider), **not the word "verified"**, docked **top-right of the profile hero banner**.
2. While reasoning about putting the **condominium name** on the stamp, we discovered a deeper divergence between what the data model/PRD support (multiple condos per provider) and what the UI actually does (single condo, in practice). User wants this covered properly, not patched blindly.

User explicitly chose **direction: honor multi-condo (treat it as a real, supported capability)** — NOT to collapse the product to single-condo.

## Verified facts (with locations)

Identity vs condo-membership are two separate systems:

- **Identity / branding** lives in `provider_profile` (`packages/db/src/schema/showcase.ts:148`). The provider configuration page (`apps/web/src/routes/panel/provider/-configuration-public-profile-section.tsx`) edits only: displayName, companyName, tradeName, logo, banner, publicDescription, contact. **No address, no condo, by design.** This is why the profile page shows "one single profile thing" with no location.
- **Condo membership** lives in `provider_location` (the assignments table; exported as `providerAssignment` in `packages/db/src/schema/showcase.ts:122`). Columns include `providerId`, `type`, `status`, `condominiumId`, `addressId`, `unitInfo`, `proofOfResidency`.
  - `type` enum = `RESIDENT | MODERATOR | EXTERNAL` (`showcase.ts:28`).
  - `status` enum = `PENDING | APPROVED | REJECTED` (`showcase.ts:34`).
  - **No unique constraint** on `providerId` (or on `providerId + condominiumId`) in the schema or migrations. The DB permits many assignments per provider.

Multi-condo is designed-in, not accidental:

- `request-assignment.ts:25` only blocks a duplicate for the **same** condo (`findByProviderAndCondo`). Requesting a **different** condo is allowed → a provider can hold approved RESIDENT assignments in multiple condos.
- **PRD-v3 user story #3 (explicit):** "As a provider, I want to belong to more than one provider assignment, so that I can operate in multiple condominium or address contexts." (`.plan/prds/PRD-v3-backend-domain-alignment.md:44`)

But the UI does NOT support managing multiple condos — this is the real gap:

- `apps/web/src/routes/panel/provider/condo-setup.tsx` is a **one-shot onboarding wizard**: pick flow (sindico / resident / external) → submit → pending → approved.
- `apps/web/src/routes/panel/-provider-dashboard-condo-setup-status-panels.tsx:46` does `myAssignments.find(a => a.status === 'APPROVED')` and, on the **first** approved assignment, short-circuits to a single "Associação Aprovada! Ir para o Painel" card. It ignores any further assignments. There is **no list, no "add another condo," no remove, no manage** screen anywhere.
- The data is there: `trpc.assignment.getMyAssignments` returns an **array**, each item including the `condominium` object (`apps/server/src/presentation/routers/assignment.ts:65`). The UI just never lets you act on more than the first approved one.
- Net: backend + PRD = multi-condo capable; UI = effectively single-condo (onboarding gate only). The seeded test user `provider@test.com` only ever sees the "approved, go to panel" banner — which is what surfaced this.

The "verified" mark today:

- `isVerified` is a **boolean** = `hasApprovedResidentAssignment(providerId)` → exists a RESIDENT + APPROVED assignment (`apps/server/src/infrastructure/db/assignment-repository.ts:177`, consumed in `apps/server/src/application/use-cases/user/get-public-provider-profile.ts:58`). The public profile contract returns **no condominium name** today.
- Public profile hero renders the badge as text "Morador verificado" via the shared hero `verifiedBadge` slot (`apps/web/src/components/provider-identity-hero.tsx`; passed in `apps/web/src/routes/_portal.providers.$id.tsx`). The config live preview currently does **not** pass `verifiedBadge`.
- Announcement cards already render an **icon-only** mark (no text): `CheckCircle2` next to the provider name, gated on the per-announcement boolean `showVerifiedBadge` (`apps/web/src/components/announcement-card.tsx:234`). This is a provider-set, per-announcement toggle, NOT the same source as the profile's `isVerified`.
- i18n keys exist for the badge/toggle copy in both locales (e.g. `provider_profile.verified_resident`, `configuracoes.*verified_badge*`).

## Decision already made (locked unless grill overturns it)

- **Honor multi-condo** (PRD-v3 direction). Do NOT silently collapse to single-condo.
- Stamp visual intent: **icon/crest seal (a check or similar), no "verified" word**, with the **condominium name beside it**; rendered as a **clean pill/chip docked top-right of the hero banner**; `+N` style when verified in multiple condos.
- Scope of the stamp redesign: **provider profile hero + announcement cards**.

## Open questions to grill (unresolved — do not assume)

Multi-condo management gap (the bigger item):

1. Is the missing multi-condo **management UI** in scope for this work, or split into its own epic? (Stamp redesign is small; management UI is a real build.)
2. What should the management surface be? A list of the provider's assignments with statuses, an "add another condo" entry back into the onboarding flow, and remove/leave? Where does it live — condo-setup, configuration, or a new screen?
3. Does the per-announcement `showVerifiedBadge` semantics make sense once multi-condo is explicit? An announcement lives in a specific condo context — should its verified mark mean "verified resident **of that condo**" rather than the global boolean?
4. The public profile page has **no condo context** (it is global). What does "verified resident" even assert there when a provider belongs to several condos — all of them? Any of them?

Stamp specifics:

5. Exact crest/icon (check, shield, crown?) and copy beside it (condo name only? a short label too?).
6. Multiple-condo display rule on the stamp: which name shows first, and what does `+N` expand to (tooltip list? link to profile section?).
7. Backend change to surface condo name(s): `get-public-provider-profile` must return the approved-RESIDENT condo name(s). Confirm shape (single primary + list? array only?) and whether it reuses the same join `getMyAssignments` uses.
8. Does the stamp respect any provider-side show/hide toggle (like the existing `verified_badge` settings), or always show when verified?

Product-truth check:

9. Is there genuinely a use case for one provider operating in multiple condos (PRD-v3 says yes), or is that PRD story stale and the real intent is single-condo after all? This decision gates almost everything above — confirm it explicitly before building.

## What is NOT in question

- The crop/upload pipeline, banner aspect (8:1), and hero layout from E-19 are done and working; this work does not touch them except to add the stamp slot.
- No schema migration is implied by the stamp alone (condo names are reachable via existing assignment→condominium relations).
