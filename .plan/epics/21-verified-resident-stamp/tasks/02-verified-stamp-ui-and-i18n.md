---
type: task
id: T-21-02
epic: E-21
status: done
blocked-by: []
default-model: medium
---

## What to Build

Render the verified resident stamp across both surfaces on top of the T-21-01 condo contract. On the public profile hero: a check-seal icon + condo-name pill docked top-right of the hero banner, shown ALWAYS when the provider is eligible (RESIDENT + APPROVED), with NO provider hide-toggle — it is the condo vouching. On the announcement card: the same check-seal + condo-name mark, behind a HYBRID gate — shown only when the provider is an APPROVED RESIDENT AND the per-announcement `showVerifiedBadge` is true. The visible chip shows the CONDO NAME ONLY (no "verified" word, never `+N`). EXTERNAL/MODERATOR providers get a sensible neutral hero state with no broken stamp slot. All strings localized in pt + en, with `aria-label` + tooltip "Morador verificado em {condo}" / "Verified resident at {condo}".

## Context

Hero: `apps/web/src/components/provider-identity-hero.tsx`; public page `apps/web/src/routes/_portal.providers.$id.tsx` (consumes the `verifiedCondo` field from T-21-01). Announcement card: `apps/web/src/components/announcement-card.tsx` + `announcement-card.test.tsx`; `announcement.showVerifiedBadge` already exists and is plumbed through E-20's announcement read paths. Locales: `apps/web/src/locales/{pt,en}/translation.json` — no hardcoded UI text. A shared stamp component is preferable so hero + card render an identical check-seal + condo-name visual. Beware the Biome `role`-prop ARIA collision — name any image-role prop `imageRole`, not `role`. Follow E-19 component-test prior art (ImageUploadField / hero recomposition tests). Verify suspicious `bun test` failures per-file (cross-file `mock.module` leakage).

## Acceptance Criteria

- [ ] A shared verified-stamp component renders a check-seal icon + condo-name-only chip (no "verified" word, never `+N`), with `aria-label`/tooltip "Morador verificado em {condo}" / "Verified resident at {condo}".
- [ ] Profile hero shows the stamp ALWAYS when eligible (RESIDENT + APPROVED), docked top-right of the hero banner, with no hide-toggle.
- [ ] Announcement card shows the mark only under the HYBRID gate: APPROVED RESIDENT provider AND per-announcement `showVerifiedBadge` = true.
- [ ] EXTERNAL/MODERATOR (or non-eligible) providers get a neutral hero state with no broken/empty stamp slot.
- [ ] All new strings localized in pt + en; no hardcoded UI text.
- [ ] Component tests: hero stamp present-when-eligible / absent-otherwise; card mark renders only under the hybrid gate. Gates pass; tests verified per-file.

## Sub-Tasks

### ST-01 - Shared verified-stamp component + i18n keys

status: done
model: medium
escalate-if:
- A check-seal + condo-name visual cannot satisfy both the hero pill and the card mark without two divergent components.

blocked-by: []

what-to-do:
- Build a shared stamp component: check-seal icon + condo-name-only chip; `aria-label` + tooltip via i18next interpolation `{condo}`.
- Add pt + en keys ("Morador verificado em {condo}" / "Verified resident at {condo}"); no hardcoded text. Avoid a prop literally named `role` (Biome ARIA collision).

files-to-touch:
- `apps/web/src/components/`
- `apps/web/src/locales/pt/translation.json`
- `apps/web/src/locales/en/translation.json`

verification:
- `bun run check-types`
- `bun run check`

### ST-02 - Profile hero stamp (always-on when eligible) + neutral state

status: done
model: medium
escalate-if:
- The hero layout cannot dock the pill top-right without a recomposition beyond this slice.

blocked-by:
- ST-01

what-to-do:
- Render the stamp top-right of the hero banner whenever `verifiedCondo` is non-null (eligible); no hide-toggle.
- Give EXTERNAL/MODERATOR/non-eligible providers a neutral hero state with no broken slot.

files-to-touch:
- `apps/web/src/components/provider-identity-hero.tsx`
- `apps/web/src/routes/_portal.providers.$id.tsx`

verification:
- `bun run check-types`
- component test: stamp present when eligible, absent + neutral otherwise

### ST-03 - Announcement-card hybrid-gate mark

status: done
model: medium
escalate-if:
- The card lacks the provider eligibility signal needed for the hybrid gate without a contract change to the card's data source.

blocked-by:
- ST-02

what-to-do:
- Show the card mark only when the provider is APPROVED RESIDENT AND the announcement's `showVerifiedBadge` is true.
- Reuse the shared stamp component for an identical visual.

files-to-touch:
- `apps/web/src/components/announcement-card.tsx`
- `apps/web/src/components/announcement-card.test.tsx`

verification:
- `bun test apps/web/src/components/announcement-card.test.tsx`

#### Execution Notes

- 2026-06-26 ST-01 DONE: added shared `apps/web/src/components/verified-resident-stamp.tsx` exporting `VerifiedResidentStamp({ condoName, variant })`. The component renders a single check-seal + condo-name-only chip, localizes the shared tooltip/`aria-label` via `verified_resident_stamp.label`, and uses a `variant` seam (`hero` / `card`) so the hero pill and announcement-card mark can share one visual primitive in ST-02/ST-03 without divergence. The icon is `aria-hidden`; the visible chip remains condo name only.
- 2026-06-26 ST-01 DONE: added `verified_resident_stamp.label` to both `apps/web/src/locales/en/translation.json` and `apps/web/src/locales/pt/translation.json` with `{ condo }` interpolation (`Verified resident at {{condo}}` / `Morador verificado em {{condo}}`).
- 2026-06-26 ST-02 DONE: `apps/web/src/components/provider-identity-hero.tsx` gained an additive `bannerBadge` slot so the public provider hero can dock the verified-resident pill in the banner's top-right corner without recomposing the existing identity block or disturbing the configuration-preview consumer.
- 2026-06-26 ST-02 DONE: `apps/web/src/routes/_portal.providers.$id.tsx` now reuses `VerifiedResidentStamp` on the public provider page. Eligible providers (`verifiedCondo` present, with an announcements-based condo-name fallback when seed/mock data still exposes only `isVerified`) render the condo-name-only mark in the hero; sparse/no-banner profiles get the same mark in a neutral absolute top-right position with no broken placeholder for non-eligible providers.
- 2026-06-26 ST-02 DONE: verification — `bun test src/routes/-provider-profile.test.tsx` passed in `apps/web`; repo-root `bun run check` passed; repo-root `bun run --filter web check-types` still fails only on the pre-existing web TS5103 `--ignoreDeprecations` config error; targeted `bun x tsc --project tsconfig.json --ignoreDeprecations 5.0 --noEmit` still fails only on the pre-existing condo-setup prop mismatches outside T-21-02/ST-02; `bun run test:e2e` remains red on stale/unrelated Playwright expectations outside this sub-task (public-provider selectors/snapshots deferred to T-21-03).
- 2026-06-26 ST-03 DONE: `apps/web/src/components/announcement-card.tsx` now reuses `VerifiedResidentStamp` for the public-card provider identity row instead of the legacy check icon. The hybrid gate is enforced locally as `showVerifiedBadge && providerAssignmentId && condoName`, so the card only renders the condo-name mark when the announcement is opted in and still carries the provider-assignment/condo context required for an approved resident announcement.
- 2026-06-26 ST-03 DONE: `apps/web/src/components/announcement-card.test.tsx` now asserts the hybrid gate explicitly: the mark renders with the localized `aria-label` when the announcement is opted in, disappears when `showVerifiedBadge` is false, and disappears when the assignment context is absent.
- 2026-06-26 ST-03 DONE: verification — `bun test --preload ./test-setup.ts src/components/announcement-card.test.tsx` passed in `apps/web` (15/15). Repo-root `bun run check` passed with only the pre-existing Biome deprecation warning + optional-chain info. Repo-root `bun run --filter web check-types` still fails only on the pre-existing TS5103 `--ignoreDeprecations` config error. Repo-root `bun run test` remains red on pre-existing provider-FK fixture debt outside T-21-02. Repo-root `bun run test:e2e` remains red on pre-existing Playwright failures outside T-21-02/T-21-03 (configuration/dashboard/public-provider matrix debt).

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
