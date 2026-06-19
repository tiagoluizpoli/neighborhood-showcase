---
type: task
id: T-14-02
epic: E-14
status: ready
blocked-by: []
default-model: medium
---

## What to Build

Create the canonical Provider route group under `/panel/provider/*`, move Provider dashboard semantics into that namespace, and turn `/panel/dashboard` into a redirect-only migration shim that never regains real dashboard meaning.

## Context

PRD-v8 requires explicit section ownership. Today `/panel/dashboard` still behaves like a real route surface and many Provider flows still live under legacy dashboard URLs. This task performs the route-contract migration while preserving safe bookmark redirects and top-boundary blocking for non-Providers.

## Acceptance Criteria

- [ ] `/panel/provider/*` becomes the canonical Provider namespace for Provider-semantic dashboard flows.
- [ ] `/panel/dashboard` behaves only as a migration redirect shim and does not render a real dashboard experience.
- [ ] Non-Providers are blocked at the Provider route-group boundary before child Provider pages render.
- [ ] Provider nav, route links, and legacy redirects use the new namespace consistently.
- [ ] Playwright coverage proves both unauthorized direct-URL blocking and redirect-shim behavior.

## Sub-Tasks

## ST-01 - Introduce the Provider route-group boundary

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add the canonical `/panel/provider/*` route-group boundary.
- Enforce non-Provider rejection at the top boundary before child Provider pages render.
- Reuse the canonical Provider-enabled decision from T-14-01.

files-to-touch:
- `apps/web/src/routes/`
- route-group guard files for Provider-owned pages
- any route-tree or shared route helper files needed for the new namespace

verification:
- `bun run check`
- `bun run check-types`
- route tests proving non-Providers cannot open `/panel/provider/*`

#### Execution Notes

- Top-boundary protection is mandatory; hiding navigation is not sufficient.

### ST-02 - Migrate Provider dashboard ownership into `/panel/provider/*`

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Move Provider dashboard semantics and touched Provider-owned child routes into the canonical Provider namespace.
- Update touched links, navigations, and route references to the new section-owned paths.
- Preserve route intent while avoiding unrelated UI redesign.

files-to-touch:
- `apps/web/src/routes/panel.dashboard.tsx`
- `apps/web/src/routes/panel.dashboard.index.tsx`
- `apps/web/src/routes/panel.dashboard.announcements.*`
- `apps/web/src/routes/panel.dashboard.condo-setup.tsx`
- `apps/web/src/routes/panel/-provider-*`
- other touched route consumers

verification:
- `bun run check`
- `bun run check-types`
- touched provider flows load from `/panel/provider/*`

#### Execution Notes

- Preserve structural wrappers and route-level behavior where the UI already works.
- English-in-code renaming applies in touched route surfaces.

### ST-03 - Convert `/panel/dashboard` into redirect-only shim behavior

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Make `/panel/dashboard` resolve the signed-in User to the correct section-specific destination.
- Remove any real dashboard rendering responsibility from the legacy route.
- Keep legacy bookmarks and old public links working through redirects only.

files-to-touch:
- `apps/web/src/routes/panel.dashboard.tsx`
- `apps/web/src/routes/dashboard.tsx`
- `apps/web/src/routes/dashboard.index.tsx`
- other touched legacy route shims or entry points

verification:
- `bun run check`
- `bun run check-types`
- route tests prove `/panel/dashboard` is redirect-only

#### Execution Notes

- PRD-v8 explicitly forbids `/panel/dashboard` from regaining product-semantic dashboard meaning.

### ST-04 - Add Playwright coverage for Provider route migration and shim semantics

status: ready
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add E2E coverage for Provider sign-in landing, direct-URL blocking of `/panel/provider/*`, and legacy `/panel/dashboard` redirect-shim behavior.
- Add screenshot assertions where needed to verify section identity rather than runtime correctness alone.
- Use real seeded states; do not skip missing-role scenarios.

files-to-touch:
- `apps/web/tests/`
- relevant snapshot files
- relevant seed/setup files

verification:
- `bun run test:e2e`
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Section identity is part of the acceptance bar.
- Screenshot assertions should target stable section shells and route outcomes, not noisy dynamic areas.


---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
