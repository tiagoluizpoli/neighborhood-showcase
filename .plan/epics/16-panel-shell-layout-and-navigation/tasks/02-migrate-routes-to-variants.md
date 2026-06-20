---
type: task
id: T-16-02
epic: E-16
status: done
blocked-by: []
default-model: medium
---

## What to Build

Migrate every provider child route to consume a content-container variant and remove the per-route width and padding overrides that currently cause layout drift. "My Announcements" (full-width `px-6 py-8`) and "New Announcement" (centered `mx-auto max-w-4xl`) stop setting their own frames: list/index routes adopt `default/list`, create/edit forms adopt `centered-form`, and any intentional edge-to-edge surface adopts `full-bleed`. Layout drift can no longer be reintroduced at the route level.

## Context

Depends on T-16-01 (the container primitive and its provider-layout mount). Provider route surfaces include `panel.provider.announcements.index.tsx`, `panel.provider.announcements.new.tsx`, `panel.provider.announcements.$id.tsx`, `panel.provider.condo-setup.tsx`, `panel.provider.index.tsx`, and related anuncios routes. The dashboard remains the spacing benchmark. Do not redesign page content — only remove self-owned width/padding and select the correct variant.

## Acceptance Criteria

- [ ] List/index provider routes render the `default/list` variant and carry no own width/padding.
- [ ] Create/edit provider routes (e.g. New Announcement) render the `centered-form` variant and carry no own width/padding.
- [ ] Any intentional edge-to-edge surface uses the `full-bleed` variant deliberately.
- [ ] The previous per-route overrides (`px-6 py-8`, `mx-auto max-w-4xl`) are removed.
- [ ] Tests assert routes select the expected variant and no longer carry their own width/padding overrides.

## Sub-Tasks

### ST-01 - Migrate list/index provider routes to `default/list`

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Adopt the `default/list` variant on provider list/index routes (My Announcements list, provider index, condo-setup as applicable).
- Remove self-owned width/padding wrappers (e.g. full-width `px-6 py-8`) from those routes.
- Preserve page content and behavior; only the frame ownership moves to the container.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.index.tsx`
- `apps/web/src/routes/panel.provider.index.tsx`
- `apps/web/src/routes/panel.provider.condo-setup.tsx`
- other touched provider list/index route consumers

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- 2026-06-19: Audited the provider list/index surfaces after ST-02 from the prior epic. `panel.provider.index.tsx` already delegates straight to `ProviderDashboardRouteFrame` with no route-owned frame classes, so no code change was needed there.
- 2026-06-19: Removed the inherited dashboard-era `px-6 py-8` shell ownership from `panel.provider.announcements.index.tsx`; the page now relies on the canonical provider-layout `PanelContentContainer` default variant for framing.
- 2026-06-19: Audited `panel.provider.condo-setup.tsx` against the ST-01 contract and left it unchanged for this slice because its current surface is a centered activation flow rather than a list/index page consuming the `default/list` variant.

### ST-02 - Migrate create/edit provider routes to `centered-form`
 
status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Adopt the `centered-form` variant on provider create/edit routes (New Announcement and any sibling form route).
- Remove self-owned centering/width wrappers (e.g. `mx-auto max-w-4xl`) from those routes.
- Keep form behavior and validation untouched.

files-to-touch:
- `apps/web/src/routes/panel.provider.announcements.new.tsx`
- `apps/web/src/routes/panel.provider.announcements.$id.tsx`
- other touched provider form route consumers

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- 2026-06-19: Wrapped `panel.provider.anuncios.$id.pagamento.tsx` in `PanelContentContainer` with `variant="centered-form"`.
- 2026-06-19: Wrapped `panel.provider.condo-setup.tsx` return JSX in `PanelContentContainer` with `variant="centered-form"`, and removed custom `flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-4xl` centering wrappers.
- 2026-06-19: Audited `panel.provider.announcements.new.tsx` and `panel.provider.announcements.$id.tsx` which were already adopting `PanelContentContainer` with `variant="centered-form"`.


### ST-03 - Assert no per-route width/padding and correct variant selection
 
status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add/extend tests proving list/index routes render `default/list`, create/edit routes render `centered-form`, and routes no longer carry their own width/padding overrides.
- Reuse the route/layout render seam per v8 and v5/v6 prior art.
- Use the dashboard as the framing benchmark where a structural assertion guards against regression.

files-to-touch:
- `apps/web/src/routes/` (route-level tests)
- relevant existing panel route test files

verification:
- `bun run check`
- `bun run check-types`
- migration variant tests pass

#### Execution Notes

- 2026-06-19: Fixed the mock for `@tanstack/react-router` in `apps/web/src/routes/-panel.provider.announcements.test.tsx` to include `useSearch` and `useRouteContext` to resolve TanStack Router runtime export errors.
- 2026-06-19: Verified the 4 tests asserting that `announcements.index` and `announcements.$id` do not carry `px-6`/`py-8` overrides, and `announcements.new` correctly renders with `centered-form` variant and avoids raw `mx-auto max-w-4xl` divs. All tests pass successfully.
- 2026-06-19: Fixed the shared `@tanstack/react-router` mock in `apps/web/src/routes/-panel.provider.test.tsx` so the provider-layout and announcement-route seam tests can run together without missing `Link` / `useNavigate` exports.
- 2026-06-19: Re-ran `bun test apps/web/src/routes/-panel.provider.test.tsx apps/web/src/routes/-panel.provider.announcements.test.tsx` (7/7 pass) plus `bun run check-types` ✓ and `bun run check` ✓ (existing repo-wide warnings only).

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
