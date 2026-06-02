## What to build

Purge all code and configurations related to the legacy boilerplate Todo application:
1. Delete the files and directories:
   - `apps/server/src/application/use-cases/todo/`
   - `apps/server/src/domain/use-cases/todo/`
   - `apps/server/src/domain/entities/todo.entity.ts`
   - `apps/server/src/domain/repositories/todo.repository.ts`
   - `apps/server/src/infrastructure/db/todo-repository.ts`
   - `apps/server/src/presentation/routers/todo.ts`
   - `packages/db/src/schema/todo.ts`
   - `apps/web/src/routes/todos.tsx`
2. Update references in the following files:
   - `packages/db/src/schema/index.ts` (remove todo export).
   - `apps/server/src/presentation/routers/index.ts` (remove todoRouter import and route field).
   - `apps/web/src/components/header.tsx` (remove `/todos` from navigation link array).
   - `agents.local.md` (update todo references in formatting examples).
3. Reset database migrations:
   - Delete `packages/db/src/migrations/` entirely.
   - Run `bun run db:generate` to recreate a fresh base PG schema migration without the `todo` table.

## Acceptance criteria

- [ ] All 8 todo directories and files are completely removed from the filesystem.
- [ ] Schema export, appRouter, navigation links, and guides references are fully removed.
- [ ] The `packages/db/src/migrations/` directory is cleared and regenerated with a clean base migration.
- [ ] No compilation or TypeScript errors exist in the codebase.
- [ ] The test suite passes completely (`bun run test`).

## Blocked by

None - can start immediately
