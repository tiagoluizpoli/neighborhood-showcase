## What to build

Refactor domain models into domain entities using Domain-Driven Design (DDD) encapsulation:
1. Create base entity abstract classes in `apps/server/src/shared/base-entity.ts`:
   - `Entity<TProps>` (identity, props, equals).
   - `AuditableEntity<TProps>` (extends `Entity`, adds `createdAt`/`updatedAt` getters).
2. Refactor existing domain interfaces in `apps/server/src/domain/entities/` (`Condominium`, `Announcement`, `Assignment`, `Payment`) to classes:
   - Encapsulate internal properties and expose read-only getters.
   - Restrict mutation using explicit class domain methods and self-contained validation logic.
3. Decouple domain validation exceptions:
   - Create a base `DomainError` class in `apps/server/src/shared/domain-error.ts`.
   - Throw custom `DomainError` subclasses from entity constructors rather than framework-specific `TRPCError`.
   - Implement Fastify/tRPC router middleware/formatting to map standard `DomainError` classes to tRPC error status payloads.
4. Implement concrete database `EntityMapper` utilities under `apps/server/src/infrastructure/db/mappers/` to map between Drizzle database rows and Domain Entity instances.
5. Update server repositories to consume mappers and map database outputs to Domain Entities before returning them to use cases.

## Acceptance criteria

- [ ] Abstract class `Entity` and `AuditableEntity` created and exported correctly.
- [ ] Domain files (`condominium.entity.ts`, `announcement.entity.ts`, `assignment.entity.ts`, `payment.entity.ts`) are classes enforcing DDD invariants.
- [ ] Domain constructors throw custom `DomainError` instances.
- [ ] Backend tRPC router maps `DomainError` exceptions to bad-request `TRPCError` payloads.
- [ ] Database repository implementations use concrete `EntityMapper` classes.
- [ ] Server test suite compiles and runs successfully with green assertions.

## Blocked by

- [.specify/memory/issues/18_purge_legacy_todo_code.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/18_purge_legacy_todo_code.md)
