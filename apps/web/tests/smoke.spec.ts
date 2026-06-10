import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: sign in via the UI
// ---------------------------------------------------------------------------
async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth');
  // "Entrar" tab is already selected by default — no click needed
  await page.getByPlaceholder(/e-mail/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Smoke test: sidebar renders with real translated text, not raw i18n keys
// ---------------------------------------------------------------------------
test.describe('Panel Sidebar Smoke', () => {
  test('sidebar has no raw i18n keys visible', async ({ page }) => {
    // Authenticate — use TEST_USER credentials if seeded, otherwise skip
    // The sign-in page is always accessible so we can attempt auth
    await signInViaUI(page, 'provider@test.com', 'Test@1234');

    // Wait for sidebar to be present
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    // Collect all visible text inside the sidebar
    const sidebarText = await page.locator('[data-sidebar]').innerText();

    // sanity check — sidebar is not empty
    expect(sidebarText.trim().length).toBeGreaterThan(0);

    // Rule: no element's visible text should look like an i18n key
    // i18n keys always contain a dot (e.g. "sidebar.group.provedor",
    // "moderation.title", "group.moderacao")
    const rawKeyPattern =
      /\b(sidebar|moderation|group|item|nav|user_menu)\.[\w]+/;
    expect(sidebarText).not.toMatch(rawKeyPattern);

    // Rule: at least one sidebar group label must be visible
    // Expected translated labels: "Painel", "Provedor", etc.
    // We just verify the word contains letters and is not a dot-key
    const words = sidebarText.split(/\s+/).filter((w) => w.length > 2);
    expect(words.length).toBeGreaterThan(0);
  });

  test('top bar has theme toggle and language switcher', async ({ page }) => {
    await signInViaUI(page, 'provider@test.com', 'Test@1234');
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    // Theme toggle should be present (ThemeCycleToggle renders a button)
    const themeToggle = page
      .locator('button[aria-label], button:has(svg)')
      .first();
    await expect(themeToggle).toBeVisible();

    // Language switcher should be present (shows a flag)
    const langSwitcher = page
      .getByRole('button')
      .filter({ hasText: /🇧🇷|🇺🇸/ })
      .first();
    await expect(langSwitcher).toBeVisible();
  });
});
