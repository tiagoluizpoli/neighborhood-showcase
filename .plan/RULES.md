# Engineering Rules

> READ THIS FIRST on every Ralph Loop iteration.
>
> This file is the `.plan/` copy of the repository's engineering rules so the
> planning surface carries the project's actual codebase rules.
>
> If `/RULES.md` and `.plan/RULES.md` diverge, fix the drift.
>
> Optional reference: `.plan/CONTEXT.md` mirrors `/CONTEXT.md`. It is not
> required for framework functionality. Read it only when the selected work
> depends on project glossary/domain-language distinctions (for example User vs
> Provider Profile ownership, role semantics, or sidebar visibility rules).

---

## 1. Clean Architecture — Layer Boundary Enforcement (CRITICAL)

This section is NON-NEGOTIABLE. Every line of code written, reviewed, or
refactored must respect these boundaries. Violations are blocking.

### 1.1 Dependency Direction (The Golden Rule)

Dependencies always point inward. Inner layers never know about outer layers.

```
Presentation → Application → Domain ← Infrastructure
```

- Domain is innermost. Depends on NOTHING external. Holds ALL interface
  contracts (repository interfaces, service interfaces, adapter interfaces)
  that other layers implement or consume.
- Application depends on Domain only.
- Infrastructure depends on Domain ONLY. It never depends on Application.
- Presentation depends on Application and Domain.
- Infrastructure and Presentation never depend on each other.
- Infrastructure and Application never depend on each other.

### 1.2 Domain Layer (`domain/`)

- Allowed imports: only from itself (`domain/`) and `shared/`.
- FORBIDDEN imports: `drizzle-orm`, `@neighborhood-showcase/db`,
  `@trpc/server`, `fastify`, `express`, external SDKs, anything from
  `infrastructure/` or `presentation/`.
- Error handling: Domain throws ONLY `DomainError` subclasses.

### 1.3 Application Layer (`application/use-cases/`)

- Allowed imports: domain entities, domain repository interfaces, domain
  errors, shared utilities.
- FORBIDDEN imports: `drizzle-orm` or ORM operators, `@neighborhood-showcase/db`,
  schema table definitions, `@trpc/server`, transport framework types,
  anything from `infrastructure/` or `presentation/`, third-party SDK clients.
- Error handling: use cases throw ONLY `DomainError` subclasses.
- Data access: use cases call repository interface methods. They never touch
  the DB client directly.

### 1.4 Infrastructure Layer (`infrastructure/`)

- Allowed imports: domain interfaces, domain entities, mappers,
  `drizzle-orm`, `@neighborhood-showcase/db`, third-party SDKs, shared
  utilities.
- FORBIDDEN imports: anything from `application/`, anything from
  `presentation/`, `@trpc/server`.
- Repositories: every repository class MUST implement a domain repository
  interface.

### 1.5 Presentation Layer (`presentation/`)

- Allowed imports: application use cases, domain entities, domain errors,
  `@trpc/server`, Zod schemas, shared utilities.
- FORBIDDEN imports: `drizzle-orm`, `@neighborhood-showcase/db`, anything from
  `infrastructure/` directly.
- Error translation: Presentation is the ONLY place where `TRPCError` is
  constructed.

### 1.6 Cross-Layer Data Contracts

- Across module boundaries, the only types that may flow are domain entities
  or lists of domain entities, plus primitives and Zod-validated DTOs at the
  presentation edge.
- Repositories return domain entities, never raw ORM rows or schema types.
- Use cases accept and return domain entities, value objects, or parameter
  objects.

### 1.7 Dependency Injection

- Use cases receive repository dependencies through constructor injection.
- Wiring happens at the composition root, not inside the use case.

### 1.8 Test Files Exception

- Integration test files may import from any layer for test setup purposes.
  This exception applies ONLY to test files, NEVER to production code.

### 1.9 Mechanical Enforcement

- Forbidden imports per layer are enforced by `biome.json` overrides using
  `noRestrictedImports`.
- Run `bun run check` after every change. Any Biome error is blocking.

## 2. DDD Domain Entities & Base Entity

- Base Entity: all entities must inherit from `Entity<TProps>` or
  `AuditableEntity<TProps>`.
- Encapsulation: enforce read-only getters. Modify state only through explicit
  domain methods.
- Invariants Validation: validate in the domain, not in outer layers.
- Decoupling: domain entities must never throw framework/network-specific
  exceptions like `TRPCError`.

## 3. Multi-Layer Mapping Protocol

- Presentation layer maps parsed Zod payloads into domain entities before
  passing them to use cases.
- Outgoing entities returned by use cases are mapped to plain JSON DTOs.
- Infrastructure repositories use concrete mappers to translate database rows
  into domain entities.

## 4. Global Error Handling & Payment Guards

- Use Fastify/tRPC formatting middleware to capture domain-specific
  `DomainError` exceptions and format them into bad-request `TRPCError`
  payloads.
- Payment guards:
  - `ACTIVE` → `ANNOUNCEMENT_ALREADY_ACTIVE`
  - `SUSPENDED` → `ANNOUNCEMENT_SUSPENDED`
  - `EXPIRED` → `ANNOUNCEMENT_EXPIRED`
- Payment failure UI:
  - `ANNOUNCEMENT_ALREADY_ACTIVE` → standard error toast, stay on page
  - `ANNOUNCEMENT_SUSPENDED` → distinct suspension toast with support guidance

## 5. Code Quality & Theme-Adaptive Styling

- Named exports only. No `export default` in production code.
- File length: limit files to ≤ 300 lines.
- No loose parameters: always use parameter objects/interfaces for use cases
  and repositories.
- No inline object types anywhere in the codebase.
- Simple styling only: no custom backgrounds, radial gradients, animations, or
  styling overrides.
- Theme adaptation: keep `ThemeProvider`; rely on semantic Tailwind utilities.
- No centered content — full-width layout by default. Do not use `mx-auto`
  plus top-level `max-w-*` wrappers except for the explicitly allowed cases
  (auth, legal/print layouts, modals, intentionally constrained marketing
  sections).
- Zero type/lint issues: run `bun run check` and `bun run check-types` after
  implementation. Warnings and errors are blocking.
- No Biome configuration changes unless explicitly requested by the user.

## 6. Internationalization (i18n) Strategy

- Support both English (`en`) and Portuguese (`pt`).
- No hardcoded UI strings. All user-facing text goes in locale translation
  JSON files.
- Sidebar namespace rules remain in force.
- The language switcher trigger shows the CURRENT language flag, not a globe.
- Use `useTranslation()` with the default namespace.
- Translation keys in English only.
- All code artifacts must be English.
- When touching a PT-named file/route/variable, rename it to English in the
  same change if it is in scope. If other PT-named items are discovered in the
  touched area but out of scope, log them to `.plan/backlog.md` and, if needed
  the preserved legacy backlog archive.

## 7. Role-Based Navigation & Route Guards

- Show the Moderação link only to authenticated users with an approved
  `MODERATOR` assignment.
- Unauthenticated access to protected routes redirects to `/`.
- Authenticated access above permissions redirects to `/dashboard` and renders
  a generic not-found treatment.

## 8. Feature Flagging (Unleash)

- Use Unleash for all environment-based feature flagging on client and server.

## 9. Early-Stage Database Migration Rules

- Before v1 release, do not accumulate migrations when dropping/replacing
  tables. Rebuild the base migration when appropriate.
- All schema changes via Drizzle schema files only.
- Manual SQL is forbidden.
- Migration snapshots are required.
- Password hashing must use `hashPassword` from `better-auth/crypto`.

## 10. Sidebar & Top Bar — UX Contract

- Every top-level sidebar group MUST have a visible group icon.
- Nested sub-items MUST have a visible item icon.
- Sidebar footer user area is one clickable surface opening a popover/menu.
- Sign out belongs in that popover and must require confirmation.
- Theme toggle cycles System → Light → Dark → System, not a popover.
- Language switcher is a popover; trigger shows the current flag.

## 11. PRD Disambiguation

- If a task term is ambiguous in the PRD, STOP and record
  `CLARIFICATION_NEEDED` in `.plan/progress.txt`. Do not guess.
- Canonical mapping:
  - Spectrum = application-level reporting / charts / KPIs / exports
  - Moderation Reports = flagged announcements and moderation queue

## 12. Ralph Loop Conduct

- Pick one executable sub-task per iteration.
- Respect blocked state. Do not invent unblocks.
- After atomic state changes, run `.plan/helper-scripts/sync-state.sh`.
- Update `.plan/progress.txt` during the run, not only at the end.
- Persist machine state in `.plan/.run-state.json`.
- Persist structured history in `.plan/.run-history.jsonl`.
- Persist durable carry-forward context in `.plan/.run-summary.md`.
- Use `.plan/helper-scripts/retrieve-history.sh` before implementation when
  touching previously-worked areas.
- Historical retrieval is bounded to three rounds. If still insufficient,
  block the sub-task and continue only with other dependency-safe executable
  work.
- After committing, run `bun run test`, `bun run check-types`, `bun run check`,
  and `bun run test:e2e` when UI changes are involved.
- If a task is blocked, record it to `.plan/progress.txt` and `.plan/backlog.md`.
- If all tasks are done, emit `<promise>NO MORE TASKS</promise>`.

## 13. Frontend Testing (Playwright)

- Playwright is mandatory for all UI changes.
- Run `bun run test:e2e` as a gate before committing any UI change.
- Screenshot assertions are required for visual regressions.
- No `test.skip()`.
- If seed data is missing, create the seed and rerun the tests.
- Tests verify external behavior only.
- If a test fails, self-correct before marking the task done.

## 14. Moderation Condo Context Selector

- localStorage key: `mod_ctx__cndo`
- Read on init: if stored ID is invalid, fall back to first assignment and
  overwrite localStorage.
- Write on change: every successful condo switch writes the new ID.
- Cleanup: if user has zero approved MODERATOR assignments, delete the key.
- UI position: first item inside the Moderation nav group.
- No project branding in the key name.

## 15. Planning-Surface Mirrors That Must Stay Current

These codebase-specific context files are part of the active Ralph Loop
planning surface and should stay aligned with their root/project originals:

- `.plan/RULES.md` ↔ `/RULES.md`
- `.plan/CONTEXT.md` ↔ `/CONTEXT.md`
- `.plan/PRD.md` ↔ active PRD lineage under `.plan/prds/`
- `.plan/backlog.md` ↔ current deferred/project follow-up work relevant to the
  active workflow

Use root `docs/adr/` as the canonical ADR store; do not duplicate ADR bodies
inside `.plan/` unless a task explicitly requires a planning summary.
