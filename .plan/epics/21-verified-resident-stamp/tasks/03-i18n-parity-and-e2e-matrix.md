---
type: task
id: T-21-03
epic: E-21
status: in-progress
blocked-by: []
default-model: medium
---

## What to Build

Close out the PRD with an i18n parity pass and a cross-surface E2E matrix that proves the multi-provider + stamp behavior end-to-end. Assert every new stamp/provider key resolves in BOTH pt and en (no hardcoded UI text), matching the existing E-19 i18n parity pass. Extend the E-19 Playwright matrix to cover: a user owning two providers, switching active provider via the header switcher (URL `$providerId` segment updates), deep-link/refresh staying in context, the My Providers empty state routing into condo-setup, and the stamp gating (hero always-on when eligible; announcement card only under the hybrid gate). Add a seed smoke check that the rebuilt seed's three states make each stamp/empty path observable.

## Context

This task depends on the full UI being in place: stamp UI (T-21-02) and panel routing + My Providers + switcher + onboarding (T-20-05). i18n parity prior art + E2E matrix from E-19 (`T-19-06`). Locales `apps/web/src/locales/{pt,en}/translation.json`. Playwright E2E suite lives alongside the existing E-19 matrix. Seed: `apps/server/src/infrastructure/db/seed.ts` produces the three states (2-provider verified user, single verified, no-approved). Verify suspicious `bun test` failures per-file (cross-file `mock.module` leakage).

## Acceptance Criteria

- [ ] An i18n parity test asserts every new stamp/provider key resolves in both pt and en (no missing keys, no hardcoded UI text).
- [ ] E2E: a user owns two providers, switches active provider via the header switcher, and the URL `$providerId` segment updates accordingly.
- [ ] E2E: deep-linking / refreshing a `$providerId` route keeps the correct provider context.
- [ ] E2E: the My Providers empty state routes into condo-setup.
- [ ] E2E: hero stamp shown for an APPROVED RESIDENT provider and absent for EXTERNAL/MODERATOR; announcement-card mark shown only under the hybrid gate.
- [ ] Seed smoke: the three seed states each make a stamp/empty path observable.
- [ ] Gates pass; tests verified per-file.

## Sub-Tasks

### ST-01 - i18n pt/en parity pass for new keys

status: done
model: medium
escalate-if:
- A new key cannot be made parity-clean without a string still hardcoded in a component owned by an earlier task.

blocked-by: []

what-to-do:
- Extend the existing i18n parity test to cover all new stamp/provider keys; assert resolution in both pt and en.
- Fix any missing/hardcoded strings surfaced.

files-to-touch:
- `apps/web/src/locales/pt/translation.json`
- `apps/web/src/locales/en/translation.json`

verification:
- `bun run check-types`
- the i18n parity test passes

### ST-02 - Cross-surface E2E matrix (multi-provider, switcher, routing, stamp)

status: ready
model: medium
escalate-if:
- An E2E scenario cannot be driven without seed/fixtures beyond the rebuilt seed's three states.

blocked-by:
- ST-01

what-to-do:
- Extend the E-19 Playwright matrix: two-provider user, header-switcher provider switch with `$providerId` URL update, deep-link/refresh context retention, My Providers empty state → condo-setup, and stamp gating (hero always-on when eligible; card hybrid gate).
- Add a seed smoke assertion that the three seed states make each stamp/empty path observable.

files-to-touch:
- `apps/web/` (Playwright E2E matrix, alongside the E-19 suite)

verification:
- the extended Playwright matrix passes
- seed smoke: three states observable

#### Execution Notes

- 2026-06-26 — ST-01 done. Added `apps/web/src/i18n-provider-stamp-parity.test.ts` to assert the 16 new `my_providers.*`, `provider_switcher.*`, `verified_resident_stamp.label`, and `provider_profile.verified_resident` keys resolve in both `pt` and `en`, are non-empty, and do not leak raw keys. Also asserted `verified_resident_stamp.label` preserves `{{condo}}` interpolation in both locales.
- Verification: `cd apps/web && bun test src/i18n-provider-stamp-parity.test.ts` passed (2/2). Repo-root `bun run check` passed. Repo-root `bun run check-types` and targeted `cd apps/web && bun x tsc --project tsconfig.json --ignoreDeprecations 5.0 --noEmit` still fail only on pre-existing unrelated errors in `announcement-card.test.tsx` and `panel.dashboard.condo-setup*` files outside ST-01 scope.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
