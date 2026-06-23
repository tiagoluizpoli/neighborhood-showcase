# Grilling Session: Provider Configuration and Public Profile

Date: 2026-06-23
Status: complete
Source Skill: grill-with-docs
Scope: Packet 03 — provider identity model, configuration page IA, identity-asset
image UX, public visibility placement, and public provider-page composition.

## Starting Context

- User prompt: After finishing E-15/E-18 functional testing (both marked done),
  start grilling the next queued packet in
  `.plan/sessions/panel-bugs-style-issues/README.md`. First queued packet is
  `03-provider-configuration-and-public-profile.md`.
- Source packet: `.plan/sessions/panel-bugs-style-issues/03-provider-configuration-and-public-profile.md`
- Initial reasoning:
  - The packet's seven complaints (weak config IA, awkward image UX, leaking
    i18n helper keys, oversized/low visibility control, stretched public page,
    duplicated identity block, sparse low-branding desktop layout) all reduce to
    one root cause: provider identity is underdesigned in both the private
    (config) and public (provider page) contexts.
  - Code cross-reference (2026-06-23): the config page has since moved from
    `panel/dashboard/configuration.tsx` to `panel/provider/configuration.tsx`,
    split into `PublicProfileSection` → `ContactChannelsSection` →
    `VisibilitySection`. Visibility is still last (complaint #4 holds). Three
    image roles exist: `avatarUrl` (circular 1:1), `logoUrl` (1:1), `bannerUrl`
    (16:9). The public hero in `_portal.providers.$id.tsx` still renders
    logo-OR-avatar followed by an ALWAYS-on second avatar (duplication, #6).
  - Everything downstream (image lifecycle, config IA, public composition)
    depends first on a clear identity model: when is a provider represented by
    avatar vs logo vs banner. That is the root question.

## Current Question

None — all packet-03 issues are covered by Q1–Q7. Session is awaiting the user's
explicit "finished" sign-off before marking the packet completed and writing the
grill-to-PRD handoff.

## Future Questions

(none)

## Answered Questions

### Q3 (config IA) + Q6 (config identity preview)
Exact question:
"How should the configuration page be reorganized, and should it show a live
identity-mark preview?"

User answer:
"Identity-first + compact visibility + live preview." (chose recommended)

Decision / takeaway:
- Section order: (1) Identity & branding (avatar/logo/banner + names) WITH a
  small live preview rendering the precedence winner (logo→avatar→initials);
  (2) compact Public-visibility toggle ROW promoted near the top — kill the
  heavyweight Card; (3) Contact channels.
- Resolves packet issues #1 (IA) and #4 (visibility weight/placement); folds in
  the identity preview (was Q6).

### Q4 (public provider page composition + sparse fallback)
Exact question:
"What should the public provider page lead with on desktop, and how to handle
minimal branding?"

User answer:
"Identity hero → announcements → contact." (chose recommended)

Decision / takeaway:
- Desktop priority: identity hero → active announcements (main full-width body)
  → contact as persistent secondary. Banner stays as hero background. Render
  exactly ONE identity mark (Q1 precedence) — REMOVE the always-on second avatar
  (fixes #6 duplication).
- Sparse fallback: collapse hero to a compact centered identity band (initials +
  name + description), announcement grid full-width, page capped in a max-width
  container so it never stretches edge-to-edge. Resolves #5 and #7.

### Q7 (re-crop source)
Exact question:
"Re-crop the stored cropped image, or retain the original and re-crop from it?"

User answer:
"Retain original, re-crop from it." (chose recommended)

Decision / takeaway:
- Persist the ORIGINAL full-resolution upload alongside the derived crop.
  Re-crop reopens the cropper on the original → can widen/re-frame, no quality
  loss. Data-model implication: image fields need an original-source reference,
  not just the final cropped URL. Completes the #2 image-UX lifecycle.

### Q5 (i18n leaking helper keys)
Exact question:
"Leaking-key bug appears already fixed by the dashboard→provider refactor — your
call?"

User answer:
"Already fixed — close it." (chose recommended)

Decision / takeaway:
- Issue #3 is CLOSED. No raw keys on the current provider config page; only a
  final pt/en parity pass on the reorganized sections remains.

### Q2
Exact question:
"Full lifecycle for each identity asset — upload, preview, replace, re-crop,
remove; keep or drop URL entry; one generic control or role-specific?"

User answer:
"Agree drop the URL input — don't care about URL. Disagree on Replace+Remove
only: re-crop MUST be present as its own action. Re-uploading just to re-crop is
unacceptable; it must be simple."

Decision / takeaway:
- Filled-state actions = **Replace** (pick new file), **Re-crop** (re-open crop
  on the existing image without re-upload), **Remove**. Three actions, not two.
- **Drop the raw URL text input** from the provider UI (URL stays valid at the
  data layer).
- One `ImageUploadField`, preview shape/size parameterized per role
  (banner 16:9 wide, avatar round, logo square).

Queue impact:
- Re-crop-without-re-upload raises a data question → added Q7 (retain original
  vs re-crop stored result).
- User requested batching remaining questions → Q3–Q7 promoted to a single
  current batch of mutually-independent questions.

### Q1
Exact question:
"What is the intended provider identity model — which of avatar / logo / banner
is the single primary identity mark, and the precedence when more than one is
set?"

User answer:
"y" (accepted the recommendation as stated).

Decision / takeaway:
- banner = optional wide background only, never an identity mark.
- ONE primary identity mark, precedence: `logo` → `avatar` → initials fallback.
  Never render logo and avatar together.
- Keep both avatar (individual) and logo (company) fields; only the precedence
  winner renders. Precedence lives in one shared helper reused by config
  preview, public hero, and cards.

Queue impact:
- Unblocks Q2 (image lifecycle) as current; downstream Q3/Q4 inherit this rule.
- Directly resolves packet defect #6 (duplicated hero identity block).

## Pruned Questions

(none yet)
