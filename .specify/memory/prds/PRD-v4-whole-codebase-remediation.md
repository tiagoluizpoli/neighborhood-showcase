# Product Requirement Document (PRD) — Neighborhood Showcase v4: Whole-Codebase Remediation & Architecture Alignment

This PRD consolidates the whole-codebase review, grill-with-docs decisions, architecture-report findings, and the remediation backlog captured in issues `65` through `73`.

It is an additive PRD. It does not replace the product scope already documented in prior PRDs. It captures the current repo-wide recovery work required so Ralph Loop can execute against a truthful architectural and behavioral source of record.

---

## Problem Statement

The Neighborhood Showcase platform now has a broader feature surface than the original MVP, but the codebase carries whole-repo correctness, seam, and documentation debt that weakens the platform in production and slows every follow-up implementation.

From the team’s perspective, the current problems are:

1. **Role enforcement drift**: the documented role hierarchy and the real role guards are not fully aligned across web and server entry points.
2. **Provider Profile privacy drift**: a hidden `Provider Profile` can still remain reachable through parts of the public seam, even when it is excluded from the public directory.
3. **Bad backend seams**: some read paths still mutate persistence state implicitly, especially around Provider Profile provisioning.
4. **Oversized shallow modules**: large route files and server interface files mix orchestration, storage policy, modal state, rendering, analytics, moderation, and transport concerns in single modules.
5. **Architecture source-of-truth drift**: backend code and repo rules follow layered Clean Architecture, while historical documentation still pointed at a feature-sliced backend.
6. **Execution-context gap for Ralph Loop**: remediation work existed in review output and issue files, but not yet in the main PRD that future loops read on every run.

---

## Solution

Establish a whole-codebase remediation program that is:

- **risk-first**
- **behavior-preserving by default**
- **executed slice by slice through Ralph Loop**
- **grounded in the repo’s actual architecture**

From the user’s perspective, the solution is:

- Visitors get consistent privacy and public-profile visibility rules.
- Global admins get consistent access behavior across web and server.
- Provider Profile behavior becomes predictable because reads are pure reads.
- Large route and server modules are decomposed into deeper, more testable modules.
- The backend architecture is documented truthfully as layered Clean Architecture.
- The root PRD becomes the single narrative artifact tying product scope, architecture intent, and remediation queue together.

---

## User Stories

1. As an `Administrator`, I want all current global-admin web entry points to accept my role wherever `System Manager` access is already intended, so that the platform’s role hierarchy is applied consistently.
2. As a `System Manager`, I want global-admin routes to behave identically for `Administrator` users unless a route is explicitly more restrictive, so that permission logic stays predictable.
3. As a `Provider`, I want my `Provider Profile` visibility setting to control the entire public seam, so that hiding my profile actually makes it unavailable to `Visitors`.
4. As a `Visitor`, I want hidden `Provider Profiles` to behave like not-found pages everywhere public, so that visibility rules are consistent and unsurprising.
5. As a developer, I want public profile visibility to be enforced on the backend public-read seam, so that the frontend is not responsible for privacy protection.
6. As a developer, I want `Provider Profile` provisioning to happen only through explicit write paths, so that read methods do not silently mutate storage.
7. As a developer, I want public and private reads to return existing data or absence only, so that retry behavior, tests, and caching remain predictable.
8. As a developer, I want the oversized `Announcement` server seam decomposed by domain capability, so that public browsing, provider dashboard, payments, moderation, and reports stop sharing one broad interface.
9. As a `Visitor`, I want the public browsing route family to remain behaviorally stable while being decomposed internally, so that the browsing experience is not destabilized by architecture cleanup.
10. As a `Provider`, I want the Provider Dashboard route family to preserve editing, analytics, payment, and setup behavior while its code is decomposed, so that cleanup work does not regress business flows.
11. As a `Moderator` or `System Manager`, I want moderation/admin route families to preserve role behavior while being broken into smaller modules, so that operational flows remain intact.
12. As a developer, I want the backend architecture ADRs to reflect the actual layered Clean Architecture direction, so that future remediation is guided by truthful documentation.
13. As a developer running Ralph Loop, I want the main root PRD to include the whole-codebase remediation context and ordering, so that loop runs are not blind to the current recovery program.
14. As a developer, I want the whole-codebase audit findings represented as executable issue slices, so that remediation can happen one safe unit at a time.
15. As a developer, I want remaining default-export drift in production web code cleaned up, so that the codebase aligns with the repo’s named-export rule.
16. As a `Visitor` or `Provider`, I want route and module decomposition to reduce oversized web bundles over time, so that the application loads more efficiently.

---

## Implementation Decisions

### Decision 1: Layered Clean Architecture is the active backend seam
- The backend is intentionally organized by Clean Architecture layers, not by feature slices.
- The active seam is:
  - `presentation/`
  - `application/`
  - `domain/`
  - `infrastructure/`
  - `main/`
- `docs/adr/0004-layered-clean-architecture-supersedes-feature-sliced-backend.md` supersedes `0001`.

### Decision 2: Provider Profile visibility gates the entire public seam
- `Provider Profile` visibility is not merely a directory preference.
- If a `Provider Profile` is hidden, public directory listing and direct public profile lookup should both behave as not found for `Visitors`.

### Decision 3: Provider Profile reads must be pure reads
- Provider Profile provisioning must not happen inside repository read methods.
- Public reads and private reads should return existing data or absence only.
- Any row creation or backfill must happen through an explicit write path, setup path, or migration-backed strategy.

### Decision 4: Remediation is grouped by shared seam, not by individual file count
- Oversized modules should be decomposed by domain capability and shared seam.
- Planned slices include:
  - global-admin route parity
  - Provider Profile public visibility enforcement
  - Provider Profile explicit provisioning and pure reads
  - Announcement server interface decomposition
  - Public Vitrine route-family decomposition
  - Provider Dashboard route-family decomposition
  - Moderation/Admin route-family decomposition
  - frontend export-surface and bundle cleanup

### Decision 5: Risk-first execution order
- Ralph Loop should work through the remediation queue in this order:
  1. correctness and access-control parity
  2. Provider Profile privacy enforcement
  3. Provider Profile seam cleanup
  4. backend server interface decomposition
  5. frontend route-family decomposition
  6. export-surface and bundle cleanup

### Decision 6: Root PRD must carry remediation context
- The root PRD is a required runtime context source for Ralph Loop.
- Whole-codebase remediation context cannot live only in issue files or review output.

---

## Testing Decisions

- Good tests verify **external behavior**, not helper extraction details or internal implementation layout.
- Correctness slices should use focused route/integration coverage around:
  - role behavior for `USER`, `SYSTEM_MANAGER`, and `ADMINISTRATOR`
  - visible vs hidden Provider Profile reads
  - no-profile vs existing-profile scenarios
- Backend seam-recovery slices should keep integration tests centered on observable contracts:
  - public announcement behavior
  - provider dashboard behavior
  - moderation/report behavior
- Frontend decomposition slices should prefer route/component behavior tests that verify rendering, auth/role gating, filter/state behavior, and navigation behavior.
- Bundle/performance cleanup should include at least one validation pass through the relevant web build path so large-chunk regressions are visible.

---

## Out of Scope

- Shipping new end-user features unrelated to the remediation queue.
- Re-litigating whether the backend should return to feature slicing.
- A single giant refactor covering backend and frontend decomposition in one batch.
- Cosmetic UI redesign work unrelated to the architecture and correctness backlog.
- Rewriting completed product scope from prior PRDs.

---

## Further Notes

- The executable remediation queue is tracked in issue files `65` through `73` under `.specify/memory/issues/`.
- `docs/adr/0004-layered-clean-architecture-supersedes-feature-sliced-backend.md` is now the architecture source of truth for the backend seam.
- This PRD intentionally complements prior PRDs rather than replacing them; its purpose is to make the current recovery program first-class context for future Ralph Loop runs.
