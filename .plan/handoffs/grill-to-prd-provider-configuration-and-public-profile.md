# Handoff: Grilling To PRD

Date: 2026-06-23
Source Session: .plan/grilling/2026-06-23-03-provider-configuration-and-public-profile-grilling.md
Status: ready-for-prd
Scope: Provider identity model, configuration page IA, identity-asset image UX,
public visibility placement, and public provider-page composition (packet 03).

## Stable Decisions

- **Identity precedence (root rule):** banner = optional wide background only,
  never an identity mark. Exactly ONE identity mark renders anywhere, by
  precedence `logo` → `avatar` → initials fallback. Never render logo and avatar
  together. Both fields stay (individual vs company); only the precedence winner
  renders. Encode in ONE shared helper reused by config preview, public hero,
  and cards.
- **Image-asset lifecycle:** states empty → cropping (modal) → filled. Filled
  state exposes three actions: **Replace** (pick new file), **Re-crop** (re-open
  cropper on the existing image, NO re-upload), **Remove**. Drop the raw URL text
  input from the provider UI (URL remains valid at the data layer). One
  `ImageUploadField`, preview shape/size parameterized per role (banner 16:9
  wide, avatar round, logo square).
- **Re-crop source:** persist the ORIGINAL full-resolution upload alongside the
  derived crop; Re-crop reopens the cropper on the original so the provider can
  widen/re-frame with no quality loss.
- **Config page IA:** order = (1) Identity & branding (avatar/logo/banner +
  names) WITH a small live preview rendering the precedence winner; (2) compact
  Public-visibility toggle ROW promoted near the top (kill the heavyweight Card);
  (3) Contact channels.
- **Public provider page:** desktop priority identity hero → active announcements
  (main full-width body) → contact as persistent secondary. Banner stays as hero
  background. Render exactly ONE identity mark (remove the always-on second
  avatar). Sparse-branding fallback: collapse hero to a compact centered identity
  band (initials + name + description), grid full-width, page capped in a
  max-width container so it never stretches edge-to-edge.
- **i18n leaking helper keys (issue #3): CLOSED.** Already resolved by the
  dashboard→provider section refactor; all current keys resolve in pt+en. Only a
  final pt/en parity pass on the reorganized sections remains.

## Open Tensions

- **Original-image retention is a backend/schema change, not just UI.** Image
  fields currently store only the final cropped URL; supporting re-crop-from-
  original requires storing an original-source reference (and an upload/storage
  strategy for the original). The PRD must scope this on the server side, not
  only the form.
- Exact spacing/density tokens for the reorganized config sections and the public
  hero were not pinned — leave to implementation against existing UI primitives.
- Whether the compact visibility toggle persists its debounced auto-save
  behavior (current code debounces the switch) — preserve unless it conflicts
  with the new placement.

## PRD Expectations

- Treat provider identity as ONE system spanning private config and public page;
  the shared precedence helper is the spine.
- Sequence the work so the shared identity helper + image-lifecycle (incl.
  original retention) land before the public-page recomposition that consumes
  them.
- Explicitly carry the original-image-retention data/storage change as its own
  backend slice.
- Mark issue #3 (i18n) as already-resolved; do not re-plan it beyond a parity
  check.
- Keep the public surface's existing announcement-card link/grid behavior; only
  change composition/width/fallback, not the card contract.

## Next Step

- Run `luna-to-prd` using this handoff plus the canonical grilling session.
