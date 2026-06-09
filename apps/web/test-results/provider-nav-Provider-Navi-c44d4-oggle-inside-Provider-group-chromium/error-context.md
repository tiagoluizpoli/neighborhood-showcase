# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: provider-nav.spec.ts >> Provider Navigation Flatten >> No expand/collapse toggle inside Provider group
- Location: tests/provider-nav.spec.ts:74:2

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
  12 |   await page.waitForURL(/\/panel/, { timeout: 10_000 });
  13 | }
  14 | 
  15 | // ---------------------------------------------------------------------------
  16 | // Provider navigation: all 3 items are flat siblings (no sub-menu)
  17 | // ---------------------------------------------------------------------------
  18 | test.describe('Provider Navigation Flatten', () => {
  19 |   test('Provider group shows exactly 3 flat buttons: Dashboard, Announcements, Configuration', async ({
  20 |     page,
  21 |   }) => {
  22 |     await signInViaUI(page, 'provider@test.com', 'Test@1234');
  23 |     await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
  24 | 
  25 |     // Locate the Provider group via its label
  26 |     const providerGroup = page
  27 |       .locator('[data-sidebar]')
  28 |       .locator('text=Provedor')
  29 |       .locator('..');
  30 | 
  31 |     // Find all SidebarMenuButton elements within the Provider group
  32 |     // Each button has class "md:hidden" or is a direct child of SidebarMenuItem
  33 |     // We count direct <a> links (rendered by the Link component)
  34 |     const buttons = providerGroup.locator('a[href*="/panel/dashboard"]');
  35 |     const count = await buttons.count();
  36 | 
  37 |     expect(count).toBe(3);
  38 | 
  39 |     // Verify labels: Dashboard, Announcements (Meus Anúncios), Configuration (Configurações)
  40 |     const labels = await buttons.allInnerTexts();
  41 |     // labels include the icon text too — just check that the text is non-empty and not a raw key
  42 |     for (const label of labels) {
  43 |       expect(label.trim().length).toBeGreaterThan(0);
  44 |       expect(label).not.toMatch(/\.[\w]+/); // no raw i18n keys
  45 |     }
  46 |   });
  47 | 
  48 |   test('Provider buttons link to correct routes', async ({ page }) => {
  49 |     await signInViaUI(page, 'provider@test.com', 'Test@1234');
  50 |     await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
  51 | 
  52 |     const providerGroup = page
  53 |       .locator('[data-sidebar]')
  54 |       .locator('text=Provedor')
  55 |       .locator('..');
  56 | 
  57 |     // Dashboard link
  58 |     const dashboardLink = providerGroup.locator('a[href="/panel/dashboard"]');
  59 |     await expect(dashboardLink).toBeVisible();
  60 | 
  61 |     // Announcements link
  62 |     const announcementsLink = providerGroup.locator(
  63 |       'a[href="/panel/dashboard/announcements"]',
  64 |     );
  65 |     await expect(announcementsLink).toBeVisible();
  66 | 
  67 |     // Configuration link
  68 |     const configurationLink = providerGroup.locator(
  69 |       'a[href="/panel/dashboard/configuration"]',
  70 |     );
  71 |     await expect(configurationLink).toBeVisible();
  72 |   });
  73 | 
  74 |   test('No expand/collapse toggle inside Provider group', async ({ page }) => {
  75 |     await signInViaUI(page, 'provider@test.com', 'Test@1234');
  76 |     await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
  77 | 
  78 |     const providerGroup = page
  79 |       .locator('[data-sidebar]')
  80 |       .locator('text=Provedor')
  81 |       .locator('..');
  82 | 
  83 |     // No element with chevron-down / chevron-right inside Provider group
  84 |     // (SidebarMenuSub renders a toggle indicator)
  85 |     const chevrons = providerGroup.locator('[data-sidebar="sub"]');
  86 |     await expect(chevrons).toHaveCount(0);
  87 |   });
  88 | });
  89 | 
```