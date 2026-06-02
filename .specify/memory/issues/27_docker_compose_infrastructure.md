## What to build

Relocate and enhance the Docker Compose configuration to support project-wide local services:
1. Move the `docker-compose.yml` from `packages/db/docker-compose.yml` to the project root.
2. Update the scripts (`db:start`, `db:stop`, `db:down`, etc.) in `packages/db/package.json` to reference the compose file in the parent directory (`../../docker-compose.yml`).
3. Add `unleash-server` (using the official `unleashorg/unleash-server` image) and a `redis` service for Unleash cache to the compose configuration.
4. Unleash should connect to the existing PostgreSQL service, utilizing a separate database named `unleash`. Modify/add an initialization database script or config to auto-create the `unleash` database if needed.
5. Update `.env.template` and local `.env` files to point at the local Unleash server URL (`http://localhost:4242`).

## Acceptance criteria

- [ ] `docker-compose.yml` is located at the project root directory.
- [ ] Scripts in `packages/db/package.json` successfully run compose commands referencing `../../docker-compose.yml`.
- [ ] Running `docker compose config` parses without errors.
- [ ] Local Unleash server and Redis containers are defined and start successfully when running `docker compose up`.
- [ ] Default Unleash configurations are exposed in `.env.template` and initialized in `.env`.

## Blocked by

- [.specify/memory/issues/26_analytics_impression_tracker.md](file:///home/tiago/01-dev-env/personal-repos/neighborhood-showcase/.specify/memory/issues/26_analytics_impression_tracker.md)
