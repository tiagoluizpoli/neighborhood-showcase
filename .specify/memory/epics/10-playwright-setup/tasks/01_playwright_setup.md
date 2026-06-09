---
type: feature
epic: 10-playwright-setup
status: completed
blocked-by: null
---

## What to Build

Install and configure Playwright in `apps/web/` so every subsequent UI task can immediately add a Playwright test. The setup includes: Playwright installation, `playwright.config.ts` configuration, a `tests/` directory scaffold, and a smoke test that verifies the sidebar renders with visible text (not raw i18n keys). This task unblocks all UI epics (11, 12).

## Context

No Playwright setup existed in the project. This is a greenfield install. The web app is at `apps/web/` and uses Vite as the bundler.

## Acceptance Criteria

- [x] `playwright` is installed as a dev dependency in `apps/web/`
- [x] `playwright.config.ts` exists in `apps/web/` with at least: testDir `tests/`, timeout30s, headless, and a baseURL pointing to the local dev server
- [x] `tests/` directory exists in `apps/web/` with at least one smoke test file
- [x] The smoke test opens the panel sidebar and asserts that visible text does NOT match any i18n key pattern (e.g. `sidebar.*`, `moderation.*`)
- [x] `bun run test:e2e` (or equivalent npm/pnpm script) runs the Playwright tests and exits with code 0
- [x] `bun run check` and `bun run check-types` pass with no errors

## Sub-Tasks

### Sub-task 1: Install Playwright

**What to do:** In `apps/web/`, install `playwright` and `@playwright/test` as dev dependencies. Run `playwright install` to download Chromium.

**Files to touch:** `apps/web/package.json`

**Verification:** `npx playwright --version` returns a version string.

### Sub-task 2: Create playwright.config.ts

**What to do:** Create `apps/web/playwright.config.ts` with:
- `testDir: './tests'`
- `timeout: 30_000`
- `use: { baseURL: 'http://localhost:5173', headless: true }`
- `reporter: [['list']]`
- `projects` with one Chromium config

**Files to touch:** `apps/web/playwright.config.ts`

**Verification:** File exists and exports a valid config object.

### Sub-task 3: Create tests directory scaffold

**What to do:** Create `apps/web/tests/` directory. Add `tests/smoke.spec.ts` with a test that:
1. Navigates to the panel sidebar (as a logged-in provider user — use `storageState` or `beforeEach` to authenticate)
2. Waits for the sidebar to load
3. Asserts that NO element's visible text matches the pattern `sidebar.` or `moderation.` (i.e. no raw i18n keys visible)
4. Asserts that at least one sidebar group label is visible and is a real translated string

**Files to touch:** `apps/web/tests/smoke.spec.ts`

**Verification:** `npx playwright test tests/smoke.spec.ts` passes with exit code 0.

### Sub-task 4: Add test script to package.json

**What to do:** Add to `apps/web/package.json` scripts:
- `"test:e2e": "playwright test"`
- `"test:e2e:ui": "playwright test --ui"` (optional but recommended)

**Files to touch:** `apps/web/package.json`

**Verification:** `bun run test:e2e` runs the smoke test and passes.

---

<!-- INDEX SYNC: After completing a sub-task, update the parent epic.md child task checklist AND .specify/memory/index.md in the same turn. Never skip this sync step.</!-->
