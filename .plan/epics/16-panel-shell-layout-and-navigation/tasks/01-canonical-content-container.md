---
type: task
id: T-16-01
epic: E-16
status: done
blocked-by: []
default-model: medium
---

## What to Build

Introduce one canonical shared content container, owned at the provider-panel layout level, that replaces the bare `<Outlet />` and becomes the single source of layout truth for provider routes. The container owns max-width and padding and exposes exactly three explicit variants — `default/list`, `centered-form`, and `full-bleed` — that pages select rather than inventing their own frame. This is the foundation slice; per-route migration depends on it.

## Context

After v8, the canonical Provider namespace is `/panel/provider/*` and its group layout `apps/web/src/routes/panel.provider.tsx` renders a bare `<Outlet />` (`return <Outlet />;`). The PRD says "panel.dashboard layout level," but that language predates the v8 route migration; `/panel/dashboard` is now a redirect-only shim. Confirm the live seam during build and mount the container at the canonical provider layout that actually wraps provider child routes. The dashboard is the visual benchmark for the variant spacing values. Exact max-width/padding token values are an implementation detail tuned against the dashboard — the locked contract is "one container with named variants," not the numbers.

## Acceptance Criteria

- [x] A single content-container primitive exists with exactly three variants: `default/list`, `centered-form`, `full-bleed`.
- [x] The container is mounted at the canonical provider-panel layout, replacing the bare `<Outlet />`.
- [x] The container owns max-width and padding; variant values are benchmarked against the dashboard.
- [x] The variant boundaries are documented so child routes select a variant instead of authoring a shell.
- [x] Tests assert the container renders each variant at the route/layout seam.

## Sub-Tasks

### ST-01 - Build the content-container primitive with three variants

status: in-progress
model: medium
escalate-if:
- The three named variants cannot cleanly express the existing route surfaces without a fourth bespoke frame.

blocked-by: []

what-to-do:
- Create one content-container primitive exposing `default/list`, `centered-form`, and `full-bleed` variants.
- The primitive owns canonical max-width and padding per variant; do not hardcode per-page values inside it beyond the variant contract.
- Benchmark variant spacing against the dashboard reference; treat exact token values as tunable, not contractual.
- Document the variant boundaries so later packets do not re-decide framing per page.

files-to-touch:
- `apps/web/src/components/` (new shared content-container primitive)
- any shared layout/style token module the variants read from

verification:
- `bun run check`
- `bun run check-types`

#### Execution Notes

- Created `apps/web/src/components/panel-content-container.tsx` exporting `PanelContentContainer` and `PanelContentContainerVariant`.
- Three variants: `default` (`w-full`), `centered-form` (`mx-auto w-full max-w-2xl`), `full-bleed` (`w-full -mx-6 -my-6` — negates panel.tsx main's `p-6`).
- `data-container-variant` attribute on the wrapper div enables test assertions without implementation-detail coupling.
- No style token module was needed; variant classes are Tailwind utilities only.
- `bun run check` ✓ (9 pre-existing warnings, no errors), `bun run check-types` ✓.

### ST-02 - Mount the container at the provider layout and remove the bare Outlet

status: done
model: medium
escalate-if:
- The live provider layout seam differs from `panel.provider.tsx` and mounting there would change route semantics.

blocked-by: []

what-to-do:
- Confirm the canonical provider-panel layout that wraps `/panel/provider/*` child routes.
- Replace the bare `<Outlet />` with the content container wrapping `<Outlet />`, defaulting to the `default/list` variant.
- Do not change route guards, redirects, or the outer shell in `panel.tsx`.

files-to-touch:
- `apps/web/src/routes/panel.provider.tsx`

verification:
- `bun run check`
- `bun run check-types`
- provider routes render inside the container shell

#### Execution Notes

- Confirmed seam: `apps/web/src/routes/panel.provider.tsx` (`ProviderGroupLayout` component).
- Replaced bare `<Outlet />` with `<PanelContentContainer><Outlet /></PanelContentContainer>` (default variant).
- Route guards, redirects, and outer shell in `panel.tsx` unchanged.
- `bun run check` ✓ (9 pre-existing warnings, no errors), `bun run check-types` ✓.

### ST-03 - Test the container variants at the route/layout seam

status: done
model: medium
escalate-if: []
blocked-by: []

what-to-do:
- Add tests asserting the container renders each variant (`default/list`, `centered-form`, `full-bleed`) at the route/layout render boundary.
- Reuse the highest practical seam following v8 and v5/v6 panel test prior art; do not introduce new low-level seams.
- Do not assert exact pixel/token values; assert variant selection and that the container is present.

files-to-touch:
- `apps/web/src/routes/` (or co-located test for the provider layout)
- `apps/web/src/components/` (container primitive test)

verification:
- `bun run check`
- `bun run check-types`
- container variant tests pass

#### Execution Notes

- Created `apps/web/src/components/panel-content-container.test.tsx`: 5 tests asserting each variant sets `data-container-variant` correctly and children pass through.
- Created `apps/web/src/routes/-panel.provider.test.tsx`: 3 tests asserting container present at layout seam with `data-container-variant="default"` and Outlet inside.
- 8 tests across 2 files, all pass. `bun run check` ✓, `bun run check-types` ✓.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
