---
type: refactor
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Encapsulate entity validation methods and purge domain directory pollution:
1. Locate the standalone exported domain validation functions:
   - `validateAnnouncement`
   - `validateUnitInfo`
   - `validateCondominiumName`
   - `validateCEP`
   - `validateContactInfo`
2. Move these validations into their respective domain classes (`Announcement`, `Assignment`, `Condominium`, etc.) as `private static` methods, removing the `export` keyword. Validation must occur strictly during class constructor validation checks.
3. Delete the barrel file `cpf.entity.ts` under `entities/`.
4. Update all consumers that imported from `cpf.entity.ts` to import `{ hashCPF, isValidCPF }` directly from the auth package utility module `@neighborhood-showcase/auth/utils/cpf`.

## Acceptance Criteria

- [x] Unused standalone validation functions are relocated as `private static` class methods and are no longer exported.
- [x] Invariants validation remains fully operational via entity constructors, throwing standard domain errors.
- [x] File `cpf.entity.ts` is deleted.
- [x] CPF consumers import `{ hashCPF, isValidCPF }` from the correct auth utility path.
- [x] Project compiles and the entire test suite passes.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
