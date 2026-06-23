# Handoff: PRD To Issues

Date: 2026-06-23
Source PRD: .plan/prds/PRD-v12-provider-identity-and-public-profile.md
Status: ready-for-issues
Scope: Provider identity precedence model, image-asset lifecycle (incl.
original-image retention backend slice), configuration page IA reorg, and
public provider-page recomposition (packet 03).

## Locked Decisions

- ONE identity precedence rule: `logo` → `avatar` → initials. Banner is
  background-only, never an identity mark. Logo and avatar never render together.
  Encoded in ONE shared helper consumed by config preview, public hero, and cards.
- One role-parameterized `ImageUploadField`: banner 16:9, avatar round, logo
  square. Provider UI drops the raw URL text input (URL stays valid at data layer).
- Filled-state actions = Replace / Re-crop / Remove. Re-crop reopens the cropper
  on the existing image with NO re-upload.
- Re-crop works from the ORIGINAL full-resolution upload. Persist the original
  source per image role alongside the derived crop — schema + storage + profile
  read/write contract change.
- Config IA order: (1) Identity & branding + live preview → (2) compact
  visibility toggle ROW (kill heavyweight Card) → (3) Contact channels. Preserve
  visibility auto-save/debounce.
- Public page composition: identity hero (banner background, single identity
  mark) → active announcements full-width main body → contact persistent
  secondary. Remove the always-on second avatar. Sparse fallback = compact
  centered identity band + full-width grid + max-width cap.
- Issue #3 (i18n leaking keys) is CLOSED; only a pt/en parity pass remains.

## Decomposition Constraints

- Sequence the shared identity helper FIRST, then the image lifecycle (including
  the original-retention backend slice), THEN the public-page recomposition that
  consumes the helper. Config IA can run in parallel once the helper exists.
- Carry original-image retention as its OWN backend slice (migration + upload/
  storage strategy + profile contract), not folded into the form work.
- Preserve the existing announcement-card link/grid contract; the public-page
  slice is composition/width/fallback only.
- Keep all visible strings through i18next `t()` with pt+en keys.

## Out Of Scope

- Re-planning issue #3 beyond a parity check.
- The PRD-v10 contact-channels model (only its position in the IA changes).
- The per-announcement `announcement.imageUrl` flow (PRD-v11 territory).
- Exact spacing/density tokens; panel-shell/navigation redesign.

## Next Step

- Run `luna-to-issues` using this handoff plus the canonical PRD.
</content>
