## What to build

Resolve the local development and compilation errors:
1. Update `INIT_ADMIN_API_TOKENS` environment setting in the `unleash` service configuration inside `docker-compose.yml` to change `default:development.unleash-insecure-api-token` to `*:*.unleash-insecure-admin-token` to ensure the server starts without validation errors.
2. Force Unleash to re-initialize and accept the new tokens by dropping and recreating the `unleash` database inside the PostgreSQL container:
   `docker exec -i neighborhood-showcase-postgres psql -U postgres -c "DROP DATABASE IF EXISTS unleash; CREATE DATABASE unleash;"`
   Then restart the Unleash docker container.
3. Move the translation folder `locales/` from `apps/web/public/locales` to `apps/web/src/locales`.
4. Update the JSON imports in `apps/web/src/i18n.ts` to reference `./locales/` instead of `../public/locales/` to satisfy Vite asset import restrictions.
5. Run `bun run db:push` to ensure all Drizzle tables (`condominium`, `announcement`, etc.) are synchronized with the local PostgreSQL database.

## Acceptance criteria

- [x] Unleash Docker container starts cleanly, processes tokens successfully, and responds to client features requests without 403 authorization errors.
- [x] Vite dev compilation completes successfully without warning/error regarding public asset JS imports.
- [x] Locales files exist under `apps/web/src/locales/` and the application compiles correctly.
- [x] Database tables are fully synchronized and dev queries run without throwing "relation does not exist" errors.
