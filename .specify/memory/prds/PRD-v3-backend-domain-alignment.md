# Product Requirement Document (PRD) - Neighborhood Showcase v3: Backend Domain Model Alignment and Clean Architecture Completion

This PRD complements the existing product backlog and backend clean-architecture sweep. It captures the domain decisions that were resolved during the grilling session and defines the implementation boundaries that the remaining Ralph Loop passes must preserve.

---

## Problem Statement

The backend still reflects an older model where identity, provider capability, provider branding, and condominium-scoped moderation are partially mixed together.

This causes several problems:

1. `User` is overloaded as both identity and provider capability.
2. Provider-facing public data is still coupled to auth identity fields.
3. Global roles are not yet aligned with the clarified trust hierarchy.
4. Condominium-scoped moderation is easy to confuse with global administrative authority.
5. Some backend modules already follow clean architecture, while others still resolve dependencies or model data in the wrong layer.

The result is a system that works, but is harder to extend, test, and reason about than it should be.

---

## Solution

Align the backend domain model and clean-architecture structure around the clarified domain language:

- `User` remains the authenticated account root.
- `Provider` becomes a separate capability/relation, not a global role.
- `Provider Assignment` becomes the canonical relation that links a provider to a condominium or address and stores provider-operating context.
- `Provider Profile` becomes the public-facing branding record for a provider, separate from auth identity.
- Global roles become `USER`, `SYSTEM_MANAGER`, and `ADMINISTRATOR`.
- `MODERATOR` remains condo-scoped and is not a global user role.
- The backend composition root lives under `src/main/` and owns wiring, bootstrap, and DI.
- Remaining backend modules are refactored slice by slice to respect the same layer boundaries already established by the clean-architecture sweep.

This is a behavior-preserving refactor unless a change is required to make the clarified domain model consistent.

---

## User Stories

1. As an authenticated user, I want my login identity to remain separate from provider capability, so that I can exist in the system without being a provider.
2. As a provider, I want a separate public profile with company branding, so that visitors see business identity instead of raw account identity.
3. As a provider, I want to belong to more than one provider assignment, so that I can operate in multiple condominium or address contexts.
4. As a visitor, I want provider pages to show branded information and active announcements, so that I can evaluate providers before contacting them.
5. As a system manager, I want to keep condo-scoped moderation separate from global roles, so that local and global authority are not conflated.
6. As an administrator, I want a higher-trust global role above system manager, so that sensitive governance actions stay restricted.
7. As a condominium moderator, I want my permissions to stay limited to the condominiums I am assigned to, so that I do not gain unexpected global authority.
8. As a developer, I want backend wiring to live in a dedicated composition root, so that dependency injection is explicit and testable.
9. As a developer, I want routers to remain transport-focused, so that business logic stays in application use cases.
10. As a developer, I want repositories to own database access and ORM usage, so that application code remains infrastructure-free.
11. As a developer, I want the remaining backend sweep to preserve existing behavior, so that the refactor does not introduce accidental regressions.
12. As a developer, I want the role hierarchy to be explicit in code and schema, so that authorization checks remain predictable.
13. As a developer, I want provider-related public data to stop living on the auth user record, so that future branding fields can grow safely.
14. As a developer, I want the issue backlog to reflect the clarified domain model, so that Ralph Loop can implement the remaining slices without guesswork.

---

## Implementation Decisions

- `User` is the authenticated account root managed by Better Auth.
- `Provider` is not a global `user.role` value.
- Global roles are `USER`, `SYSTEM_MANAGER`, and `ADMINISTRATOR`.
- `MODERATOR` is not a global `user.role` value.
- `MODERATOR` remains a condominium-scoped capability represented through assignment data.
- `Provider Assignment` is the canonical name for the relation that previously behaved like a location record.
- `Provider Assignment` stores the provider's condominium or address link plus the state needed for provider operations.
- `Provider Profile` is the canonical public-facing branding record for a provider.
- `Provider Profile` owns company name, logo, banner, public description, and public contact links.
- `Provider Profile` is created when provider capability is enabled, not for every user by default.
- Public provider pages require provider profile data to be complete enough for public display.
- The backend composition root belongs under `src/main/` and owns bootstrap, app-router assembly, and dependency wiring.
- Use cases receive dependencies through constructor injection.
- Infrastructure implementations own database access and depend only on domain contracts.
- Presentation routers remain thin and translate transport input/output only.
- The remaining backend cleanup continues slice by slice, using the same boundary rules already established in the current clean-architecture sweep.
- The existing issue-based architecture cleanup remains valid and is not replaced by this PRD; this PRD complements it with the domain decisions that the next slices need.

---

## Testing Decisions

- Test external behavior, not internal implementation details.
- Cover role hierarchy behavior with integration tests around the admin and auth-facing routes.
- Cover provider profile behavior with route and use-case tests that assert public output.
- Cover provider assignment behavior with repository and use-case tests that validate multi-context support.
- Cover the composition root and router wiring with focused integration tests to ensure the same API contract remains visible.
- Keep the remaining clean-architecture sweep protected by slice-level tests before and after each refactor.
- Reuse the existing backend integration-test patterns already used for announcement, assignment, admin, and public provider flows.

---

## Out of Scope

- New frontend redesign work.
- New product features unrelated to the backend domain model and clean-architecture completion.
- Changing public API behavior unless required to align with the clarified domain model.
- Introducing multiple stacked global roles per user.
- Introducing a new policy engine or permissions DSL.
- Reworking the entire auth provider integration beyond the schema and role alignment required here.

---

## Further Notes

This PRD is intended to be consumed by the remaining Ralph Loop passes as the source of truth for:

- backend domain model alignment
- provider-facing presentation separation
- role hierarchy correction
- composition-root and DI organization
- remaining clean-architecture repair slices

The later issue updates should be derived from this PRD, not the other way around.
