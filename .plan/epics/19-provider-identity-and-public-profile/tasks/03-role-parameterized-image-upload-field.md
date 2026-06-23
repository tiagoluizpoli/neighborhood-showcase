---
type: task
id: T-19-03
epic: E-19
status: in-progress
blocked-by: [T-19-02]
default-model: high
---

## What to Build

Collapse the three provider image roles onto ONE role-parameterized `ImageUploadField` driving the full asset lifecycle: empty → cropping (modal) → filled. The filled state exposes exactly three actions — **Replace** (pick a new file, re-enter the crop flow), **Re-crop** (re-open the cropper on the already-set image with NO new file upload), and **Remove** (clear the field, letting precedence fall through). Drop the raw URL text input from the provider-facing UI (the URL/data path stays valid at the data layer). Preview shape/size is parameterized per role: banner 16:9 wide, avatar round, logo square. Re-crop reopens the cropper on the ORIGINAL full-resolution upload (from T-19-02), so re-framing is lossless.

## Context

`apps/web/src/components/image-upload-field.tsx` is the component to refactor; it currently exposes a `urlInput` affordance and persists only the final cropped URL with no re-crop. It already uses the `react-easy-crop` cropper (see also `@/utils/crop-image`). T-19-02 added an original-source reference per role to the profile read/write contract — this task consumes it: on Re-crop, load the ORIGINAL and reopen the cropper; on Replace/initial crop, save both the new crop and the new original. Keep the URL prop/data path intact at the data layer; only the provider-facing UI stops rendering the text box. The other consumer `apps/web/src/components/account-page/profile-preferences.tsx` also uses this component — preserve its behavior (do not regress non-provider usage).

## Acceptance Criteria

- [ ] `ImageUploadField` is role-parameterized; preview shape matches role: banner 16:9 wide, avatar round, logo square.
- [ ] The lifecycle states are empty → cropping (modal) → filled.
- [ ] The filled state exposes Replace, Re-crop, and Remove; no raw URL text input is rendered in the provider-facing UI.
- [ ] Re-crop re-opens the cropper on the existing image and does NOT initiate a new file upload.
- [ ] Re-crop sources the ORIGINAL full-resolution upload (via the T-19-02 contract), not the derived crop.
- [ ] Replace picks a new file and re-enters the crop flow; Remove clears the field.
- [ ] The URL data path remains valid at the data layer (prop preserved); only the UI text box is removed.
- [ ] Non-provider usage (`profile-preferences.tsx`) is not regressed.
- [ ] Component test covers empty → cropping → filled transitions, the three filled actions, absence of a URL input, per-role preview shape, and that Re-crop opens the cropper without a new upload.
- [ ] All visible strings route through i18next `t()` with keys in both pt and en.

## Sub-Tasks

### ST-01 - Role-parameterize the field and remove the URL input

status: done
model: high
escalate-if:
- Parameterizing preview shape per role cannot be done without diverging into three components.
- Removing the URL text box breaks the non-provider `profile-preferences.tsx` consumer.

blocked-by: []

what-to-do:
- Add a `role` (banner | avatar | logo) prop driving preview shape/size: 16:9 wide, round, square.
- Remove the `urlInput` text box from the provider-facing rendering; keep the URL prop/data path valid.
- Preserve `profile-preferences.tsx` behavior.

files-to-touch:
- `apps/web/src/components/image-upload-field.tsx`

verification:
- `bun run check`
- `bun run check-types`

### ST-02 - Implement the filled-state Replace / Re-crop / Remove actions

status: ready
model: high
escalate-if:
- Re-crop cannot reopen the cropper without re-running the upload path.
- The original-source reference from the profile contract is unavailable to the component.

blocked-by:
- ST-01

what-to-do:
- Render Replace / Re-crop / Remove in the filled state.
- Re-crop reopens the cropper on the existing image with no new upload; Re-crop sources the ORIGINAL upload from the T-19-02 contract.
- Replace re-enters the crop flow with a new file; Remove clears the field.
- On crop save, persist both the derived crop and the original-source reference.

files-to-touch:
- `apps/web/src/components/image-upload-field.tsx`
- `apps/web/src/routes/panel/provider/-configuration-public-profile-section.tsx`

verification:
- `bun run check`
- `bun run check-types`

### ST-03 - Component test for lifecycle and actions

status: ready
model: medium
escalate-if:
- The cropper modal cannot be driven in the RTL harness to assert re-crop-without-upload.

blocked-by:
- ST-02

what-to-do:
- Add a component test: empty → cropping → filled; filled exposes Replace/Re-crop/Remove; no URL input; per-role preview shape; Re-crop opens cropper without a new upload.
- Verify suspicious failures per-file due to cross-file `mock.module` leakage.

files-to-touch:
- `apps/web/src/components/image-upload-field.test.tsx`

verification:
- `bun test apps/web/src/components/image-upload-field.test.tsx`
- `bun run check-types`

#### Execution Notes

- No execution notes yet.

---

<!-- INDEX SYNC: After completing a sub-task, run
.plan/helper-scripts/sync-state.sh and update the parent epic.md checklist and
.plan/index.md in the same turn. -->
