---
type: feature
epic: 13-provider-section-reorg
status: ready
blocked-by: 04_shrink_user_update_and_dtos.md
---

## What to Build

Replace the placeholder at `/panel/dashboard/configuration` with the real Configurações page. Three sections: Public Profile (7 fields with explicit "Salvar" button), Contact Channels (7 social links with explicit "Salvar" button), Public Visibility (1 toggle, auto-saves on toggle change with 300ms debounce). Use the new `trpc.providerProfile.get` and `trpc.providerProfile.update` procedures. Use the generalized `ImageUploadField` component (see `agents.local.md` §5 and Module 25 §"Image upload widget" — built in this task as a sub-component). Add the `configuracoes` i18n namespace to both `en` and `pt` translation files (English keys, Portuguese + English values). Apply the full-width layout rule (no `mx-auto max-w-*`). Add a Playwright E2E test that asserts the persistence round-trip end-to-end (edit `displayName`, save, reload, see the new value).

## Context

Module 25 of `/PRD.md`, §"Frontend: Configurações page". Depends on tasks 02 + 03 + 04 (the new `trpc.providerProfile` router and the shrunk `trpc.user.update` must be live). Existing placeholder route: `apps/web/src/routes/panel/dashboard/configuration.tsx`. The generalized `ImageUploadField` is created in this task from the existing `ProviderDashboardEditImageField`. Per `agents.local.md` §4 (full-width layout), §5 (English in all code, no hardcoded UI strings). Per the user's rule: no test.skip, real tRPC client, Playwright tests for every UI change. The existing `apps/web/tests/` directory has the pattern from PRD-v6.

## Acceptance Criteria

- [ ] `apps/web/src/routes/panel/dashboard/configuration.tsx` is replaced with the real Configurações page (not a placeholder)
- [ ] Section 1 (Public Profile) renders 7 fields (displayName, companyName, tradeName, avatarUrl, logoUrl, bannerUrl, publicDescription) with one "Salvar" button
- [ ] Section 2 (Contact Channels) renders 7 fields (whatsapp, phone, email, instagram, tiktok, facebook, website) in a 2-column grid on `sm+`, with one "Salvar" button
- [ ] Section 3 (Public Visibility) renders one `isProviderVisible` toggle; auto-saves on toggle change with 300ms debounce
- [ ] Each section's save button calls ONLY its own `trpc.providerProfile.update` mutation (per-section independence — a validation error in one section does NOT block the others)
- [ ] Each section shows its own success/error toast
- [ ] Avatar / logo / banner use the generalized `ImageUploadField` component (parameterized by aspectRatio: 1, 1, 16/9 respectively); logo and banner are dual-mode (URL input + upload button); User avatar is widget-only
- [ ] `publicDescription` textarea shows a character counter with a 500-char cap
- [ ] All UI labels and help text come from the `configuracoes` i18n namespace (keys in English, values in `en` + `pt`)
- [ ] Page uses full-width layout (`w-full` + `px-6 py-8`); no `mx-auto max-w-*` on the top-level wrapper
- [ ] Playwright E2E test in `apps/web/tests/configuracoes.spec.ts` covers: edit `displayName` → save → reload → assert new value; edit one social link → save → reload → assert; toggle `isProviderVisible` → assert auto-save fires the mutation after 300ms
- [ ] NO `test.skip()`; the test creates a Provider Profile row in the seed if missing
- [ ] `bun run check` and `bun run check-types` pass with zero warnings

## Sub-Tasks

### Sub-task 1: Generalize the image upload widget

**What to do:** Create `apps/web/src/components/image-upload-field.tsx` (or `apps/web/src/routes/panel/-image-upload-field.tsx`). Props: `aspectRatio: number`, `label: string`, `helpText: string`, `value: string`, `onChange: (url: string) => void`. Internal behavior: file picker → react-easy-crop → crop → upload to `/api/upload` → return URL → call onChange. For the Provider's logo and banner, the field renders BOTH a URL input AND an "ou faça upload" button (dual-mode). For the User avatar (used by task 06), the field renders ONLY the upload button (no URL alternative). URL paste does NOT trigger a crop (no file to crop). Update the existing `ProviderDashboardEditImageField` to use the new component (or delete it if the only consumer is the edit modal being deleted in task 08).

**Files to touch:** `apps/web/src/components/image-upload-field.tsx` (new), `apps/web/src/routes/panel/-provider-dashboard-edit-image-field.tsx` (refactor or delete)

**Verification:** Component renders with all 3 aspect ratios; URL-paste path and upload path both work in isolation (manual smoke test).

### Sub-task 2: Add `configuracoes` i18n namespace

**What to do:** Add a new top-level `configuracoes` key to both `apps/web/src/locales/en/translation.json` and `apps/web/src/locales/pt/translation.json`. The namespace contains all 9 field labels, 3 section titles, 1 button label, 1 page title + subtitle, and the help text for the public visibility toggle. Keys are English; values are in the respective language.

**Files to touch:** `apps/web/src/locales/en/translation.json`, `apps/web/src/locales/pt/translation.json`

**Verification:** `bun run check-types` passes; both files are valid JSON.

### Sub-task 3: Build the page

**What to do:** Replace `apps/web/src/routes/panel/dashboard/configuration.tsx` placeholder with the real Configurações page. Three sections as specified. Per-section save via `trpc.providerProfile.update` with the right partial input. Public Visibility auto-save uses a `useEffect` with a 300ms debounce on the toggle. All labels via `useTranslation('configuracoes')`. Apply the full-width layout (`w-full` + padding; no `mx-auto max-w-*`). Route guard: if the calling user has no Provider Assignment with `enabled = true`, redirect to `/panel/conta` with a toast.

**Files to touch:** `apps/web/src/routes/panel/dashboard/configuration.tsx`

**Verification:** Page renders correctly; save flows work end-to-end in dev.

### Sub-task 4: Playwright E2E test

**What to do:** Create `apps/web/tests/configuracoes.spec.ts`. Tests: (1) log in as `provider@test.com`, navigate to `/panel/dashboard/configuration`, edit `displayName`, click "Salvar", reload, assert the new value is shown; (2) edit the `instagram` social link, save, reload, assert persistence; (3) toggle `isProviderVisible` and assert the mutation fires after 300ms (use `page.waitForRequest` or similar). NO `test.skip()` — if the seed is missing a Provider Profile row for `provider@test.com`, extend the seed in this sub-task so the test runs for real.

**Files to touch:** `apps/web/tests/configuracoes.spec.ts` (new), the test seed file (extend if needed)

**Verification:** `bun run test:e2e` is green; all 3 scenarios pass for real.

---


<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
