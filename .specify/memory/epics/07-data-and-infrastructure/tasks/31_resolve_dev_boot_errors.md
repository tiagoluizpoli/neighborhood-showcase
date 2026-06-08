---
type: fix
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Resolve the local development and compilation errors:
1. Update Unleash initialization tokens in the `unleash` service configuration inside `docker-compose.yml` to support distinct Client and Frontend token types:
   ```yaml
   - INIT_ADMIN_API_TOKENS=*:*.unleash-insecure-admin-token
   - INIT_CLIENT_API_TOKENS=default:development.unleash-insecure-client-token
   - INIT_FRONTEND_API_TOKENS=default:development.unleash-insecure-frontend-token
   ```
2. Update the default values for `UNLEASH_API_TOKEN` and `VITE_UNLEASH_CLIENT_KEY` in:
   - `.env.template`
   - `packages/env/src/server.ts`
   - `packages/env/src/web.ts`
   to match the new tokens.
3. Force Unleash to re-initialize and accept the new tokens by dropping and recreating the `unleash` database inside the PostgreSQL container:
   `docker exec -i neighborhood-showcase-postgres psql -U postgres -c "DROP DATABASE IF EXISTS unleash; CREATE DATABASE unleash;"`
   Then restart the Unleash docker container.
4. Move the translation folder `locales/` from `apps/web/public/locales` to `apps/web/src/locales`.
5. Update the JSON imports in `apps/web/src/i18n.ts` to reference `./locales/` instead of `../public/locales/` to satisfy Vite asset import restrictions.
6. Run `bun run db:push` to ensure all Drizzle tables (`condominium`, `announcement`, etc.) are synchronized with the local PostgreSQL database.

## Acceptance Criteria

- [x] Unleash Docker container starts cleanly, processes tokens successfully, and responds to client features requests without 403 authorization errors.
- [x] Vite dev compilation completes successfully without warning/error regarding public asset JS imports.
- [x] Locales files exist under `apps/web/src/locales/` and the application compiles correctly.
- [x] Database tables are fully synchronized and dev queries run without throwing "relation does not exist" errors.

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
