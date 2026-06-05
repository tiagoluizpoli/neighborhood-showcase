# Layered Clean Architecture supersedes feature-sliced backend structure

## Status

Accepted

Supersedes `0001-feature-sliced-backend.md`.

## Context

The current backend codebase under `apps/server/src/` is organized by Clean Architecture layers:

- `domain/`
- `application/`
- `infrastructure/`
- `presentation/`
- `main/`

This is no longer an accidental intermediate state. It is the intended seam for the backend.

`0001-feature-sliced-backend.md` documented the opposite direction: feature-first folders with architectural layering enforced only through the import graph. That ADR now conflicts with both the actual codebase and the team direction.

The project also already carries repo-local architecture rules in `agents.local.md` that assume layered Clean Architecture with explicit dependency direction:

`Presentation -> Application -> Domain <- Infrastructure`

Future review, remediation, and Ralph Loop work needs a truthful architectural source of record so the repo is not pulled in two different directions.

## Decision

The backend architecture is organized by Clean Architecture layers, not by feature slices.

The primary backend seam is:

- `presentation/` for transport and request/response translation
- `application/` for orchestration through use cases
- `domain/` for entities, domain contracts, and domain rules
- `infrastructure/` for concrete adapters such as Drizzle repositories, storage, and email
- `main/` for composition root and server bootstrap

We are explicitly choosing this layered structure because:

1. It matches the current codebase and the intended long-term direction.
2. It keeps dependency direction visible in the filesystem, not only in import discipline.
3. It aligns with the existing repo-local architecture enforcement rules already used during implementation and review.
4. It gives Ralph Loop a stable structural target for architecture recovery work.

## Consequences

### Positive

- ADRs now match reality and team intent.
- Architecture reviews can judge the backend against a single documented model.
- Refactors can optimize for layer purity without re-litigating feature slicing.
- Composition-root work in `src/main/` remains first-class rather than incidental.

### Negative

- Understanding one domain capability may still require traversing multiple layer folders.
- Large modules can still accumulate inside a layer unless additional decomposition work is done.
- The frontend and backend no longer share the same high-level folder strategy by default.

## Considered options

- **Feature-sliced backend**: rejected as the active architecture for this repo. Preserved only in `0001` as history.
- **Layered Clean Architecture** (chosen): the backend uses explicit top-level architectural layers as the organizing seam.
