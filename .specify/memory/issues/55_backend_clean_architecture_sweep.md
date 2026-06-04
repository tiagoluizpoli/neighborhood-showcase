# Epic: Backend Clean Architecture Sweep

## Parent

Architecture enforcement follow-up after PRD-v2-backlog-overhaul implementation.

## What to build

Perform a backend-wide, slice-by-slice cleanup that restores and enforces the Clean Architecture boundaries defined in `agents.local.md`.

This epic is not a feature implementation. It is a behavior-preserving architecture recovery pass. The current backend has production code paths where routers, use cases, domain objects, and infrastructure concerns are mixed. The sweep must identify those violations across the entire backend and move each behavior into the correct layer without changing product behavior.

## Scope

### In scope

1. Audit all backend production code under `apps/server/src`.
2. Move database access, ORM operators, schema imports, external SDK clients, and other infrastructure concerns out of presentation and application layers.
3. Move orchestration logic out of presentation routers into application use cases where appropriate.
4. Keep domain entities and domain contracts framework-free and infrastructure-free.
5. Ensure infrastructure implementations depend on domain contracts and do not depend on application or presentation code.
6. Preserve existing observable behavior while restructuring code.
7. Keep files within the local 300-line guideline where practical by extracting cohesive units.
8. Add or preserve focused tests for each slice before moving to the next slice.

### Out of scope

1. Frontend architecture cleanup.
2. New product features.
3. UI redesigns or copy changes.
4. Broad domain model redesign unless required to remove a concrete boundary violation.
5. Test rewrites that only make broken behavior pass.

## Required process

Each Ralph Loop iteration must work on one small backend slice at a time.

For each slice:

1. Identify the concrete boundary violation with file and line references.
2. Define the intended layer placement before editing.
3. Preserve the current external API contract unless the issue explicitly approves a contract change.
4. Move logic in the smallest behavior-preserving step possible.
5. Change tests only when imports, wiring, or file structure require it.
6. Run the relevant focused tests for that slice.
7. Run backend type/check commands before marking the slice complete.

If a slice exposes a real behavior bug, document it separately instead of hiding the behavior change inside the architecture cleanup.

## Clean Architecture rules to enforce

1. Domain code imports only domain/shared code and throws only domain errors.
2. Application use cases import only domain/shared code and never import Drizzle, database schemas, tRPC, Fastify, or infrastructure implementations.
3. Infrastructure code owns database queries, ORM operators, schema imports, external SDK calls, and concrete repository implementations.
4. Presentation routers own transport concerns only: authentication context checks, Zod input parsing, use-case wiring, DTO mapping, and `TRPCError` translation.
5. Production presentation code must not import `@neighborhood-showcase/db`, `@neighborhood-showcase/db/schema/*`, `drizzle-orm`, or infrastructure implementations directly.
6. Tests may import across layers only for setup, seeding, and assertions.

## Initial known violations

1. `apps/server/src/presentation/routers/admin.ts` imports `@neighborhood-showcase/db`, database schemas, and `drizzle-orm` directly from the presentation layer.
2. `apps/server/src/presentation/routers/admin.ts` exceeds the local 300-line file guideline.
3. Recent backend feature work should be audited for similar direct data-access patterns before assuming the issue is isolated to the admin router.

## Suggested slice order

- [x] 1. Admin providers directory query.
- [x] 2. Admin user listing query.
- [x] 3. Admin role-management mutations.
- [x] 4. Admin blacklist and provider-ban flows.
- [ ] 5. Announcement, payment, assignment, and moderation routers.
- [ ] 6. Remaining backend routers and production modules.
- [ ] 7. Backend-wide import boundary audit.

## Acceptance criteria

- [ ] Backend production code has no presentation-layer imports from `@neighborhood-showcase/db`, `@neighborhood-showcase/db/schema/*`, `drizzle-orm`, or infrastructure implementations.
- [ ] Backend application use cases have no imports from Drizzle, database schemas, tRPC, Fastify, infrastructure, presentation, or external SDK clients.
- [ ] Backend domain code remains framework-free and infrastructure-free.
- [ ] Infrastructure implementations depend on domain contracts and do not import application or presentation modules.
- [ ] Each remediated backend slice has focused tests covering its externally observable behavior.
- [ ] Tests are changed only for imports, wiring, or structure changes unless a separate behavior bug is documented.
- [ ] Relevant focused tests pass after each slice.
- [ ] Backend type/check commands pass before the epic is considered complete.
- [ ] Files touched during the sweep are kept under the 300-line guideline where practical, or the exception is documented.

## Blocked by

- None currently.

## Progress notes

- 2026-06-04: Started Slice 5 with `assignment.getMyAssignments`. Added `ListProviderAssignments` use case and routed the procedure through application layer while preserving DTO output. Focused integration test passes. Remaining Slice 5 router procedures still pending.
- 2026-06-04: Continued Slice 5 with `assignment.listPending`. Added `ListPendingAssignments` use case and routed the procedure through application layer while preserving provider-enriched DTO output. Focused integration test passes. `approve`, `reject`, and announcement/payment/moderation router cleanup still pending.
- 2026-06-04: Continued Slice 5 with `assignment.approve`. Added `GetAssignment` use case and routed the pre-approval lookup through application layer while preserving `NOT_FOUND`, `BAD_REQUEST`, moderator guard, and success DTO behavior. Focused integration test passes. `reject` plus announcement/payment/moderation router cleanup still pending.
- 2026-06-04: Continued Slice 5 with `assignment.reject`. Added `GetCondominiumAssignment` use case to centralize assignment existence and condominium-link checks, then routed reject pre-checks through application layer while preserving `NOT_FOUND`, `BAD_REQUEST`, moderator guard, reject reason, and success DTO behavior. Focused integration test passes. Assignment router cleanup is now complete; announcement/payment/moderation router cleanup still pending.
- 2026-06-04: Continued Slice 5 with `announcement.getPaymentStatus`. Added `GetPaymentStatus` use case and routed payment status lookup plus ownership checks through application layer while preserving `NOT_FOUND`, `FORBIDDEN`, and response DTO behavior. Focused integration test passes. Remaining Slice 5 work is announcement public/detail/moderation flows and any remaining payment router cleanup.
- 2026-06-04: Continued Slice 5 with `announcement.listForModeration`. Added `ListAnnouncementsForModeration` use case plus repository DTO/query support, then routed moderator scope validation and moderated announcement listing through application layer while preserving `FORBIDDEN` and response payload behavior. Focused integration test passes. Feedback loops are green again. Remaining Slice 5 work is announcement public/detail flows and moderation/reporting use-case cleanup.
- 2026-06-04: Continued Slice 5 with `announcement.update`. Added `UpdateAnnouncement` use case and moved ownership, verified-badge eligibility, suspended-to-active reset, and review-flag orchestration out of the router while preserving `FORBIDDEN`, `BAD_REQUEST`, and response DTO behavior. Focused integration test passes. Remaining Slice 5 work is announcement public/detail flows and moderation/reporting use-case cleanup.
- 2026-06-04: Continued Slice 5 with `announcement.getPublic`. Added focused `GetPublicAnnouncement` integration coverage and routed public detail lookup through the existing use case/repository DTO path while preserving `NOT_FOUND` and response payload behavior. Remaining Slice 5 work is announcement category listing plus moderation/reporting use-case cleanup.
- 2026-06-04: Continued Slice 5 with `announcement.listCategories`. Added `CategoryRepository`, `DrizzleCategoryRepository`, and focused `ListActiveCategories` integration coverage, then routed category listing through application layer while preserving active-only ordered payload behavior. Remaining Slice 5 work is moderation/reporting cleanup.
- 2026-06-04: Continued Slice 5 with `announcement.report`. Added `ReportRepository`, `DrizzleReportRepository`, and focused `ReportAnnouncement` integration coverage, then moved announcement existence checks, duplicate-report checks, and report creation behind application/infrastructure boundaries while preserving `NOT_FOUND`, `CONFLICT`, and success response behavior. Remaining Slice 5 work is moderator-side report queue cleanup (`listReported`, `dismissReports`, `suspend`, `reinstate`).
- 2026-06-04: Continued Slice 5 with `announcement.listReported`. Added `ListReportedAnnouncements` integration coverage, moved moderator/admin queue scope orchestration into application layer using `AnnouncementRepository`, `AssignmentRepository`, and `UserRepository`, and translated new domain-style queue errors in the router while preserving `NOT_FOUND`, `FORBIDDEN`, threshold filtering, and response payload behavior. Remaining Slice 5 work is `dismissReports`, `suspend`, and `reinstate`.
