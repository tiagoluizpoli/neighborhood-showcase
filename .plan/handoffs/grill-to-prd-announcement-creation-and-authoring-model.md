# Handoff: Grilling To PRD

Date: 2026-06-20
Source Session: .plan/grilling/2026-06-20-06-announcement-creation-and-authoring-model-grilling.md
Source Packet: .plan/sessions/panel-bugs-style-issues/06-announcement-creation-and-authoring-model.md
Status: ready-for-prd
Scope: Canonical announcement authoring model for create/edit flows, including contact-channel defaults and overrides, CTA target model, category/tag/money primitives, layout contract, and create/edit parity boundaries.

## Stable Decisions

- The canonical announcement authoring model is three-layered:
  - provider-level contact defaults
  - announcement-level contact overrides
  - separate primary CTA target plus optional secondary targets
- Contact channels and CTA targets are distinct concepts and should be represented as separate UI sections.
- WhatsApp is mandatory business infrastructure.
  - One mandatory primary phone number is stored once.
  - WhatsApp is always enabled on that number.
  - Direct phone call is an optional provider-controlled action on that same number.
- Direct-call exposure follows the same default-plus-override pattern as other contact settings:
  - provider sets the default globally
  - each announcement can keep or override that default
- Contact defaults inherit automatically into announcements with optional per-channel override.
- Inheritance is live for announcements still marked as inheriting provider defaults.
- In create/edit UI, inheritance should be visible but lightweight:
  - use a lightweight inherited badge/label
  - provide a simple customize affordance
  - avoid a heavy settings/state-machine feel
- CTA targets are announcement-level only.
  - provider config may inform suggestions
  - CTA inheritance itself does not exist
- CTA is important but not mandatory for publish.
  - the platform should not own per-category CTA-requirement logic
  - providers decide whether a given announcement has a CTA
  - when present, CTA should be treated as a first-class/high-importance element
- When no valid CTA exists, public listing UX falls back cleanly to primary contact actions:
  - WhatsApp baseline
  - optional call when enabled
- CTA target shape for v1 is bounded, not unbounded.
  - include provider profile
  - website/menu URL
  - Instagram post/profile
  - TikTok video/profile
  - WhatsApp deep link
- Category model is exactly one structural category per announcement.
- Category/tags/money primitives for authoring are:
  - async searchable combobox for categories
  - token/chip input for tags
  - masked money input with normalized numeric storage
- Tags are a mixed system:
  - provider-authored discovery tags stay flexible
  - system/editorial labels may exist, but remain distinct from normal provider tags
- Tag normalization should use baseline automation only:
  - case-folding/lowercasing
  - trimming
  - deduping
  - accent folding for search
  - no automatic singular/plural collapsing or meaning-rewriting
- Create/edit parity boundary is core parity now, polish later.
  - contact defaults/overrides, CTA targets, categories, tags, and money semantics must all be editable in the same pass
  - exact visual parity can lag behind domain parity
- Create-page layout target remains a hybrid panel contract.
  - the user believes recent spacing/padding improvements already moved the page closer to other panel pages
  - implementation should adapt the current page toward a shared panel-container + inner authoring-rail composition rather than reverting to a narrow wizard

## Open Tensions

- The current source still shows an outer `mx-auto max-w-4xl` wrapper in `panel.dashboard.announcements.new.tsx`, while the user reports meaningful layout improvement already exists. PRD work should preserve the user's intended direction and verify the real current state before over-correcting the shell.
- Exact token values, component boundaries, and visual composition for the hybrid authoring layout are not fixed here; the decision is the layout contract, not the final pixel spec.
- The exact DTO / persistence shape for CTA targets and contact overrides is not yet named at field level; the PRD must preserve the conceptual model and let implementation formalize the concrete schema.
- System/editorial tag labels are allowed conceptually, but their governance and exact taxonomy are not defined in this packet.

## PRD Expectations

- Preserve the separation between contact channels and CTA targets across data model, validation, authoring UI, edit UI, and public rendering.
- Treat WhatsApp as the hard baseline contact path in all publishable announcements.
- Model one stored primary phone number with always-on WhatsApp plus provider-controlled optional call exposure, including global default + per-announcement override behavior.
- Specify live inheritance semantics clearly so authoring/editing/public behavior is not ambiguous when provider defaults change.
- Require core create/edit parity for all newly expanded authoring concepts in the same implementation pass.
- Replace the current button-grid / raw-text authoring primitives with the locked scalable primitives for category, tags, and money.
- Keep CTA optional, but make it prominent and resilient when present; use strong contact fallback when absent or broken.
- Keep CTA targets announcement-level only, and limit v1 target types to the agreed small fixed set.
- Preserve one structural category per announcement and use tags for broader discovery, not for compensating category ambiguity.
- Adapt the create page toward the hybrid panel authoring contract while respecting the user's claim that recent layout improvements should not be thrown away.
- Ensure the resulting UX still fits the business model: the platform is a showcase/discovery layer whose main job is connecting the user directly to the provider, not processing the sale.

## Next Step

- Run `luna-to-prd` using this handoff plus the canonical grilling session.
