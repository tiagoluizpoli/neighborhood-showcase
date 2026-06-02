## What to build

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

## Acceptance criteria

- [ ] Unused standalone validation functions are relocated as `private static` class methods and are no longer exported.
- [ ] Invariants validation remains fully operational via entity constructors, throwing standard domain errors.
- [ ] File `cpf.entity.ts` is deleted.
- [ ] CPF consumers import `{ hashCPF, isValidCPF }` from the correct auth utility path.
- [ ] Project compiles and the entire test suite passes.

## Blocked by

- [.specify/memory/issues/29_feature_flags_shared_package.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/29_feature_flags_shared_package.md)
