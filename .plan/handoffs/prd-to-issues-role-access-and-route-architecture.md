# Handoff: PRD To Issues

Date: 2026-06-18
Source PRD: .plan/prds/PRD-v8-role-access-and-route-architecture.md
Status: ready-for-issues
Scope: Section-scoped panel dashboards, canonical Provider capability gating, direct-URL route-group protection, default landings, and legacy dashboard redirect migration.

## Locked Decisions

- `/panel/dashboard` is not a real product dashboard and must remain only a transitional redirect shim.
- Explicit section-scoped dashboard architecture is the target contract, including Provider and Administration dashboards, with Moderation remaining its own section.
- Provider access uses a hybrid capability model: product-level enable/disable semantics backed by canonical backend-derived state.
- Non-Providers must be blocked from the entire Provider route group at the top boundary.
- Hiding Provider navigation is not sufficient; route-group authorization is mandatory.
- Single-scope users land directly in their own section dashboard.
- A future neutral chooser/home for multi-scope users is optional and deferred unless implementation proves it is necessary.
- Provider capability discovery/enablement may exist in more than one UX surface, but every surface must write the same canonical backend source of truth.
- Existing broad approved-assignment checks are not acceptable as the Provider authorization rule.

## Decomposition Constraints

- Preserve strict separation between generic panel concerns and Provider-only concerns.
- Issue breakdown must cover frontend navigation, redirects, backend capability resolution, and persistence together; do not split these so far apart that the contract can drift mid-epic.
- Include explicit test work for route-group blocking, section-correct default landings, and redirect-shim behavior.
- Treat existing tests as legacy-behavior evidence, not as requirements to preserve.
- Use seeded role/capability states rather than skipped tests.
- Keep glossary vocabulary consistent with `.plan/CONTEXT.md`, especially User, Provider, Provider Assignment, Moderator, System Manager, and Administrator.

## Out Of Scope

- Full redesign of the exact System Manager IA beyond preserving non-Provider semantics.
- Detailed UX design of the Provider-enable modal/activation flow beyond the architectural source-of-truth contract.
- Introducing a generic panel chooser/home unless a real multi-scope need emerges during implementation.
- Unrelated panel redesign outside access semantics, route ownership, and capability gating.

## Next Step

- Run `luna-to-issues` using this handoff plus the canonical PRD.
