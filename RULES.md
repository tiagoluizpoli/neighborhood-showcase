# Engineering Rules — Canonical, Loaded Every Iteration

> **READ THIS FIRST.** Every Ralph Loop iteration must read this file before
> `agents.local.md`, `PRD.md`, or any task file. This is the single source of
> truth for engineering rules. `agents.local.md` is project-context only and
> must not duplicate rules from here.
>
> If a rule in this file conflicts with code already in the repository, the
> rule wins. File an issue (or a deferred-backlog entry) — do not silently
> follow the existing code.

---

## 1. Clean Architecture — Layer Boundary Enforcement (CRITICAL)

This section is **NON-NEGOTIABLE**. Every line of code written, reviewed, or
refactored must respect these boundaries. Violations are blocking — they must
be fixed before any task is considered complete.

### 1.1 Dependency Direction (The Golden Rule)

Dependencies always point inward. Inner layers never know about outer layers.

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain** is innermost. Depends on NOTHING external. Holds ALL interface
  contracts (repository interfaces, service interfaces, adapter interfaces)
  that other layers implement or consume.
- **Application** depends on Domain only (consumes repository/service
  interfaces and entities).
- **Infrastructure** depends on Domain ONLY (implements its interfaces). It
  never depends on Application.
- **Presentation** depends on Application (calls use cases) and Domain
  (maps entities to DTOs).
- **Infrastructure and Presentation never depend on each other.**
- **Infrastructure and Application never depend on each other.** They both
  depend on Domain.

### 1.2 Domain Layer (`domain/`)

- **Allowed imports:** only from itself (`domain/`) and `shared/`.
- **FORBIDDEN imports:** `drizzle-orm` or any ORM/database library,
  `@neighborhood-showcase/db` or any database package, `@trpc/server` or any
  HTTP/RPC framework, `fastify`/`express` or any transport framework, any
  external SDK or third-party service client, anything from `infrastructure/`
  or `presentation/`.
- **Error handling:** Domain throws ONLY `DomainError` subclasses. Never
  framework-specific errors.

### 1.3 Application Layer (`application/use-cases/`)

- **Allowed imports:** domain entities, domain repository interfaces, domain
  errors, shared utilities.
- **FORBIDDEN imports:** `drizzle-orm` or any ORM operator (`eq`, `and`,
  `sql`, `desc`, `ilike`, `inArray`, `isNull`, `alias`, etc.),
  `@neighborhood-showcase/db` (the `db` client instance),
  `@neighborhood-showcase/db/schema/*` (any schema table definition),
  `@trpc/server` (`TRPCError` or any tRPC type), `fastify` or any HTTP
  framework type, any direct file from `infrastructure/` or `presentation/`,
  any third-party SDK client.
- **Error handling:** use cases throw ONLY `DomainError` subclasses. The
  Presentation layer is responsible for translating `DomainError` into
  `TRPCError`.
- **Data access:** use cases call repository interface methods. They never
  construct SQL queries, use ORM operators, or touch the database client
  directly.

### 1.4 Infrastructure Layer (`infrastructure/`)

- **Allowed imports:** domain interfaces (to implement them), domain entities
  (to return them), domain mappers (`infrastructure/db/mappers/`),
  `drizzle-orm`, `@neighborhood-showcase/db`, third-party SDKs, shared
  utilities.
- **FORBIDDEN imports:** anything from `application/` (use cases,
  application services), anything from `presentation/` (routers, tRPC
  context), `@trpc/server` or any transport framework.
- **Repositories:** every repository class MUST implement a domain repository
  interface. Raw database schemas and ORM operators are ONLY used inside
  repository methods, never exposed to callers.

### 1.5 Presentation Layer (`presentation/`)

- **Allowed imports:** application use cases (to invoke them), domain
  entities (to map them to response DTOs), domain errors (to catch and
  translate them), `@trpc/server` (tRPC types, `TRPCError` — belongs HERE
  only), Zod schemas for input validation, shared utilities.
- **FORBIDDEN imports:** `drizzle-orm` or any ORM library,
  `@neighborhood-showcase/db` or any database package, anything from
  `infrastructure/` directly (no repository implementations, no DB clients).
- **Error translation:** the Presentation layer catches `DomainError`
  instances thrown by use cases and maps them to `TRPCError` with appropriate
  HTTP codes. This is the ONLY place where `TRPCError` is constructed.

### 1.6 Cross-Layer Data Contracts

- Across module boundaries, the **only** types that may flow are **domain
  entities** or **lists of domain entities** (plus primitives and Zod-validated
  DTOs at the presentation edge).
- Repositories return domain entities, never raw ORM rows or schema types.
- Use cases accept and return domain entities (or value objects / parameter
  objects), never raw ORM rows, framework types, or transport types.
- A repository that returns something other than a domain entity (or a
  collection of them) is a layering violation.

### 1.7 Dependency Injection

- Use cases receive their repository dependencies through constructor
  injection (parameter objects). They never instantiate concrete repositories
  directly.
- Wiring (composing use cases with their concrete infrastructure
  dependencies) happens at the composition root (e.g., the router or a DI
  container), NOT inside the use case.

### 1.8 Test Files Exception

Integration test files (`*.integration.test.ts`, `*.test.ts`) are allowed to
import from any layer for test setup purposes (e.g., seeding the database
directly). This exception applies ONLY to test files, NEVER to production
code.

### 1.9 Mechanical Enforcement

The forbidden imports per layer are enforced by `biome.json` overrides using
the `noRestrictedImports` rule. The Ralph Loop must run `bun run check` after
every change. Any biome error is blocking and must be fixed before the task
can be marked complete.

---

## 2. DDD Domain Entities & Base Entity

- **Base Entity:** all entities must inherit from abstract class
  `Entity<TProps>` (managing identity and equality comparison) or
  `AuditableEntity<TProps>` (adding `createdAt`/`updatedAt` timestamps).
- **Encapsulation:** enforce read-only getters for properties. Modify state
  only through explicit domain methods.
- **Invariants Validation:** do not validate data outside the domain.
  Constructor validation must verify all properties and throw custom
  subclasses of `DomainError` on failure.
- **Decoupling:** domain entities must never throw framework/network-specific
  exceptions like `TRPCError`.

## 3. Multi-Layer Mapping Protocol

- **Presentation Layer (tRPC):**
  - Parsed Zod payloads must be mapped directly into Domain Entity instances
    before passing them to application use cases.
  - Outgoing entities returned by use cases must be mapped to plain JSON DTO
    objects for network transport.
- **Infrastructure Layer (Drizzle):**
  - Repositories must consume concrete mappers (implementing the shared
    `EntityMapper` interface) to translate database rows into domain
    entities, preventing database schemas from leaking into use cases or the
    domain layer.

## 4. Global Error Handling & Payment Guards

- **Domain Decoupling:** use Fastify/tRPC formatting middleware to capture
  domain-specific `DomainError` exceptions and format them into bad-request
  `TRPCError` payloads, separating domain rules from network protocols.
- **Payment Guards & Identifiers:** when payment is initiated (e.g.
  `GeneratePaymentIntent`), the backend must guard against processing
  payments for non-draft/non-expired states:
  - If status is `ACTIVE`, throw tRPC error with code
    `ANNOUNCEMENT_ALREADY_ACTIVE`.
  - If status is `SUSPENDED`, throw tRPC error with code
    `ANNOUNCEMENT_SUSPENDED`.
  - If status is `EXPIRED`, throw tRPC error with code
    `ANNOUNCEMENT_EXPIRED`.
- **Payment Failure UI:** when a payment call fails:
  - For `ANNOUNCEMENT_ALREADY_ACTIVE`, show a standard error toast and keep
    the user on the page.
  - For `ANNOUNCEMENT_SUSPENDED`, show a distinct toast indicating suspension
    and explicitly suggest contacting support.

## 5. Code Quality & Theme-Adaptive Styling

- **Named exports** only. No `export default` in production code.
- **File length:** limit files to ≤ 300 lines.
- **No loose parameters:** always use Parameter Objects/interfaces for use
  cases and repositories.
- **Simple Styling:** do not add custom backgrounds, radial gradients,
  animations, or styling overrides. Stick strictly to standard shadcn
  variables and layout rules.
- **Theme Adaptation:** keep the `ThemeProvider`. Avoid hardcoding dark or
  light classes. Support system-wide themes dynamically by relying entirely
  on Tailwind semantic utilities (`bg-background`, `text-foreground`,
  `border`, etc.).
- **Zero Type / Lint Issues:** run `bun run check` and `bun run check-types`
  after every implementation. All warnings and errors are blocking.

## 6. Internationalization (i18n) Strategy

- **Translation Files:** support both English (`en`) and Portuguese (`pt`).
- **No Hardcoded Strings:** all user-facing text, notifications, error
  messages, and descriptions must go into locale translation JSON files.
  Hardcoding UI strings directly in component files is strictly prohibited.
- **Sidebar namespace:** all sidebar group labels, item labels, badge count
  labels, and user menu items must live in `locales/pt/translation.json` and
  `locales/en/translation.json` under a `sidebar` namespace key.
- **Language switcher behavior:** the language switcher trigger shows the
  flag of the **currently selected** language (BR for `pt`, US for `en`), NOT
  a generic globe icon.
- **i18n namespace:** use `useTranslation()` (no argument — default
  namespace `translation`). Do NOT use `useTranslation('sidebar')` or any
  other custom namespace. Translation JSON files already have `sidebar` as a
  top-level key inside the `translation` namespace.
- **Translation keys in English only:** every i18n key path (the part before
  the colon, e.g. `sidebar.group.provedor`, `moderation.title`) must be
  written entirely in English. The translated values (the strings after the
  colon) are in the respective language. This applies to ALL code: file
  names, variable names, function names, route paths, i18n key paths, and any
  other code artifact must be English. No exceptions.

## 7. Role-Based Navigation & Route Guards

- **Link Visibility:** show the "Moderação" link in the navigation menu only
  to authenticated users who have an approved assignment of type `MODERATOR`.
- **Route Redirection rules:**
  - Direct URL access to protected routes (`/dashboard/*`, `/moderation`,
    `/admin`) by **unauthenticated** users must redirect to the home page
    `/` (Início).
  - Direct URL access to routes above permissions (e.g. a standard provider
    accessing `/admin` or `/moderation`) by **authenticated** users must
    redirect to `/dashboard` (Painel) and display a generic "Page Not Found"
    layout, treating the page as non-existent.

## 8. Feature Flagging (Unleash)

- Use Unleash for all environment-based feature flagging. Dynamic toggling
  of experimental modules must go through Unleash checks on client and
  server.

## 9. Early-Stage Database Migration Rules

Because the repository is at its beginning and before v1 release, do not
accumulate migrations when dropping or replacing tables (such as legacy
`todo`). Wipe the `packages/db/src/migrations/` directory, drop the table
schema definitions, and generate a new base schema migration from scratch.

## 10. Sidebar & Top Bar — UX Contract

- **Sidebar group icons:** every top-level sidebar group (Provedor,
  Moderação, Administração, Spectrum) MUST have a visible group icon. Nested
  sub-items MUST have a visible item icon — never a bare right-chevron.
- **Sidebar footer user area:** the user row (avatar + name + email) is a
  single clickable surface that opens a popover/menu. The popover contains
  the "Conta" link and the "Sair" (sign out) action. The "Sair" action must
  prompt confirmation before signing out. There is no inline sign-out button
  next to the user row.
- **Top bar theme toggle:** a single button that cycles through three
  states — System → Light → Dark → System. Icons are monitor (System), sun
  (Light), moon (Dark). NOT a popover.
- **Top bar language switcher:** a popover. The trigger shows the flag of
  the **currently selected** language (BR for `pt`, US for `en`). Inside the
  popover, both language options are listed with their flags.

## 11. PRD Disambiguation

- Before implementing a task whose description uses a term that appears
  elsewhere in the PRD with a different meaning (e.g. "Reports" used both
  for moderation and for admin analytics), STOP and surface a
  `CLARIFICATION_NEEDED` entry to `progress.txt` and exit the iteration. Do
  not guess.
- The current canonical mapping is:
  - **Spectrum** (Module 23, top-level sidebar block, ADMINISTRATOR only) =
    application-level reporting — charts, KPIs, audit-trail exploration,
    CSV/PDF exports.
  - **Moderation Reports** (Module 6) = user-flagged announcements, the
    `report` table, the moderation queue. This is unrelated to Spectrum and
    must not be conflated with it.

## 12. Ralph Loop Conduct

- Read `RULES.md` first, then `agents.local.md`, then `PRD.md`, then
  `.specify/memory/index.md`, then the current epic, then the current task.
- Pick **one** task per iteration. Complete it. Commit. Log. Stop. The next
  iteration starts cold and reads these files from scratch.
- After committing, run `bun run test`, `bun run check-types`, and
  `bun run check` (biome). All three must pass before marking the task
  complete.
- If a task is blocked, emit `<promise>ABORT</promise>` and write the
  blocker to `progress.txt` and `.specify/memory/deferred_backlog.md`.
- If the PRD term is ambiguous, emit `CLARIFICATION_NEEDED` and stop. Do
  not proceed under a guess.
- If all tasks are done, emit `<promise>NO MORE TASKS</promise>`.

## 13. Frontend Testing (Playwright)

- **Playwright is mandatory for all UI changes.** Before any task touching
  frontend code is considered complete, a Playwright test must exist that
  verifies the visual/behavioral change.
- Install Playwright from scratch in `apps/web/`. Configure `playwright.config.ts`
  and create a `tests/` directory.
- Tests verify external behavior only — route navigation, visible text,
  sidebar structure, form submission. Do not test implementation details.
- If a test fails, the loop self-corrects before marking the task done.

## 14. Moderation Condo Context Selector

- **localStorage key:** `mod_ctx__cndo` — stores the currently selected
  `condominiumId` for the moderation context.
- **Read on init:** if stored ID not in current assignments, fall back to
  first assignment and overwrite localStorage.
- **Write on change:** every successful condo switch writes the new ID.
- **Cleanup:** if user has zero approved MODERATOR assignments, delete
  `mod_ctx_cndo` from localStorage entirely.
- **UI position:** first item inside the Moderation nav group. Visually
  distinct from nav items (not a SidebarMenuButton — a custom selector
  component). If only one condo, display name only (non-interactive, no
  chevron). If 2+, display name + chevron and open a dropdown list.
- **No project branding in the key name.** The key must look like internal
  technical state, not user-facing content.

<!-- INDEX SYNC: This file is project-root canonical rules. Any change here
should also be reflected in agents.local.md (project-context only) and the
ralph-loop-orchestrator skill. -->


