# Handoff: Grilling To PRD

Date: 2026-06-18
Source Session: .plan/grilling/2026-06-18-07-role-access-and-route-architecture-grilling.md
Status: ready-for-prd
Scope: Role access and route architecture for panel namespaces, provider capability gating, default landings, and transitional routing.

## Stable Decisions

- `/panel/dashboard` is not the canonical semantic dashboard for authenticated users.
- Explicit section-scoped dashboards are the target architecture, including at minimum `/panel/provider/dashboard` and `/panel/admin/dashboard`.
- Provider access uses a hybrid model:
  - routes remain section-scoped
  - provider availability behaves as a product-level capability toggle
  - backend persistence may still be role-row existence plus enabled state
- Non-providers must be hard-blocked from the entire `/panel/provider/*` route group.
- Hiding provider navigation is not sufficient; direct URL access must also be denied at the route-group boundary.
- Default landings use a hybrid approach:
  - single-scope users land directly in their section dashboard
  - multi-scope users may later use a neutral chooser/home if that becomes a real product need
- `/panel/dashboard` remains only as a transitional redirect shim during migration.
- Provider capability source of truth uses a hybrid UX contract:
  - primary discovery/enable action lives in the provider placeholder for non-providers
  - a canonical management location also exists in account/settings/provider configuration
  - both surfaces write to the same backend provider-enabled source of truth
  - navigation and route guards read only that canonical backend-derived state
- Existing tests that normalize the legacy `/panel/dashboard` semantics must be rewritten.

## Open Tensions

- Exact system-manager landing/dashboard shape is not fully designed here; the decision is only that it should not piggyback on provider semantics.
- The exact implementation details of the provider-enable modal/flow are not fully designed here; only the architectural contract is fixed.
- The future generic panel-home/chooser remains optional and should be introduced only if multi-scope navigation becomes a real product need.

## PRD Expectations

- Preserve strict separation between generic panel concepts and provider-only concepts.
- Cover frontend navigation visibility, route guards, redirect behavior, backend capability checks, and database-backed provider-enabled state in one coherent contract.
- Ensure implementation updates tests so they verify route-group blocking, correct default landings, and redirect-shim behavior.
- Treat current tests as evidence of legacy behavior, not of correct product behavior.
- Preserve the product semantic that provider behaves like an enable/disable capability, even if persistence is implemented via role records and enabled flags.
- Do not allow the PRD to drift back into broad approved-assignment logic for provider access.

## Next Step

- Run `luna-to-prd` using this handoff plus the canonical grilling session.
