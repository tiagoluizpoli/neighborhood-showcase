# PRD-v10 — Announcement Creation and Authoring Model

## Problem Statement

The provider announcement authoring flow is still built around a narrow draft-era contract, while the product direction has moved to a richer showcase/discovery model.

Today, the create flow still submits a small DTO: title, subtitle, description, image, one category, free-text tags, optional price, and a flat `contactLinks` object populated by only WhatsApp, Instagram, and website in the current UI. The create page already improved visually compared with older centered-form complaints, but its authoring primitives still reveal the older contract: categories are fetched from the backend yet rendered as a button grid, tags are entered as one raw string then split and lowercased, price is collected through a plain text field, and the publish-time rule remains "at least one contact link" rather than the business rule the user actually described.

The edit surface is even narrower than the intended model. It exposes only a simple contact block, a basic category selector, numeric price input, and no expanded concept of provider defaults, announcement-level overrides, CTA targets, or richer tag/category authoring. That means the system already shows visible create/edit capability drift: even if create were expanded, providers still could not maintain the same authoring concepts after creation.

At the domain layer, the announcement entity/router/repository shape already hints at a bigger surface — `contactLinks` technically allows phone, email, TikTok, and Facebook — but the current product contract does not use that surface coherently. The front end still treats announcement authoring as a small collection of raw links instead of a deliberate model separating how a client contacts a provider from where an announcement intentionally sends a client.

This mismatch matters because the platform is not an end-to-end checkout flow. It is a showcase/vitrine whose core job is to connect the resident directly to the provider. In that model, WhatsApp and phone contact behavior are core business infrastructure, while richer CTA destinations may also matter for some announcements. If those concepts stay collapsed into one flat links bucket, the product will keep accumulating UI workarounds, weak validation, and inconsistent public behavior.

The root problem is not just that the create page needs nicer inputs. The root problem is that announcement authoring, editing, validation, persistence, and public rendering are all still anchored to a simplified authoring model that no longer matches the intended business and UX contract.

## Solution

Establish one canonical announcement authoring contract built around three explicit layers:

- provider-level contact defaults
- announcement-level contact overrides
- announcement-level CTA targets kept separate from contact channels

The system should treat contact channels and CTA targets as different concepts end to end.

- Contact channels answer: "How does the resident reach the provider?"
- CTA targets answer: "Where does this announcement intentionally send the resident?"

WhatsApp becomes the hard baseline contact path.

- One primary provider phone number is required and stored once.
- WhatsApp is always enabled on that number.
- Direct phone call is a separate provider-controlled action on that same number.
- Contact defaults inherit into announcements automatically unless that announcement is explicitly switched into override mode.
- Announcements still marked as inheriting continue to follow provider-default changes live.

CTA targets remain announcement-level only.

- Provider configuration may inform sensible suggestions.
- CTA inheritance itself does not exist.
- A CTA is important but not mandatory for publish.
- When present, CTA should be treated as a first-class/high-importance action.
- When absent or invalid, the public announcement experience must fall back cleanly to contact actions, starting with WhatsApp and optionally direct call when enabled.

The v1 CTA model is bounded rather than open-ended.

- Supported target types: provider profile, website/menu URL, Instagram post/profile, TikTok video/profile, WhatsApp deep link.
- A primary CTA target is distinct from optional secondary targets.

Authoring primitives should scale to the intended volume and semantics.

- Category selection becomes an async searchable combobox.
- Each announcement keeps exactly one structural category.
- Tags move to a structured token/chip input.
- Tag normalization stays intentionally lightweight: trimming, lowercasing/case-folding, deduping, and accent folding for search, without automatic meaning rewrites such as singular/plural collapsing.
- Price entry uses money semantics in the UI with normalized numeric storage.

Create/edit parity is a same-pass requirement at the domain level.

- Contact defaults/overrides, CTA targets, category, tags, and money semantics must all be editable after creation in the same implementation pass.
- Pixel-perfect create/edit visual parity can lag, but authoring capability parity cannot.

The create page should evolve toward a serious panel authoring surface, not back into a narrow wizard.

- Keep the current direction where recent spacing/padding improvements are respected.
- Adapt the page toward a shared panel-container plus inner authoring-rail composition.
- Surface inherited contact state visibly but lightly, with an inherited badge/label and a simple customize affordance rather than a heavy settings workflow.

## User Stories

1. As a provider, I want my announcement authoring flow to distinguish contact channels from CTA destinations, so that the form matches what the business is actually trying to do.
2. As a provider, I want one provider-level default contact setup, so that I do not have to re-enter my baseline contact information for every announcement.
3. As a provider, I want announcements to inherit my default contact setup automatically, so that creating common announcements is fast.
4. As a provider, I want to override inherited contact behavior on a specific announcement, so that special cases do not force a global change.
5. As a provider, I want inherited announcements to stay synced to my defaults until I customize them, so that changing my baseline contact info updates the announcements that still depend on it.
6. As a provider, I want WhatsApp to be the guaranteed baseline path for residents, so that every publishable announcement supports the platform’s core connection model.
7. As a provider, I want one primary business number used for WhatsApp, so that contact behavior stays simple and consistent.
8. As a provider, I want direct phone calls on that same number to be optional, so that I can decide whether residents may call me directly.
9. As a provider, I want the call toggle to default from my provider settings but remain overridable per announcement, so that one unusual announcement does not force a global policy change.
10. As a provider, I want CTA targets modeled separately from contacts, so that a destination link does not get confused with a reach-me channel.
11. As a provider, I want CTA targets to exist only at the announcement level, so that each announcement can point to the most relevant destination.
12. As a provider, I want CTA to be important but not mandatory for publish, so that the platform does not block legitimate announcements that rely on direct contact instead.
13. As a provider, I want a primary CTA plus optional secondary targets, so that one announcement can emphasize the best action without losing flexibility.
14. As a provider, I want the initial supported CTA set to be deliberately bounded, so that the product stays coherent instead of turning into an arbitrary links dump.
15. As a provider, I want category selection to scale through search, so that the system still works when category count grows beyond a small button grid.
16. As a provider, I want exactly one structural category per announcement, so that categorization stays crisp and does not degrade into an uncontrolled multi-select taxonomy.
17. As a provider, I want tags entered as visible chips/tokens, so that I can understand and edit them as structured metadata rather than raw text.
18. As a provider, I want tag cleanup to be helpful but conservative, so that the system does not silently change the meaning of my words.
19. As a provider, I want money input to behave like money, so that prices are easier to enter correctly.
20. As a provider, I want the create page to feel like a first-class panel authoring surface, so that writing an announcement feels aligned with the rest of the product.
21. As a provider, I want inherited/default contact behavior to be visible in the form, so that I understand when the announcement is using my defaults versus custom values.
22. As a provider, I want that inheritance UI to stay lightweight, so that the form does not turn into a complicated settings console.
23. As a provider, I want to edit all newly introduced authoring concepts after creation, so that I am not forced to recreate an announcement just to change CTA or contact behavior.
24. As a resident, I want every public announcement to give me a reliable WhatsApp contact path, so that I can always reach the provider.
25. As a resident, I want a direct call action when the provider allows it, so that mobile contact is frictionless.
26. As a resident, I want CTA actions to be prominent when present, so that I understand the provider’s preferred next step.
27. As a resident, I want missing or broken CTA data to fall back gracefully to contact actions, so that the announcement still remains useful.
28. As a resident, I want announcement cards and detail surfaces to respect the same authoring model, so that public behavior matches what the provider configured.
29. As a moderator or support operator, I want announcement contact and CTA semantics to be explicit, so that reviewing, debugging, and explaining behavior is possible.
30. As a developer, I want one canonical authoring model for create, edit, persistence, and public rendering, so that later feature work stops re-solving the same modeling ambiguity.
31. As a developer, I want provider defaults and announcement overrides treated as first-class state, so that validation and UI behavior can be reasoned about cleanly.
32. As a developer, I want a bounded CTA type system, so that DTOs, validation, and rendering stay maintainable.
33. As a developer, I want create/edit capability parity enforced in the same implementation pass, so that the richer model does not land half-usable.
34. As a developer, I want the announcement authoring primitives to scale now, so that future category/tag growth does not require another redesign immediately afterward.
35. As a developer, I want a clear out-of-scope boundary around speculative taxonomy governance and visual polish overreach, so that the implementation stays focused on the locked contract.

## Implementation Decisions

- The canonical authoring model is explicitly three-layered: provider-level contact defaults, announcement-level contact overrides, and separate CTA targets. Contact channels and CTA targets are not allowed to collapse back into one flat outbound-links concept.
- The system keeps provider contact defaults and announcement contact behavior as first-class concepts throughout authoring, validation, persistence, and public rendering. "Inherited" versus "customized" is part of the product contract, not a purely local form convenience.
- WhatsApp is the mandatory baseline contact path for every publishable announcement. The product no longer treats "any one of several contact links" as the real business rule.
- One primary business phone number is stored once and used as the WhatsApp baseline. Direct phone call exposure is a separate boolean/action on that same number, with provider-level default plus per-announcement override behavior.
- CTA targets are announcement-level only. Provider settings may inform suggestions, but CTA inheritance does not exist.
- CTA remains optional for publish because the platform should not own category-by-category CTA enforcement logic. When CTA exists, it is treated as high importance in the announcement experience.
- Public announcement behavior must degrade safely: invalid or absent CTA data falls back to contact actions, beginning with WhatsApp and then optional direct call when enabled.
- The v1 CTA model is deliberately bounded to a small fixed set of supported target shapes: provider profile, website/menu URL, Instagram post/profile, TikTok video/profile, and WhatsApp deep link. The implementation should represent both a primary CTA target and optional secondary targets without opening an arbitrary free-form destination schema in this pass.
- Category remains exactly one structural category per announcement. Broader discovery and nuance belong to tags rather than multi-category drift.
- Authoring primitives are locked as follows: async searchable category combobox, structured token/chip tag input, and money-aware price input with normalized numeric storage.
- Tag normalization is intentionally conservative: trim, lower-case/case-fold, dedupe, and accent-fold for search. Do not introduce automatic semantic rewriting such as singular/plural collapsing.
- Create/edit parity is required for the newly expanded authoring concepts in the same implementation pass. The system may defer fine-grained visual parity, but it may not defer the ability to edit the same underlying concepts later.
- The create-page layout direction is evolutionary rather than restorative. Preserve the user’s claimed recent spacing/padding improvements and adapt the surface toward a shared panel-container plus inner authoring-rail composition rather than reverting to a narrow wizard pattern.
- Inheritance UX must be visible but lightweight: an inherited badge/label plus a simple customize affordance is preferred over a heavy settings/state-machine UI.
- Existing announcement domain/router/repository surfaces currently expose a broader raw `contactLinks` shape than the live UI uses. This pass should replace the accidental mismatch with one coherent contract rather than merely exposing more of the current flat links object.
- The implementation should keep the project’s glossary and business framing intact: the product is a showcase/discovery layer whose primary job is connecting residents directly to providers, not processing the sale itself.

## Testing Decisions

- Good tests verify externally visible behavior and domain contracts, not implementation details. For this packet that means asserting inherited-versus-custom contact behavior, publish validation around WhatsApp baseline, CTA prominence/fallback behavior, create/edit capability parity, and structured authoring interactions.
- The highest useful seam for the richer authoring contract is the create/edit flow boundary plus the public-announcement rendering boundary. Prefer route-level/component integration tests and end-to-end tests over unit tests of low-level form wiring.
- Add domain/application tests around the canonical authoring rules: WhatsApp baseline requirement, same-number optional-call behavior, provider-default inheritance, announcement override behavior, bounded CTA type validation, and conservative tag normalization.
- Add API/router/use-case tests proving that the create and update contracts accept and persist the same authoring concepts. This packet should not allow create to outgrow update again.
- Add public rendering tests proving that CTA and contact sections remain distinct and that absent/broken CTA state falls back to WhatsApp plus optional direct call rather than rendering a dead-end action.
- Add focused tests for scalable authoring primitives at the behavior level: searchable category selection, structured tag entry/editing, and money normalization. These tests should assert what a user can do and what persisted values result, not the internals of the chosen widget libraries.
- Playwright is mandatory for this UI work. End-to-end coverage must include create and edit flows with seeded provider data, and visual assertions must protect against layout regressions on the authoring surface. Runtime correctness alone is not sufficient.
- Seed data is part of the test contract, not a reason to skip coverage. If the richer flow needs approved provider assignments, provider defaults, or representative CTA/contact states, seed them and exercise them. Do not use skipped tests as a substitute for setup.
- Prior art should come from the project’s existing route-level panel tests, current public-provider behavior tests, and existing Playwright coverage patterns for persisted provider settings. Reuse the highest seams already favored in the codebase instead of introducing test-only abstractions.
- Because inheritance and fallback are easy to misread in code review, include explicit scenario coverage for: inherited default unchanged after provider edit, customized announcement staying isolated from later provider-default changes, CTA present, CTA absent, CTA invalid, call allowed, and call disallowed.

## Out of Scope

- A fully unbounded CTA/plugin destination system.
- Deep governance or taxonomy design for system/editorial tags beyond preserving the distinction from normal provider-authored tags.
- A broad provider-profile branding redesign.
- Payment/checkout flows or any shift away from the showcase/direct-connection business model.
- General role/route-gating changes unrelated to announcement authoring.
- A full visual redesign of the panel shell; this packet only requires the create/edit authoring surfaces to fit the serious panel authoring contract.
- Pixel-perfect create/edit visual parity beyond the requirement that both surfaces expose the same underlying authoring capabilities.
- Automatic semantic rewriting of tags beyond the locked normalization floor.

## Further Notes

- The current codebase already shows a mismatch between what the domain technically allows (`contactLinks` includes more fields) and what the UI/product actually models (flat create/edit contact blocks). This PRD resolves that mismatch by clarifying the product contract rather than simply exposing more raw fields.
- The create-page shell has improved relative to the oldest complaint, but the packet keeps the deliberate hybrid panel-authoring direction because layout and authoring model still need to evolve together.
- The locked decision is the conceptual model and authoring contract. Concrete DTO field names, storage shape details, and exact UI composition remain implementation work as long as they preserve the contract defined here.
- System/editorial labels may exist alongside provider-authored tags, but the governance of those labels remains intentionally undefined in this pass.
- Source grilling: `.plan/grilling/2026-06-20-06-announcement-creation-and-authoring-model-grilling.md`. Source handoff: `.plan/handoffs/grill-to-prd-announcement-creation-and-authoring-model.md`. Source packet: `.plan/sessions/panel-bugs-style-issues/06-announcement-creation-and-authoring-model.md`.
