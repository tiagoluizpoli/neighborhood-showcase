# Backend Domain Alignment & Clean Architecture Completion

## Parent

Epic: Backend Clean Architecture Sweep

## What to build

Complete the remaining backend recovery work so the server follows the clarified domain model and composition-root pattern end to end.

This slice focuses on the parts of the backend that still carry the old identity and role assumptions:

- `User` remains the authentication identity root.
- `Provider` is modeled as a separate relation/capability, not a global role.
- `Provider Assignment` is the canonical operating-context relation for provider-to-condominium/address links.
- `Provider Profile` owns public branding data for provider-facing pages.
- Global roles follow the hierarchy `USER < SYSTEM_MANAGER < ADMINISTRATOR`.
- `MODERATOR` stays condo-scoped and is not a global user role.
- Server wiring lives under `src/main/`, where bootstrap, router assembly, and dependency injection belong.

The slice must preserve current observable behavior while moving the remaining backend code onto the clarified boundaries.

## Acceptance criteria

- [ ] The auth/user role model stores and enforces `USER < SYSTEM_MANAGER < ADMINISTRATOR`.
- [ ] `MODERATOR` is no longer treated as a global user role.
- [ ] Provider-facing public data is read from provider-profile data, not from auth identity fields.
- [ ] Provider operating context uses the provider-assignment relation consistently.
- [ ] Backend bootstrap and DI wiring are owned by the `src/main/` composition root.
- [ ] Remaining backend production code respects the clean-architecture dependency direction.
- [ ] Focused integration tests cover the role hierarchy, provider profile, provider assignment, and wiring behavior.
- [ ] Backend type-check and test commands pass for the slice.

## Blocked by

- None - can start immediately
