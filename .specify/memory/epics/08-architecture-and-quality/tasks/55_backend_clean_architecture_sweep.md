---
type: refactor
epic: 08-architecture-and-quality
status: completed
blocked-by: null
---

## What to Build

Perform a backend-wide, slice-by-slice cleanup that restores and enforces the Clean Architecture boundaries defined in `agents.local.md`.

This epic is not a feature implementation. It is a behavior-preserving architecture recovery pass. The current backend has production code paths where routers, use cases, domain objects, and infrastructure concerns are mixed. The sweep must identify those violations across the entire backend and move each behavior into the correct layer without changing product behavior.

## Acceptance Criteria

- [x] Backend production code has no presentation-layer imports from `@neighborhood-showcase/db`, `@neighborhood-showcase/db/schema/*`, `drizzle-orm`, or infrastructure implementations.
- [x] Backend application use cases have no imports from Drizzle, database schemas, tRPC, Fastify, infrastructure, presentation, or external SDK clients.
- [x] Backend domain code remains framework-free and infrastructure-free.
- [x] Infrastructure implementations depend on domain contracts and do not import application or presentation modules.
- [x] Each remediated backend slice has focused tests covering its externally observable behavior.
- [x] Tests are changed only for imports, wiring, or structure changes unless a separate behavior bug is documented.
- [x] Relevant focused tests pass after each slice.
- [x] Backend type/check commands pass before the epic is considered complete.
- [x] Files touched during the sweep are kept under the 300-line guideline where practical, or the exception is documented.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
