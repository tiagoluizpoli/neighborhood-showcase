# PRD-v12 — Provider Identity, Configuration IA, and Public Profile

## Problem Statement

A provider's identity is underdesigned across both the surfaces it lives on: the
private configuration page (`panel/provider/configuration.tsx`, split into
`PublicProfileSection` → `ContactChannelsSection` → `VisibilitySection`) and the
public provider page (`_portal.providers.$id.tsx`). The provider has three image
roles — `avatarUrl` (circular 1:1), `logoUrl` (square 1:1), `bannerUrl` (16:9) —
with no rule for which one *is* the provider. The result is a set of concrete
defects from packet 03:

- **No identity model.** Nothing decides whether a provider is represented by
  avatar, logo, or banner. The public hero renders logo-OR-avatar and then an
  ALWAYS-on second avatar, so the same provider shows two identity marks at once
  (duplication).
- **Awkward image UX.** The `ImageUploadField` exposes a raw URL text input
  (`urlInput`) the provider does not care about, and once an image is set there
  is no first-class way to **re-crop** it — the provider must re-upload the file
  just to re-frame the crop, which is unacceptable.
- **No re-crop source.** Image fields persist only the final cropped URL, so even
  if a re-crop action existed there is no original to re-crop from without
  quality loss.
- **Weak configuration IA.** Identity/branding, contact, and visibility are
  stacked with visibility last, behind a heavyweight Card that gives a simple
  on/off toggle far more visual weight than it deserves, while identity has no
  live preview of what the provider will actually look like.
- **Stretched, sparse public page.** The public provider page stretches
  edge-to-edge and has no graceful layout for a provider with minimal branding;
  the desktop composition does not lead with a clear identity hero.

The root cause is single: provider identity is one system that spans the private
config context and the public page context, and it has never been modeled as
one. Everything downstream (image lifecycle, config IA, public composition)
depends first on a precedence rule for avatar vs logo vs banner.

The i18n leaking-helper-keys complaint (#3) is already resolved by the prior
dashboard→provider section refactor; all current keys resolve in pt+en. It is
not re-planned here beyond a final parity check.

## Solution

Treat provider identity as ONE system with a shared precedence rule as its spine,
then fix the image lifecycle (including the backend change needed to re-crop from
an original), then reorganize the config page IA, then recompose the public page
to consume the same rule.

**One identity precedence rule, one shared helper.**

- Banner is an optional wide background only — never an identity mark.
- Exactly ONE identity mark renders anywhere, by precedence `logo` → `avatar` →
  initials fallback. Logo and avatar never render together.
- Both fields stay (avatar = individual, logo = company); only the precedence
  winner renders.
- The rule lives in ONE shared helper reused by the config live preview, the
  public hero, and provider cards. It is the spine every other slice consumes.

**Image-asset lifecycle with re-crop from original.**

- Each identity asset moves through states empty → cropping (modal) → filled.
- The filled state exposes three actions: **Replace** (pick a new file),
  **Re-crop** (re-open the cropper on the existing image, NO re-upload), and
  **Remove**.
- Drop the raw URL text input from the provider UI. URL stays valid at the data
  layer; it just leaves the provider-facing form.
- One `ImageUploadField`, with preview shape/size parameterized per role: banner
  16:9 wide, avatar round, logo square.
- **Re-crop reopens the cropper on the ORIGINAL full-resolution upload**, so the
  provider can widen or re-frame with no quality loss. This requires persisting
  the original source alongside the derived crop — a schema/storage change, not
  just a form change (see Implementation Decisions).

**Configuration page IA, identity-first.**

- Section order becomes: (1) **Identity & branding** (avatar/logo/banner + names)
  WITH a small live preview rendering the precedence winner; (2) a **compact
  Public-visibility toggle ROW** promoted near the top — the heavyweight Card is
  removed; (3) **Contact channels**.
- The visibility toggle keeps its current debounced auto-save behavior unless
  that conflicts with the new compact placement.

**Public provider page, identity-hero composition.**

- Desktop priority: **identity hero → active announcements (main full-width body)
  → contact (persistent secondary)**. Banner stays as the hero background.
- Render exactly ONE identity mark via the shared helper; REMOVE the always-on
  second avatar.
- Sparse-branding fallback: collapse the hero to a compact centered identity band
  (initials + name + description), announcement grid full-width, the whole page
  capped in a max-width container so it never stretches edge-to-edge.
- The existing announcement-card link/grid behavior is preserved; only the
  page composition, width, and fallback change — not the card contract.

## User Stories

1. As a provider, I want one clear identity mark to represent me everywhere, so that I am not shown as two different things at once.
2. As a company provider, I want my logo to be the identity mark when I have one, so that my brand leads.
3. As an individual provider, I want my avatar to be the identity mark when I have no logo, so that I am still recognizable.
4. As a provider with neither logo nor avatar, I want a clean initials fallback, so that my page still looks intentional.
5. As a provider, I want the banner to be only a background, so that it sets a mood without competing as my identity.
6. As a provider, I want logo and avatar never to appear together, so that my page reads as one identity, not two.
7. As a provider, I want to upload an identity image and crop it in a modal, so that I control exactly how it is framed.
8. As a provider, I want to Replace a filled image with a new file, so that I can swap it without hunting for a hidden control.
9. As a provider, I want to Re-crop a filled image without re-uploading it, so that re-framing is quick and lossless.
10. As a provider, I want re-cropping to work from my original full-resolution upload, so that widening or re-framing loses no quality.
11. As a provider, I want to Remove an image, so that I can fall back to the next identity option deliberately.
12. As a provider, I do not want a raw URL text box in my branding form, so that the form is about pictures, not links.
13. As a provider, I want each image to preview in its real shape — banner wide, avatar round, logo square — so that I see what others will see.
14. As a provider, I want the configuration page to start with identity and branding, so that the most defining settings come first.
15. As a provider, I want a small live preview of my identity mark while I edit branding, so that I can see the precedence winner before I save.
16. As a provider, I want the public-visibility control to be a compact toggle row near the top, so that it is easy to reach without dominating the page.
17. As a provider, I want my visibility toggle to keep saving automatically, so that flipping it just works.
18. As a provider, I want contact channels to come after identity and visibility, so that the page flows from who I am to how to reach me.
19. As a resident, I want a provider's public page to lead with a clear identity hero, so that I immediately know who I am looking at.
20. As a resident, I want the provider's active announcements as the main body, so that I can see what they offer right away.
21. As a resident, I want contact to stay available as a persistent secondary element, so that I can reach the provider at any point.
22. As a resident, I want a provider with minimal branding to still get a tidy centered identity band, so that sparse pages do not look broken.
23. As a resident, I want the public page capped to a max width, so that it never stretches uncomfortably edge-to-edge on wide screens.
24. As a developer, I want one shared identity-precedence helper reused by config preview, public hero, and cards, so that the rule cannot drift between surfaces.
25. As a developer, I want a single `ImageUploadField` parameterized per role, so that there is one cropper/upload code path, not three.
26. As a developer, I want the original upload persisted alongside the crop, so that re-crop-from-original is backed by real data, not a UI illusion.
27. As a developer, I want the identity helper and image lifecycle (with original retention) landed before the public-page recomposition, so that the page consumes a stable contract.
28. As a developer, I want the announcement-card link/grid contract left unchanged, so that recomposition is layout-only and does not regress the cards.
29. As a maintainer, I want issue #3 (i18n leaking keys) treated as resolved with only a pt/en parity check, so that closed work is not re-planned.

## Implementation Decisions

- **Identity precedence is the spine.** Implement ONE shared helper that takes a
  provider's `logoUrl` / `avatarUrl` / name and returns the single identity mark
  to render (logo → avatar → initials) plus whatever the banner background needs.
  Both `avatarUrl` and `logoUrl` remain as distinct fields; precedence only
  decides what renders. The config live preview, the public hero
  (`_portal.providers.$id.tsx`), and provider cards all consume this one helper.
  Banner is never an identity mark.
- **One `ImageUploadField`, role-parameterized.** Collapse the three image roles
  onto a single component whose preview shape/size is parameterized: banner 16:9
  wide, avatar round, logo square. Remove the `urlInput` affordance from the
  provider-facing usage (the prop/data path can remain valid at the data layer,
  but the provider UI no longer renders a URL text box).
- **Filled-state actions are Replace / Re-crop / Remove.** Re-crop re-opens the
  existing cropper modal on the already-set image and does NOT trigger a new file
  upload. Replace picks a new file (re-entering the crop flow). Remove clears the
  field and lets precedence fall through to the next option.
- **Original-image retention is a backend/schema slice.** `provider_profile`
  currently stores only the final cropped URLs (`avatar_url`, `logo_url`,
  `banner_url`). Re-crop-from-original requires persisting an original-source
  reference per role alongside the derived crop, plus an upload/storage strategy
  for that original. Carry this as its own server slice (schema migration +
  upload/storage + profile read/write contract) sequenced BEFORE the re-crop UI
  that depends on it. Follow the project's migration conventions; rebuilding the
  base migration drops embedded postgis/seed SQL, so additive migration is
  preferred.
- **Config IA order is identity → visibility → contact.** Section order:
  (1) Identity & branding (avatar/logo/banner + display/company/trade names) with
  a small live preview rendering the precedence winner; (2) a compact
  Public-visibility toggle ROW near the top, replacing the heavyweight
  `VisibilitySection` Card; (3) Contact channels. Preserve the visibility
  toggle's existing debounced auto-save unless it conflicts with the compact
  placement.
- **Public page composition is hero → announcements → contact.** Desktop priority
  is identity hero (banner as background, single identity mark) → active
  announcements as the full-width main body → contact as persistent secondary.
  Remove the always-on second avatar. Sparse-branding fallback collapses the hero
  to a compact centered identity band (initials + name + description) with a
  full-width grid, and the whole page is capped in a max-width container.
- **Card contract is unchanged.** The announcement-card link and grid behavior on
  the public page stays as-is; only composition, width, and the sparse fallback
  change.
- **Sequencing.** Land the shared identity helper and the image lifecycle
  (including original retention) first; recompose the public page last, on top of
  the stable helper. Config IA can proceed in parallel with the public page once
  the helper exists.
- **i18n.** Issue #3 is resolved; only a final pt/en parity pass on the
  reorganized config sections remains. All new visible strings still go through
  i18next `t()` with keys added to both pt and en locale files. No raw keys.
- Spacing/density tokens for the reorganized config sections and the public hero
  are left to implementation against existing UI primitives; they were not pinned
  in grilling.

## Testing Decisions

- Good tests verify externally visible behavior and contract boundaries, not
  widget internals. For this packet that means the identity-precedence outcome,
  the image-action affordances, the config section order, and the public-page
  composition/fallback.
- **Identity helper is the highest, cheapest seam.** Unit-test the shared
  precedence helper directly: logo wins over avatar; avatar wins when no logo;
  initials when neither; banner never counts as an identity mark. This one test
  protects every surface that consumes it.
- **Image lifecycle.** Component-test `ImageUploadField`: empty → cropping →
  filled transitions; the filled state exposes Replace, Re-crop, and Remove; the
  provider UI exposes no URL text input; preview shape matches the role. Assert
  Re-crop opens the cropper without initiating a new upload.
- **Original retention (backend).** Add a server test that saving an image
  persists both the cropped URL and the original-source reference, and that the
  profile read contract returns the original so the UI can re-crop from it.
- **Config IA.** Route/component test asserting section order is identity &
  branding → visibility row → contact, that the live preview renders the
  precedence winner, and that the visibility control is the compact row (not the
  old heavyweight Card) while preserving auto-save.
- **Public page.** Test that exactly one identity mark renders (the second avatar
  is gone), that composition is hero → announcements → contact, that the
  sparse-branding fallback renders the compact centered identity band with a
  full-width grid, and that the page is width-capped. Assert the announcement
  card link/grid contract is unchanged.
- Reuse existing prior art: `-provider-profile.test.tsx` and the existing
  route-level panel tests (RTL); follow existing Playwright patterns for the
  end-to-end config-edit and public-view flows with seeded provider data. When
  reading a full `bun test` run, verify suspicious failures per-file due to known
  cross-file `mock.module` leakage.

## Out of Scope

- Re-planning issue #3 (i18n leaking helper keys); it is resolved. Only a pt/en
  parity check remains.
- Changing the announcement-card link or grid contract on the public page; this
  packet is composition/width/fallback only.
- Redesigning the contact-channels model itself (the PRD-v10 contact contract);
  it only changes position in the config IA.
- Exact spacing/density tokens for the reorganized config sections and the public
  hero — left to implementation.
- Any change to the per-announcement image (`announcement.imageUrl`) flow handled
  by PRD-v11; this packet covers provider-profile identity assets only.
- A broader panel-shell or navigation redesign.

## Further Notes

- Identity precedence is the load-bearing decision; the duplicated public hero
  (#6) is a direct symptom of its absence, and re-crop-from-original (#2/#7) is
  what forces the backend slice. Sequencing the helper + image lifecycle ahead of
  the public recomposition keeps every consuming surface on a stable contract.
- Both avatar and logo fields are kept deliberately (individual vs company); the
  precedence rule decides rendering, not data retention.
- The original-retention change is the one part of this packet that is NOT
  UI-only: it needs a schema migration, an upload/storage strategy for the
  original, and a profile read/write contract update.
- Source grilling: `.plan/grilling/2026-06-23-03-provider-configuration-and-public-profile-grilling.md`.
  Source handoff: `.plan/handoffs/grill-to-prd-provider-configuration-and-public-profile.md`.
  Source packet: `.plan/sessions/panel-bugs-style-issues/03-provider-configuration-and-public-profile.md`.
</content>
</invoke>
