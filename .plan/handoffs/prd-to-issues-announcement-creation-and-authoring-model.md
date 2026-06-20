# Handoff: PRD To Issues

Date: 2026-06-20
Source PRD: .plan/prds/PRD-v10-announcement-creation-and-authoring-model.md
Status: ready-for-issues
Scope: Canonical announcement authoring contract covering provider-level contact defaults, announcement-level contact overrides, separate CTA targets, WhatsApp baseline plus optional same-number direct call, scalable category/tag/money primitives, create/edit capability parity, and resilient public CTA fallback.

## Locked Decisions

- The canonical announcement authoring model is three-layered: provider-level contact defaults, announcement-level contact overrides, and separate CTA targets. Contact channels and CTA targets must remain distinct concepts across authoring, persistence, and public rendering.
- WhatsApp is the mandatory baseline contact path for every publishable announcement.
- One primary business phone number is stored once and used for WhatsApp; direct phone call is an optional provider-controlled action on that same number.
- Contact behavior follows provider default plus per-announcement override semantics, and inheritance is live for announcements still marked as inheriting defaults.
- CTA targets are announcement-level only. Provider settings may suggest defaults, but CTA inheritance itself does not exist.
- CTA is important but not mandatory for publish. The platform should not own per-category CTA requirement logic.
- When CTA is absent or broken, public announcement behavior must fall back cleanly to WhatsApp and optional direct call when enabled.
- The v1 CTA target set is bounded: provider profile, website/menu URL, Instagram post/profile, TikTok video/profile, and WhatsApp deep link.
- Category remains exactly one structural category per announcement.
- Locked authoring primitives are: async searchable category combobox, structured token/chip tags input, and money-aware price input with normalized numeric storage.
- Tag normalization is conservative only: trimming, lowercasing/case-folding, deduping, and accent folding for search; no semantic rewriting such as singular/plural collapsing.
- Create/edit capability parity is mandatory in the same implementation pass for the newly expanded authoring concepts. Visual polish parity may lag, but domain capability parity may not.
- The create page should evolve toward a serious panel authoring surface while preserving the current direction of improved spacing/padding rather than reverting to a narrow wizard.
- Inherited/default contact behavior should be visible but lightweight in the UI via an inherited badge/label plus a simple customize affordance.

## Decomposition Constraints

- Treat provider defaults, announcement overrides, and CTA targets as separate vertical concerns; do not decompose issues in a way that collapses them back into one flat links model.
- Preserve create/update/public parity in the issue tree. If create grows new authoring concepts, edit and public behavior must be planned alongside it rather than deferred into an unscheduled cleanup.
- Keep the v1 CTA scope bounded. Do not let the issue breakdown expand into an arbitrary destination-builder system.
- Keep category cardinality fixed at one structural category and use tags for broader discovery.
- Keep tag work scoped to the locked normalization floor plus structured authoring UX; do not pull in speculative taxonomy governance.
- Keep the create-page layout work tied to the authoring contract and panel composition direction; do not let it balloon into a broad shell redesign epic.
- Testing tasks must include domain/application coverage, route/integration coverage, and Playwright visual/e2e coverage with seeded data. No skipped tests for missing seed state.

## Out Of Scope

- Unbounded CTA/plugin destination systems.
- Deep governance/taxonomy design for system/editorial labels.
- Provider-profile branding redesign.
- Payment/checkout work.
- Broad panel-shell redesign unrelated to the authoring contract.
- Automatic semantic rewriting of tags beyond the locked normalization floor.

## Next Step

- Run `luna-to-issues` using this handoff plus the canonical PRD.
