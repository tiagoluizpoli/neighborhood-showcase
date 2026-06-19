# PRD-v8 — Role Access and Route Architecture

## Problem Statement

The panel currently mixes three different concepts into one unstable access model:

1. The route `/panel/dashboard` behaves like a generic authenticated landing, but in product semantics it is effectively standing in for the Provider dashboard. That ambiguity leaks into redirects, navigation, and tests.
2. Non-Providers can be hidden from some Provider navigation while still reaching Provider-semantic surfaces by direct URL or broad assignment checks. Hidden sidebar state is being treated as if it were real authorization.
3. Provider capability is described by the product as an enable/disable capability, but the application still behaves as if any approved assignment can unlock Provider-semantic routes.
4. Administrator and System Manager users are allowed to piggyback on Provider dashboard semantics instead of landing in their own section-specific dashboard architecture.
5. Existing automated tests partially protect the current mismatch. They prove that the system works as built, but they also normalize product-wrong behavior.

The result is a panel whose route architecture does not match the project's glossary, the user's product intent, or the security boundary implied by section-scoped navigation. Moderator, Provider, Administrator, and System Manager experiences are not cleanly separated from top to bottom across frontend navigation, route guards, backend capability checks, and the database-backed source of truth.

## Solution

Replace the ambiguous panel access contract with explicit section-scoped dashboard architecture and a single canonical Provider capability rule.

The target model is:

- `/panel/provider/*` is the Provider section.
- `/panel/admin/*` is the Administration/System Management section family.
- `/panel/moderation/*` remains the Moderation section.
- `/panel/dashboard` stops being a real product dashboard and becomes only a transitional redirect shim during migration.

Provider access uses a hybrid rule model:

- product semantics: Provider behaves like an enabled/disabled capability
- architecture semantics: Provider pages live in their own route namespace
- persistence semantics: backend storage may still use assignment/role rows plus enabled state
- authorization semantics: frontend navigation, redirect resolution, and route guards all read the same backend-derived Provider-enabled state

Single-scope users should land directly in the dashboard for their own section. A future neutral chooser or panel home may be introduced later for true multi-scope users, but that is optional and not required for this PRD.

The Provider enablement UX also becomes coherent:

- a non-Provider does not enter the Provider route group
- the main discovery/enable action lives in a Provider placeholder/onboarding surface outside the active Provider namespace for non-Providers
- a canonical management surface also exists in account/settings/provider configuration
- both surfaces write to the same backend source of truth

## User Stories

1. As a Provider-capable User, I want my canonical dashboard to live under `/panel/provider/dashboard`, so that the route semantics match the section I am actually using.
2. As a Moderator, I want my canonical landing to be a Moderation dashboard, so that I do not get dropped into a Provider-semantic area.
3. As an Administrator, I want my canonical landing to be an Administration dashboard, so that the highest-privilege user journey does not depend on Provider rules.
4. As a System Manager, I want my canonical landing to be a non-Provider administration/system-management dashboard, so that my access model stays separate from Provider semantics.
5. As a non-Provider User, I want the entire Provider route group blocked at the top boundary, so that direct URL guessing cannot leak Provider pages.
6. As a non-Provider User, I want the Provedor sidebar group hidden when I do not have active Provider capability, so that the navigation matches the routes I am actually allowed to use.
7. As a User with Provider capability enabled, I want the Provedor sidebar group to appear consistently, so that navigation reflects my backend-backed entitlement.
8. As a User with Provider capability disabled, I want a clean enable-Provider path instead of half-working Provider pages, so that the product explains how to activate the capability.
9. As a User who can enable Provider mode, I want the discovery surface and the management surface to update the same canonical Provider-enabled state, so that navigation and authorization stay synchronized.
10. As a Provider-capable User, I want redirects from legacy `/panel/dashboard` URLs to take me to the correct Provider destination, so that migration does not break my bookmarks.
11. As a Moderator, I want legacy `/panel/dashboard` redirects to take me to the Moderation destination that matches my permissions, so that the old route does not silently upgrade me into a Provider area.
12. As an Administrator, I want legacy `/panel/dashboard` redirects to take me to Administration, so that the old route remains safe during the migration window.
13. As a System Manager, I want legacy `/panel/dashboard` redirects to take me to the correct administration/system-management destination, so that the transitional route still respects my scope.
14. As a User with no valid dashboard scope, I want the system to send me to the correct setup/onboarding surface, so that the app fails closed instead of improvising access.
15. As a User with multiple scopes, I want the migration to preserve deterministic landing behavior, so that my first route after sign-in is intentional rather than accidental.
16. As a future multi-scope User, I want a neutral chooser/home to remain an option rather than a forced decision now, so that the product can add it only if real usage demands it.
17. As a User, I want navigation visibility and route authorization to be driven by the same capability logic, so that there is no mismatch between what I see and what I can open.
18. As a User, I want redirects away from unauthorized panel sections to go to the correct section-specific destination, so that permission failures do not reinforce ambiguous route meaning.
19. As a Provider-capable User, I want the system to preserve the product idea that Provider is an enabled capability rather than an all-purpose assignment side effect, so that the panel matches the business model.
20. As a developer, I want the route architecture to separate generic panel concerns from Provider-only concerns, so that future features do not keep reintroducing the same ambiguity.
21. As a developer, I want the canonical Provider capability rule to come from backend-derived state, so that frontend code does not invent its own authorization heuristics.
22. As a developer, I want tests to fail if a non-Provider can open any `/panel/provider/*` route, so that direct-URL regressions are caught immediately.
23. As a developer, I want tests to fail if `/panel/dashboard` regains product-semantic meaning, so that the redirect shim does not quietly turn back into a real dashboard.
24. As a developer, I want tests to prove default landings for each relevant role/capability combination, so that routing behavior is intentional and reviewable.
25. As a developer, I want legacy tests that encode the wrong behavior to be rewritten instead of preserved, so that the suite protects the target product contract rather than the obsolete one.
26. As a developer, I want the database-backed Provider-enabled rule to stay compatible with the existing glossary vocabulary, so that implementation, planning, and tests all describe the same thing.
27. As a developer, I want the final access model to cover frontend navigation, redirect behavior, backend authorization, and persistence together, so that no layer drifts out of sync.

## Implementation Decisions

- The canonical dashboard architecture becomes section-scoped. Provider, Moderation, and Administration/System Management each own their own semantic dashboard surface instead of sharing an ambiguous generic dashboard.
- `/panel/dashboard` is preserved only as a migration shim. It must immediately resolve the current User into the correct section-specific destination and must not render a real dashboard experience.
- Provider access uses a hybrid capability model. The product treats Provider as enabled/disabled capability; the implementation may still persist that capability through existing assignment or role records plus enabled state; the contract exposed to the rest of the app is one canonical backend-derived Provider-enabled result.
- The current glossary rule remains binding: Provider navigation visibility and Provider-section access are granted only when the User satisfies the canonical Provider-enabled contract, which in current project language is aligned to at least one enabled Provider Assignment and not to arbitrary approved assignments.
- Non-Providers must be denied at the Provider route-group boundary. Authorization must fail before any child Provider page renders.
- Hiding Provider navigation is necessary but not sufficient. The route group itself is the real security boundary for Provider pages.
- Redirects from Moderation or other sections must point to section-correct destinations. No section may use the Provider dashboard as a generic fallback.
- Administrator and System Manager flows must stay semantically separate from Provider. If they share implementation primitives, that sharing must remain invisible at the route-contract level.
- Single-scope users land directly in their own section dashboard. Multi-scope chooser/home remains deferred unless implementation discovers a truly unavoidable need, in which case it must remain a thin selector rather than a new ambiguous dashboard.
- The Provider enablement UX is split into two coordinated surfaces: a primary discovery/activation surface for non-Providers and a canonical management surface in account/settings/provider configuration. Both update the same backend source of truth.
- The access model must fail closed. When the system cannot prove a valid scope, it redirects the User to the correct onboarding/setup destination instead of broadening access.
- Existing broad approved-assignment heuristics are no longer an acceptable authorization rule for Provider routes.
- Naming and route semantics should reflect section ownership explicitly so future work does not reintroduce “generic panel home means Provider area” ambiguity.

## Testing Decisions

- Good tests for this PRD verify externally visible access behavior, not internal implementation details. The suite should assert what route a User reaches, what navigation groups they can see, and whether unauthorized direct URLs are rejected.
- End-to-end Playwright coverage is mandatory because this PRD is about real navigation, redirects, route guarding, and visible section separation. The tests must exercise the full stack with seeded Users representing Provider-capable, Moderator-only, Administrator, System Manager, and no-scope states as needed.
- Route-group tests should cover at least: non-Provider blocked from `/panel/provider/*`, Moderator landing in Moderation, Administrator landing in Administration, System Manager landing in non-Provider admin/system-management space, and `/panel/dashboard` acting only as a redirect shim.
- Navigation tests should verify that sidebar visibility exactly matches the canonical backend-derived capability state. Seeing no Provedor group and being unable to open Provider URLs must be treated as one contract, not two unrelated checks.
- Redirect tests should prove that legacy entry points and unauthorized fallbacks never send Users into the wrong section.
- Regression coverage must explicitly replace legacy tests that normalized the old ambiguity. Keeping those tests would preserve the bug as a requirement.
- Database-backed/access-state scenarios must be seeded, not skipped. If a test needs a specific Provider-enabled or Moderator-only state, the seed/setup flow must create it.
- Visual assertions should confirm that section-specific dashboards and navigation render the correct section identity, especially for the redirect-shim migration path where runtime correctness alone can miss semantic regressions.
- Backend-facing tests at the highest practical seam should cover the canonical Provider-enabled decision so frontend and router tests can rely on one stable authorization contract.

## Out of Scope

- Full redesign of the exact System Manager information architecture beyond the rule that it must not piggyback on Provider semantics.
- Detailed UX of the Provider-enable modal/activation flow beyond the locked architectural contract that it writes the canonical Provider-enabled state.
- Introducing a generic panel chooser/home unless implementation uncovers a true product need for multi-scope routing.
- Broad redesign of unrelated panel pages whose semantics do not participate in route ownership or capability gating.
- Reopening the already-rejected idea that arbitrary approved assignments should unlock Provider-semantic routes.

## Further Notes

- This PRD is intentionally cross-layer: frontend navigation, route guards, backend capability checks, and persistence must ship as one coherent contract.
- Existing behavior and tests are evidence of the current bug, not proof of the intended product.
- The implementation should use the project's glossary vocabulary consistently: User, Provider, Provider Assignment, Moderator, System Manager, Administrator, and Provider-enabled state.
- Migration should prioritize determinism and reversibility: one canonical current route per scope, one shim for legacy entry, and one source of truth for Provider capability.
