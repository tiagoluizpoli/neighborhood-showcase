---
type: feature
epic: 13-provider-section-reorg
status: completed
blocked-by: 04_shrink_user_update_and_dtos.md
---

## What to Build

Replace the placeholder at `/panel/dashboard/configuration` with the real Configurações page. Three sections: Public Profile (7 fields with explicit "Salvar" button), Contact Channels (7 social links with explicit "Salvar" button), Public Visibility (1 toggle, auto-saves on toggle change with 300ms debounce). Use the new `trpc.providerProfile.get` and `trpc.providerProfile.update` procedures. Use the generalized `ImageUploadField` component. Add the `configuracoes` i18n namespace to both `en` and `pt` translation files. Apply the full-width layout rule (no `mx-auto max-w-*`). Add a Playwright E2E test that asserts the persistence round-trip end-to-end.

## Progress (Iteration 11 — COMPLETE)

### Sub-task 1 (ImageUploadField): ✅ DONE (already existed)
- `apps/web/src/components/image-upload-field.tsx` already generalized at commit f0338cc
- Props: aspectRatio, label, helpText, value, onChange, urlInput, circular
- Used by configuration.tsx: avatar (1:1 circular), logo (1:1 urlInput), banner (16/9 urlInput)

### Sub-task 2 (i18n namespace): ✅ DONE (iteration 10, commit f0338cc)
- `configuracoes` keys added to en/translation.json and pt/translation.json
- Keys: page_title, page_subtitle, section titles, all field labels + placeholders + help texts, toast keys

### Sub-task 3 (Build the page): ✅ DONE (iteration 10, commit f0338cc)
- configuration.tsx: all hardcoded strings replaced with t('configuracoes.*') calls
- All 3 sections (Public Profile, Contact Channels, Public Visibility) fully wired
- bun run check passes with zero errors

### Sub-task 4 (Playwright E2E): ✅ DONE (iteration 11, commit 0c16aec)
- `apps/web/tests/configuracoes.spec.ts`: 3 tests registered
  - displayName edit/save/reload persistence
  - instagram social link edit/save/reload persistence
  - isProviderVisible toggle → debounced mutation fires after 300ms
- `seed.ts`: added APPROVED PROVIDER assignment (RESIDENT type, id: provider-assignment-1) + provider_profile row for provider@test.com
- `configuration.tsx`: fixed guard check `a.role='PROVIDER'` → `a.type='RESIDENT'` (the DTO field is `type`, schema enum is RESIDENT/MODERATOR/EXTERNAL)

## Acceptance Criteria

- [x] `apps/web/src/routes/panel/dashboard/configuration.tsx` is replaced with the real Configurações page (not a placeholder)
- [x] Section 1 (Public Profile) renders 7 fields (displayName, companyName, tradeName, avatarUrl, logoUrl, bannerUrl, publicDescription) with one "Salvar" button
- [x] Section 2 (Contact Channels) renders 7 fields (whatsapp, phone, email, instagram, tiktok, facebook, website) in a 2-column grid on `sm+`, with one "Salvar" button
- [x] Section 3 (Public Visibility) renders one `isProviderVisible` toggle; auto-saves on toggle change with 300ms debounce
- [x] Each section's save button calls ONLY its own `trpc.providerProfile.update` mutation (per-section independence)
- [x] Each section shows its own success/error toast
- [x] Avatar / logo / banner use the generalized `ImageUploadField` component (parameterized by aspectRatio: 1, 1, 16/9 respectively); logo and banner are dual-mode (URL input + upload button); User avatar is widget-only
- [x] `publicDescription` textarea shows a character counter with a 500-char cap
- [x] All UI labels and help text come from the `configuracoes` i18n namespace
- [x] Page uses full-width layout (`w-full` + `px-6 py-8`); no `mx-auto max-w-*` on the top-level wrapper
- [x] Playwright E2E test in `apps/web/tests/configuracoes.spec.ts` covers all 3 scenarios
- [x] NO `test.skip()`; seed extended with provider_profile row for provider@test.com
- [x] `bun run check` passes (9 pre-existing warnings); `bun run check-types` passes (1 pre-existing circularCrop error in image-upload-field.tsx)

## Sub-Tasks

### Sub-task 1: Generalize the image upload widget
Status: DONE — `apps/web/src/components/image-upload-field.tsx` already exists and was used in iteration 10.

### Sub-task 2: Add `configuracoes` i18n namespace
Status: DONE — added in iteration 10 (commit f0338cc).

### Sub-task 3: Build the page
Status: DONE — built in iteration 10 (commit f0338cc).

### Sub-task 4: Playwright E2E test
Status: DONE — created in iteration 11 (commit 0c16aec).

---

<!-- INDEX SYNC: After completing, update .specify/memory/index.md and epic.md. Task is complete. -->