---
type: epic
id: E-21
name: "Verified Resident Stamp"
status: in-progress
blocked-by: []
---

## About this Epic

Deliverable (B): redesign the verified resident stamp on top of the new `provider.id` keying from E-20. Replace the weak, text-heavy "Morador verificado" badge with a CHECK-SEAL icon + CONDO NAME ONLY (no "verified" word in the visible chip), a pill docked top-right of the hero banner. Because each provider is bound to exactly one condo, the stamp shows a SINGLE condo name — NO `+N`, ever. Eligibility is strict: assignment type RESIDENT + status APPROVED only; EXTERNAL and MODERATOR earn no resident stamp. The profile hero stamp is ALWAYS shown when eligible (the condo vouching, not self-promotion). The announcement-card mark is a HYBRID gate: shown when the provider is an APPROVED RESIDENT AND the per-announcement `showVerifiedBadge` is true. Backend provides a stable condo contract; the UI rides on it; both ship with pt + en i18n and accessibility, then a cross-surface E2E matrix proves the multi-provider/switcher/stamp behavior end-to-end.

## Context

Canonical PRD: `.plan/prds/PRD-v13-provider-entity-and-verified-stamp.md`

Canonical PRD handoff: `.plan/handoffs/prd-to-issues-provider-entity-and-verified-stamp.md`

Blocked by E-20 — the stamp's contract is keyed by `provider.id`, so the provider entity refactor must land first and the stamp UI/contract stays stable across the keying change. Backend public read: `apps/server/src/application/use-cases/user/get-public-provider-profile.ts` (already exposes `isVerified` on `PublicProviderProfileResult.provider`; extend with the condo contract) via the assignment→condominium join. Web hero: `apps/web/src/components/provider-identity-hero.tsx`; public page `apps/web/src/routes/_portal.providers.$id.tsx`. Announcement card: `apps/web/src/components/announcement-card.tsx` (+ `announcement-card.test.tsx`); `announcement.showVerifiedBadge` already exists. Locales: `apps/web/src/locales/{pt,en}/translation.json` — no hardcoded UI text; visible chip = condo name only, with `aria-label` + tooltip "Morador verificado em {condo}" / "Verified resident at {condo}". EXTERNAL/MODERATOR providers must get a neutral hero state with no broken stamp slot. Follow E-19 component-test prior art (ImageUploadField / hero recomposition). Verify suspicious `bun test` failures per-file (cross-file `mock.module` leakage).

## Child Tasks

| Task ID | Task | Status | Blocked By | File |
| --- | --- | --- | --- | --- |
| T-21-01 | `get-public-profile` condo contract | done | T-20-02 | `.plan/epics/21-verified-resident-stamp/tasks/01-get-public-profile-condo-contract.md` |
| T-21-02 | Verified stamp UI + i18n keys | in-progress | — | `.plan/epics/21-verified-resident-stamp/tasks/02-verified-stamp-ui-and-i18n.md` |
| T-21-03 | i18n pt/en parity pass + cross-surface E2E matrix | ready | T-21-02, T-20-05 | `.plan/epics/21-verified-resident-stamp/tasks/03-i18n-parity-and-e2e-matrix.md` |

---

<!-- INDEX SYNC: After completing or modifying any child task file, run
.plan/helper-scripts/sync-state.sh and update .plan/index.md in the same turn. -->
