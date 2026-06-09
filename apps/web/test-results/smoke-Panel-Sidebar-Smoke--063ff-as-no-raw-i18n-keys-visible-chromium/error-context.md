# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Panel Sidebar Smoke >> sidebar has no raw i18n keys visible
- Location: tests/smoke.spec.ts:20:2

# Error details

```
Error: goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/auth
Call log:
  - navigating to "http://localhost:5173/auth", waiting until "load"

```

# Test source

```ts
  1  | import { expect, type Page, test } from '@playwright/test';
  2  | 
  3  | // ---------------------------------------------------------------------------
  4  | // Helper: sign in via the UI
  5  | // ---------------------------------------------------------------------------
  6  | async function signInViaUI(page: Page, email: string, password: string) {
> 7  |   await page.goto('/auth');
     |             ^ Error: goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/auth
  8  |   await page.getByRole('link', { name: /entrar/i }).click();
  9  |   await page.getByPlaceholder(/e-mail/i).fill(email);
  10 |   await page.getByPlaceholder(/senha/i).fill(password);
  11 |   await page.getByRole('button', { name: /entrar/i }).click();
  12 |   // Wait for redirect to panel
  13 |   await page.waitForURL(/\/panel/, { timeout: 10_000 });
  14 | }
  15 | 
  16 | // ---------------------------------------------------------------------------
  17 | // Smoke test: sidebar renders with real translated text, not raw i18n keys
  18 | // ---------------------------------------------------------------------------
  19 | test.describe('Panel Sidebar Smoke', () => {
  20 |   test('sidebar has no raw i18n keys visible', async ({ page }) => {
  21 |     // Authenticate — use TEST_USER credentials if seeded, otherwise skip
  22 |     // The sign-in page is always accessible so we can attempt auth
  23 |     await signInViaUI(page, 'provider@test.com', 'Test@1234');
  24 | 
  25 |     // Wait for sidebar to be present
  26 |     await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
  27 | 
  28 |     // Collect all visible text inside the sidebar
  29 |     const sidebarText = await page.locator('[data-sidebar]').innerText();
  30 | 
  31 |     // sanity check — sidebar is not empty
  32 |     expect(sidebarText.trim().length).toBeGreaterThan(0);
  33 | 
  34 |     // Rule: no element's visible text should look like an i18n key
  35 |     // i18n keys always contain a dot (e.g. "sidebar.group.provedor",
  36 |     // "moderation.title", "group.moderacao")
  37 |     const rawKeyPattern =
  38 |       /\b(sidebar|moderation|group|item|nav|user_menu)\.[\w]+/;
  39 |     expect(sidebarText).not.toMatch(rawKeyPattern);
  40 | 
  41 |     // Rule: at least one sidebar group label must be visible
  42 |     // Expected translated labels: "Painel", "Provedor", etc.
  43 |     // We just verify the word contains letters and is not a dot-key
  44 |     const words = sidebarText.split(/\s+/).filter((w) => w.length > 2);
  45 |     expect(words.length).toBeGreaterThan(0);
  46 |   });
  47 | 
  48 |   test('top bar has theme toggle and language switcher', async ({ page }) => {
  49 |     await signInViaUI(page, 'provider@test.com', 'Test@1234');
  50 |     await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
  51 | 
  52 |     // Theme toggle should be present (ThemeCycleToggle renders a button)
  53 |     const themeToggle = page
  54 |       .locator('button[aria-label], button:has(svg)')
  55 |       .first();
  56 |     await expect(themeToggle).toBeVisible();
  57 | 
  58 |     // Language switcher should be present (shows a flag)
  59 |     const langSwitcher = page
  60 |       .getByRole('button')
  61 |       .filter({ hasText: /🇧🇷|🇺🇸/ })
  62 |       .first();
  63 |     await expect(langSwitcher).toBeVisible();
  64 |   });
  65 | });
  66 | 
```