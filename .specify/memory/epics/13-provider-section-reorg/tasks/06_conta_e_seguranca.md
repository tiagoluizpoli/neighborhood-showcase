---
type: feature
epic: 13-provider-section-reorg
status: completed
blocked-by: 05_configuracoes_page.md
---

## What to Build

Slim `apps/web/src/routes/panel.conta.tsx` (currently named `panel.conta.tsx`) to User identity ONLY. Rename the page header to "Conta e Segurança". Add 4 sections: Profile (name, email read-only with "Verificado"/"Pendente" indicator, phone, image avatar), Preferences (language dropdown, theme radio — both with explicit "Salvar" button), Security (Senha + Sessões ativas placeholder cards with "Em breve" message), Danger Zone (existing deleteAccount button preserved). Drop centering, apply full-width layout. Translate the route file name + URL from `panel.conta` → `panel.account` (per the "act on PT names" rule) — this means also updating the sidebar link, any internal references, and the existing imports. The header toggles (ThemeCycleToggle + LanguageSwitcher) also write to the backend via the shrunk `trpc.user.update` (silent best-effort; no error toast on failure). Add a Playwright E2E test for the persistence round-trip and for the email verification indicator rendering.

## Context

Module 25 of `/PRD.md`, §"Frontend: Conta e Segurança". Depends on task 04 (the shrunk `trpc.user.update` and the extended `UserProfileDTO` with `image`/`language`/`theme`/`emailVerified` must be live). Existing route file: `apps/web/src/routes/panel.conta.tsx`. Existing i18n key prefix: likely `conta.*`. Per `agents.local.md` §5: translate the file + URL + i18n keys to English as part of this change (`panel.conta.tsx` → `panel.account.tsx`, `/panel/conta` → `/panel/account`, `conta.*` → `account.*`). Per the user's rule: no test.skip, Playwright tests for every UI change. The translated route is the route the sidebar Provedor-group guard (task 09) will redirect non-Providers to.

## Acceptance Criteria

- [x] `apps/web/src/routes/panel.conta.tsx` is renamed to `panel.account.tsx`; URL `/panel/conta` is renamed to `/panel/account`
- [x] The sidebar link to Conta is updated to the new route + label key
- [x] i18n key prefix `conta.*` is renamed to `account.*` in both locale files
- [x] Page header is "Conta e Segurança"
- [x] Section 1 (Profile) renders name, email (read-only with verified/pending indicator), phone, avatar upload widget (1:1, widget only)
- [x] Section 2 (Preferences) renders language dropdown + theme radio with explicit "Salvar" button
- [x] Section 3 (Security) renders "Senha" + "Sessões ativas" placeholder cards with "Em breve" message
- [x] Section 4 (Danger Zone) preserves the existing `deleteAccount` button + LGPD notice + confirmation modal
- [x] Header `ThemeCycleToggle` and `LanguageSwitcher` ALSO call `trpc.user.update` on change (silent best-effort, no error toast on failure)
- [x] Page uses full-width layout; no `mx-auto max-w-*` on the top-level wrapper
- [x] Playwright E2E test covers: edit `name` → save → reload → assert persistence; toggle theme in header → reload → assert persistence; visit page as user with verified email → assert green checkmark; visit as user with unverified email → assert amber dot
- [x] NO `test.skip()`; the test extends the seed if a user with a verified email is missing
- [x] `bun run check-types` passes with the repo's existing Vite chunk-size warnings; `bun run check` passes with the repo's existing unrelated warnings

## Sub-Tasks

### Sub-task 1: Rename route file + URL + i18n keys to English

**What to do:** Rename `apps/web/src/routes/panel.conta.tsx` → `panel.account.tsx`. Update the route path from `/panel/conta` to `/panel/account`. Update the sidebar link in `panel.tsx` to point to the new route + new label key. Rename the i18n prefix `conta.*` → `account.*` in both `apps/web/src/locales/{en,pt}/translation.json`. Search the codebase for any other consumer of `/panel/conta` or `conta.*` and update them. Per the operational policy, log any other PT-named items found in the touched area as new `deferred` rows in `.specify/memory/backlog.md` under the "Mixed-language route naming fix" policy.

**Files to touch:** `apps/web/src/routes/panel.conta.tsx` (rename), `apps/web/src/routes/panel.tsx` (sidebar link), `apps/web/src/locales/en/translation.json`, `apps/web/src/locales/pt/translation.json`, `.specify/memory/backlog.md` (log stacked leftovers, if any)

**Verification:** `bun run check-types` passes; no broken imports; sidebar navigates correctly to the new route.

### Sub-task 2: Add `account` i18n namespace

**What to do:** Add the new `account.*` keys to both locale files. The namespace contains: page title + subtitle, 4 section titles, all field labels and placeholders, the verified/pending indicator strings, the 2 "Em breve" placeholder messages, the danger zone title + LGPD notice, the success/error toast strings, the "Salvar alterações" button label, the character counter label, and the help text for the avatar widget.

**Files to touch:** `apps/web/src/locales/en/translation.json`, `apps/web/src/locales/pt/translation.json`

**Verification:** `bun run check-types` passes; both files are valid JSON.

### Sub-task 3: Build the slim page

**What to do:** Rewrite `panel.account.tsx` to the 4-section structure. Use `trpc.user.getProfile` for the initial load. Section 1 (Profile) uses `trpc.user.update` with the new shrunk input shape. Section 2 (Preferences) uses `trpc.user.update` with `language` / `theme`. The email field is read-only with a verified/pending indicator next to it (green checkmark / amber dot, no CTA). The avatar uses the generalized `ImageUploadField` (1:1, widget only — no URL input). Section 3 (Security) renders the 2 placeholder cards with "Em breve" message. Section 4 (Danger Zone) preserves the existing deleteAccount flow. Apply full-width layout.

**Files to touch:** `apps/web/src/routes/panel.account.tsx`

**Verification:** Page renders correctly in dev; the 4 sections show; the read-only email field is non-editable.

### Sub-task 4: Wire header toggles to backend persistence

**What to do:** Edit `apps/web/src/components/theme-cycle-toggle.tsx` and `apps/web/src/components/language-switcher.tsx`. After the local `next-themes` / `i18next` call, also call `trpc.user.update` with `theme` or `language` in the background. Use `.catch(() => {})` — silent best-effort, no toast, no UI block. The local UI is the source of truth for the instant toggle; the backend is the "restore on next device" signal. Per Module 25 §"Header preference toggles".

**Files to touch:** `apps/web/src/components/theme-cycle-toggle.tsx`, `apps/web/src/components/language-switcher.tsx`

**Verification:** Toggling theme/language in the header still works instantly; reload restores the backend value; no error toasts on transient network failures (manual smoke test).

### Sub-task 5: Playwright E2E test

**What to do:** Create `apps/web/tests/account.spec.ts`. Tests: (1) edit `name` → click "Salvar" → reload → assert the new value persists; (2) toggle theme in the header → reload → assert the same theme is restored; (3) visit `/panel/account` as a user with `emailVerified: true` and assert the green checkmark next to the email field; (4) visit as a user with `emailVerified: false` and assert the amber dot. NO `test.skip()` — extend the seed so there is at least one user with `emailVerified: true` AND one with `emailVerified: false`.

**Files to touch:** `apps/web/tests/account.spec.ts` (new), the test seed file (extend if needed)

**Verification:** `bun run test:e2e` is green; all 4 scenarios pass for real.

## Verification Notes

- `bun run test:e2e -- account.spec.ts` → 4 passed
- `bun run check-types` → passed
- `bun run check` → passed with 9 pre-existing unrelated warnings already present in the repo

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step. -->
