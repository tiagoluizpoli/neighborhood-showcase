# Feature-sliced backend structure over classic layered Clean Architecture

We organize `apps/server/src/` by feature (condominium, announcement, provider, assignment) rather than by architectural layer (domain, application, infrastructure, presentation). Each feature folder contains its entity, repository interface, Drizzle adapter, use cases, and tRPC router. Cross-cutting infrastructure (AbacatePay, Telegram, Sharp, storage) lives in a shared `infra/` directory.

We chose this over classic layered directories because (a) with a single backend, four top-level layer directories add ceremony without leverage — the dependency rule is enforced through the import graph, not the folder tree; (b) locality is stronger — deleting a feature folder removes everything related to that concept; and (c) it mirrors the Bulletproof React feature-sliced organization on the frontend, giving the monorepo a consistent mental model.

## Considered Options

- **Classic layered**: `domain/`, `application/`, `infrastructure/`, `presentation/` top-level directories. Rejected because understanding one feature requires bouncing across four directories, and with one backend the extra indirection is not earning its keep.
- **Feature-sliced** (chosen): each feature owns its full vertical slice. Clean Architecture layers exist in the import graph (entity → use case → adapter → router), not the folder tree.
