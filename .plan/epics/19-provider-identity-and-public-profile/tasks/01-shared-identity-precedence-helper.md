---
type: task
id: T-19-01
epic: E-19
status: done
blocked-by: []
default-model: medium
---

## What to Build

Implement ONE shared identity-precedence helper — the spine of this epic. Given a provider's `logoUrl` / `avatarUrl` / name, it returns the single identity mark to render by precedence `logo → avatar → initials`, plus whatever a banner background consumer needs. Banner is NEVER an identity mark, and logo and avatar never render together. Both `avatarUrl` and `logoUrl` remain distinct fields; the helper only decides what renders. This helper is the contract the config live preview (T-19-04), the public hero (T-19-05), and provider cards all consume, so it must land first and be unit-tested as the highest, cheapest seam.

## Context

`apps/web/src/routes/_portal.providers.$id.tsx` currently inlines its own logo-OR-avatar decision and then renders an always-on second avatar; provider identity is decided ad hoc per surface today, which is exactly the drift this helper removes. The helper is pure (no React, no I/O) and returns a discriminated result the callers can branch on: `{ kind: 'logo' | 'avatar', src } | { kind: 'initials', initials }`, plus the banner URL passthrough so a hero can use it as a background. Keep initials derivation consistent with how names are already abbreviated on existing surfaces. No persisted data shape changes here — this is a rendering-decision helper only.

## Acceptance Criteria

- [ ] A single pure helper exists (e.g. `resolveProviderIdentity`) returning the precedence winner: logo when present, else avatar, else initials fallback.
- [ ] Banner is never returned as an identity mark; if a banner passthrough is exposed it is clearly separate from the identity-mark result.
- [ ] Both `logoUrl` and `avatarUrl` are accepted as inputs and never both surface as identity marks simultaneously.
- [ ] Initials fallback derives stable, sensible initials from the provider name.
- [ ] The helper is unit-tested directly: logo wins over avatar; avatar wins when no logo; initials when neither; banner never counts as an identity mark.
- [ ] No persisted schema or profile-contract change is introduced by this task.

## Sub-Tasks

### ST-01 - Implement the shared identity-precedence helper

status: done
model: medium
escalate-if:
- A single return contract cannot serve config preview, public hero, and cards without per-caller special-casing.
- Existing surfaces derive initials in incompatible ways that cannot be unified without changing visible output.

blocked-by: []

what-to-do:
- Add a pure helper module that takes `{ logoUrl, avatarUrl, name }` (plus banner passthrough as needed) and returns the discriminated identity-mark result by precedence `logo → avatar → initials`.
- Keep banner strictly separate from the identity-mark result.
- Derive initials from the provider name consistent with existing abbreviation behavior.

files-to-touch:
- `apps/web/src/utils/provider-identity.ts`

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Created `apps/web/src/utils/provider-identity.ts` exporting `resolveProviderIdentity`, `deriveInitials`, `ProviderIdentityInput`, `ProviderIdentityMark`, `ProviderIdentityResult`.
- `ProviderIdentityMark` is a discriminated union: `{ kind: 'logo' | 'avatar'; src }` or `{ kind: 'initials'; initials }`.
- `bannerUrl` is a separate field in `ProviderIdentityResult` — never an identity mark.
- `deriveInitials` matches the existing `getInitials` implementation in `_portal.providers.$id.tsx` (single word → first 2 chars, multi word → first[0] + last[0]).
- Gates: `bun run check` clean (pre-existing biome-config warning + broken symlink only); `bunx tsc --noEmit --skipLibCheck` no errors in provider-identity.ts.

### ST-02 - Unit-test the precedence rule

status: done
model: medium
escalate-if:
- The precedence outcomes are not deterministically assertable from helper inputs alone.

blocked-by:
- ST-01

what-to-do:
- Add a unit test covering: logo over avatar; avatar when no logo; initials when neither; banner never an identity mark.
- Cover initials derivation for single- and multi-word names.

files-to-touch:
- `apps/web/src/utils/provider-identity.test.ts`

verification:
- `bun test apps/web/src/utils/provider-identity.test.ts`
- `bun run check-types`

#### Execution Notes

- Created `apps/web/src/utils/provider-identity.test.ts` with 10 tests across two describe blocks: `deriveInitials` (4 cases: single-word → 2 chars, multi-word → first+last initial, empty string, two-word) and `resolveProviderIdentity — precedence` (6 cases: logo wins over avatar, avatar when no logo, initials fallback, banner never identity mark, banner passthrough separate from mark, bannerUrl null when absent).
- Gates: 10/10 pass; biome check clean (1 pre-existing warning only); TS5103 pre-existing tsconfig ignoreDeprecations error unchanged.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
