---
type: task
epic: 07-data-and-infrastructure
status: completed
blocked-by: null
---

## What to Build

Enable the PostGIS extension and add geospatial columns to the `condominium` and `providerLocation` tables so that proximity queries become possible.

1. **Enable PostGIS**: Add `CREATE EXTENSION IF NOT EXISTS postgis` to the migration pipeline (ensure it runs before any geospatial column creation).
2. **Add columns to `condominium`**: `latitude` (decimal), `longitude` (decimal), and `geog` (PostGIS `geography(Point, 4326)`) representing the gate/entrance coordinate.
3. **Add columns to `providerLocation`**: Same three columns. Only populated for independent/external locations — condominium-based providers inherit the condo's coordinates.
4. **Drizzle custom column type**: Create a reusable Drizzle custom column definition for `geography(Point, 4326)` using Drizzle's `customType` or `$type<T>()` pattern (reference the `grocery-store` repo for prior art).
5. **Migration**: Generate and apply the Drizzle migration.

## Acceptance Criteria

- [x] PostGIS extension is enabled in the database
- [x] `condominium` table has `latitude`, `longitude`, and `geog` columns
- [x] `providerLocation` table has `latitude`, `longitude`, and `geog` columns
- [x] A reusable Drizzle custom column type for `geography(Point, 4326)` exists in the schema package
- [x] Migration runs cleanly on a fresh database
- [x] Existing data is not affected (new columns are nullable)

## Sub-Tasks

_Sub-tasks will be defined when this task is executed._

---

<!-- INDEX SYNC: After completing a sub-task, update the parent
epic.md child task checklist AND .specify/memory/index.md in the
same turn. Never skip this sync step. -->
