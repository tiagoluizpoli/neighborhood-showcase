# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Panel Sidebar Smoke >> top bar has theme toggle and language switcher
- Location: tests/smoke.spec.ts:47:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder(/e-mail/i)

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "Neighborhood Showcase" [ref=e6] [cursor=pointer]:
          - /url: /
        - generic [ref=e7]:
          - combobox [ref=e8] [cursor=pointer]:
            - option "PT" [selected]
            - option "EN"
          - button "Toggle theme" [ref=e9]:
            - img
            - generic [ref=e10]: Toggle theme
    - generic [ref=e12]:
      - tablist [ref=e14]:
        - tab "Entrar" [selected] [ref=e15]
        - tab "Criar Conta" [ref=e16]
      - generic [ref=e18]:
        - generic [ref=e19]:
          - heading "Entrar" [level=2] [ref=e20]
          - paragraph [ref=e21]: Entre com seu e-mail e senha cadastrados
        - generic [ref=e22]:
          - generic [ref=e24]:
            - generic [ref=e25]: E-mail
            - textbox "E-mail" [ref=e26]:
              - /placeholder: exemplo@email.com
          - generic [ref=e28]:
            - generic [ref=e29]: Senha
            - textbox "Senha" [ref=e30]:
              - /placeholder: Sua senha secreta
          - button "Entrar" [ref=e31] [cursor=pointer]
        - button "Não tem uma conta? Cadastre-se" [ref=e33] [cursor=pointer]
  - region "Notifications alt+T"
  - generic:
    - contentinfo:
      - button "Open TanStack Router Devtools" [ref=e34] [cursor=pointer]:
        - generic [ref=e35]:
          - img [ref=e37]
          - img [ref=e72]
        - generic [ref=e106]: "-"
        - generic [ref=e107]: TanStack Router
  - generic [ref=e108]:
    - img [ref=e110]
    - button "Open Tanstack query devtools" [ref=e158] [cursor=pointer]:
      - img [ref=e159]
```

# Test source

```ts
  1  | import { expect, type Page, test } from '@playwright/test';
  2  | 
  3  | // ---------------------------------------------------------------------------
  4  | // Helper: sign in via the UI
  5  | // ---------------------------------------------------------------------------
  6  | async function signInViaUI(page: Page, email: string, password: string) {
  7  |   await page.goto('/auth');
  8  |   // "Entrar" tab is already selected by default — no click needed
> 9  |   await page.getByPlaceholder(/e-mail/i).fill(email);
     |                                          ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  10 |   await page.getByPlaceholder(/senha/i).fill(password);
  11 |   await page.getByRole('button', { name: /entrar/i }).click();
  12 |   await page.waitForURL(/\/panel/, { timeout: 15_000 });
  13 | }
  14 | 
  15 | // ---------------------------------------------------------------------------
  16 | // Smoke test: sidebar renders with real translated text, not raw i18n keys
  17 | // ---------------------------------------------------------------------------
  18 | test.describe('Panel Sidebar Smoke', () => {
  19 |   test('sidebar has no raw i18n keys visible', async ({ page }) => {
  20 |     // Authenticate — use TEST_USER credentials if seeded, otherwise skip
  21 |     // The sign-in page is always accessible so we can attempt auth
  22 |     await signInViaUI(page, 'provider@test.com', 'Test@1234');
  23 | 
  24 |     // Wait for sidebar to be present
  25 |     await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
  26 | 
  27 |     // Collect all visible text inside the sidebar
  28 |     const sidebarText = await page.locator('[data-sidebar]').innerText();
  29 | 
  30 |     // sanity check — sidebar is not empty
  31 |     expect(sidebarText.trim().length).toBeGreaterThan(0);
  32 | 
  33 |     // Rule: no element's visible text should look like an i18n key
  34 |     // i18n keys always contain a dot (e.g. "sidebar.group.provedor",
  35 |     // "moderation.title", "group.moderacao")
  36 |     const rawKeyPattern =
  37 |       /\b(sidebar|moderation|group|item|nav|user_menu)\.[\w]+/;
  38 |     expect(sidebarText).not.toMatch(rawKeyPattern);
  39 | 
  40 |     // Rule: at least one sidebar group label must be visible
  41 |     // Expected translated labels: "Painel", "Provedor", etc.
  42 |     // We just verify the word contains letters and is not a dot-key
  43 |     const words = sidebarText.split(/\s+/).filter((w) => w.length > 2);
  44 |     expect(words.length).toBeGreaterThan(0);
  45 |   });
  46 | 
  47 |   test('top bar has theme toggle and language switcher', async ({ page }) => {
  48 |     await signInViaUI(page, 'provider@test.com', 'Test@1234');
  49 |     await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
  50 | 
  51 |     // Theme toggle should be present (ThemeCycleToggle renders a button)
  52 |     const themeToggle = page
  53 |       .locator('button[aria-label], button:has(svg)')
  54 |       .first();
  55 |     await expect(themeToggle).toBeVisible();
  56 | 
  57 |     // Language switcher should be present (shows a flag)
  58 |     const langSwitcher = page
  59 |       .getByRole('button')
  60 |       .filter({ hasText: /🇧🇷|🇺🇸/ })
  61 |       .first();
  62 |     await expect(langSwitcher).toBeVisible();
  63 |   });
  64 | });
  65 | 
```