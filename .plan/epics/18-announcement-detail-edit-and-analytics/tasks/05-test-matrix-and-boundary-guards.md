---
type: task
id: T-18-05
epic: E-18
status: in-progress
blocked-by: [T-18-01, T-18-02, T-18-03, T-18-04]
default-model: high
---

## What to Build

Lock the packet's externally visible behavior with tests at the highest useful seam — the route boundary. Cover the view/edit/create route split, create/edit field parity through the shared form, the field-policy lock (identity non-editable plus a representative frozen field through the policy), the facts-first hierarchy, analytics visibility/placement, a create-flow regression guard, and a boundary guard that the public surface exposes no analytics or edit affordance. Add Playwright coverage for the create and edit end-to-end flows with seeded provider data.

## Context

Prefer route-level/component integration tests (RTL) over unit tests of form internals, reusing existing panel route tests (`apps/web/src/routes/-panel.provider.announcements.test.tsx`) and existing Playwright patterns (`apps/web/tests/meus-anuncios.spec.ts` + snapshots). Seed data is part of the test contract — do not use skipped tests as a substitute for setup. Be aware of cross-file `mock.module` leakage when reading a full `bun test` run; verify suspicious failures per-file. All test-visible strings still go through i18next `t()`.

## Acceptance Criteria

- [ ] Tests prove the shared `AnnouncementForm`: edit mode prefills every field and submits via `update` carrying the id; create mode submits via `create`; both expose the same inputs and validation.
- [ ] A test locks the field-policy seam: identity fields (id) are non-editable, and a representative field can be marked frozen through the policy/config without restructuring the form.
- [ ] View-page tests assert facts-first: title + key facts render in the primary block above analytics, the image is a constrained 4:3 cover (not a full-width hero), and the summary mini-card is absent.
- [ ] Analytics tests assert the three metric cards are always visible and the chart occupies the reduced height band, not the old 320px.
- [ ] A regression guard proves the create flow keeps its image cropper, contact section, and CTA section after the shared-form extraction.
- [ ] A boundary test proves the public surface (`_portal.anuncios.$id`) exposes no analytics or edit affordance.
- [ ] Playwright covers create and edit end-to-end with seeded provider data, including visual assertions protecting the facts-first layout and the demoted image cover.

## Sub-Tasks

### ST-01 - Shared-form parity and field-policy lock tests

status: done
model: high
escalate-if:
- The shared form lacks a seam that makes parity or the field-policy lock assertable without test-only abstractions.

blocked-by:
- T-18-01
- T-18-02

what-to-do:
- Add route/component tests for create (submit via `create`) and edit (prefill all + submit via `update` carrying id) parity.
- Add a test locking identity-field non-editability and a representative frozen field through the policy/config.

files-to-touch:
- `apps/web/src/routes/-panel.provider.announcements.test.tsx`

verification:
- `bun run check`
- `bun run check-types`
- parity + field-policy suites pass (verify per-file)

### ST-02 - View-page facts-first and analytics assertions

status: done
model: medium
escalate-if:
- The view layout cannot be asserted at the route seam without reaching into widget internals.

blocked-by:
- T-18-03
- T-18-04

what-to-do:
- Assert facts-first hierarchy (title + key facts above analytics), constrained 4:3 cover image (not full-width hero), and absent summary mini-card.
- Assert the three metric cards are always visible and the chart uses the reduced height band.

files-to-touch:
- `apps/web/src/routes/-panel.provider.announcements.test.tsx`

verification:
- `bun run check`
- `bun run check-types`
- view-page + analytics suites pass (verify per-file)

### ST-03 - Create regression guard and public-boundary guard

status: done
model: medium
escalate-if:
- The public surface cannot be asserted free of analytics/edit affordance without restructuring its route.

blocked-by:
- T-18-01
- T-18-03

what-to-do:
- Add a guard that the create flow retains cropper, contact section, and CTA section after extraction.
- Add a boundary test that `_portal.anuncios.$id` exposes no analytics or edit affordance.

files-to-touch:
- `apps/web/src/routes/-panel.provider.announcements.test.tsx`
- public announcement route test

verification:
- `bun run check`
- `bun run check-types`
- regression + boundary suites pass (verify per-file)

### ST-04 - Playwright create and edit end-to-end with seeded data

status: ready
model: high
escalate-if:
- Seeded provider data required for the edit flow is unavailable and cannot be added through existing seed paths.

blocked-by:
- ST-01
- ST-02
- ST-03

what-to-do:
- Extend Playwright coverage for create and edit end-to-end with seeded provider data.
- Add/refresh visual assertions protecting the facts-first layout and demoted image cover.

files-to-touch:
- `apps/web/tests/meus-anuncios.spec.ts`
- `apps/web/tests/meus-anuncios.spec.ts-snapshots/`

verification:
- `bun run check`
- `bun run check-types`
- Playwright create/edit specs pass with updated snapshots

#### Execution Notes

- ST-01 done. Rewrote `apps/web/src/routes/-panel.provider.announcements.test.tsx`.
  Two stale tests that clicked "Editar anúncio" to swap `$id` into an inline edit
  form were obsolete after T-18-02/T-18-03 (the `$id` detail page is now read-only
  and the Edit button navigates to `$id/edit`). They are replaced by edit-route
  tests that render `panel.provider.announcements.$id.edit` → `<AnnouncementForm
  mode="edit">`. This was the attempt-1 red baseline.
- Parity coverage: edit-mode prefill (title/subtitle/description + inherited
  contact badge + custom-phone), edit submit → `announcement.update` carrying
  `id` and no `providerAssignmentId` (location-fixed) and never `create`; create
  submit → `announcement.create` with `providerAssignmentId` and no `id`, never
  `update`; a "same authoring input surface" test renders both modes and asserts
  identical input set.
- Mutation seam: the existing trpc mock's `mutationFn` now records
  `{ method, variables }` into a module-level `mutationCalls` array (reset in
  `beforeEach`), so which procedure fires and with what payload is assertable at
  the route boundary without test-only production abstractions.
- Field-policy lock: asserts `resolveAnnouncementFieldPolicy('edit').id.editable
  === false` and `('create') === true`, that no `#id` input renders, and that a
  representative frozen field (title) passed via the `fieldPolicy` prop renders
  `disabled` while a non-frozen field (subtitle) stays enabled.
- happy-dom seams: the real category combobox (Base UI popover + cmdk) never
  mounts its options without layout, so it is stubbed to a controlled button at
  the test boundary (no other suite imports it → no leak). The `react-easy-crop`
  stub now fires `onCropComplete` so an uploaded image yields a non-null
  `croppedAreaPixels`. `@/utils/crop-image` is deliberately NOT module-mocked
  (that would leak and red `crop-image.test.ts`); instead the create test patches
  `Image`/`document.createElement('canvas')`/`fetch` locally and restores them in
  `finally`, matching the technique in `crop-image.test.ts`.
- Gates: `bun run check-types` clean (4/4); `bun run check` clean (pre-existing
  broken-symlink info + 6 warnings only; biome auto-formatted the test file).
  Suite green 11/11 per-file; co-run with `crop-image.test.ts` 12/12 confirms no
  cross-file `mock.module` leakage.
- ST-02/ST-03/ST-04 remain open.
- ST-02 done. Added 5 tests + `importDetailRoute` helper to
  `apps/web/src/routes/-panel.provider.announcements.test.tsx`.
  (1) Title renders in `h1` before the analytics `<section>` (compareDocumentPosition bit 4).
  (2) Cover image has `object-cover` + `aspect-[4/3]` + `lg:w-[300px]` wrapper (not full-width hero).
  (3) No `border-dashed` element in output — absent summary mini-card; analytics
      chart path renders (not loading/error states) because `initialData: null`
      from the proxy puts `analyticsQuery.isLoading = false`, `isError = false`.
  (4) Metric labels "Visualizações", "Interações", "Conversão" all present (unconditional render).
  (5) `h-[210px]` in innerHTML, `h-[320px]` absent.
  Gates: check-types 4/4 clean; check clean (pre-existing biome info+warnings).
  16/16 per-file; 17/17 co-run with crop-image.test.ts confirms no leakage.
- ST-03 done. Added 2 tests to `-panel.provider.announcements.test.tsx`.
  (1) Create regression guard: renders `<AnnouncementForm mode="create" />` and asserts
      `input[type="file"]` (image upload → cropper), `[data-testid="contact-mode-inherit-badge"]`
      (contact section), and `[data-testid="cta-section"]` (CTA section) all present —
      verifying the shared-form extraction preserved all three authoring sections.
  (2) Public boundary guard: extends the existing trpc mock with a `getPublic` case
      (new `mockPublicAnnouncementData` module variable, reset in `beforeEach`); adds
      `importPortalRoute` helper. Renders `_portal.anuncios.$id` with a full fixture and
      asserts: no "Visualizações"/"Interações"/"Conversão" metric card labels; no
      `h-[210px]`/`h-[320px]` analytics chart classes; no `/edit` in innerHTML; no
      "Editar" in text — proving the public surface exposes no analytics or edit affordance.
  Inlined into the existing file (reuses established `@/utils/trpc` + `@/lib/auth-client`
  mocks → no new `mock.module` calls, no leakage risk).
  Gates: check-types 4/4 clean; check clean (pre-existing). 18/18 per-file;
  19/19 co-run with crop-image.test.ts confirms no leakage. Next: ST-04.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
