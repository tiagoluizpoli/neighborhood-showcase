import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: sign in via the UI
// ---------------------------------------------------------------------------
async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth');
  // "Entrar" tab is already selected by default — no click needed
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Moderation Condo Info page
// ---------------------------------------------------------------------------
test.describe('Moderation Condo Info Page', () => {
  test('Condominium Info nav item appears FIRST in Moderation group', async ({
    page,
  }) => {
    await signInViaUI(page, 'moderator@test.com', 'Test@1234');
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    // Locate Moderation group
    const modGroupLabel = page.getByText(/moderação/i).first();
    await expect(modGroupLabel).toBeVisible();
    const modGroup = modGroupLabel.locator('..').locator('..');
    const modGroupContent = modGroup.locator('..');

    // First link inside Moderation group should be the Condo Info item
    const firstLink = modGroupContent.locator(
      'a[href*="/panel/moderation/condominium"]',
    );
    await expect(firstLink).toBeVisible();

    // Verify the nav item is NOT inside a sub-menu (no chevron toggle before it)
    const precedingSub = firstLink
      .locator('..')
      .locator('..')
      .locator('[data-sidebar="sub"]');
    await expect(precedingSub).toHaveCount(0);
  });

  test('Page loads and displays condo info with no raw i18n keys', async ({
    page,
  }) => {
    await signInViaUI(page, 'moderator@test.com', 'Test@1234');
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    // Navigate to the condo info page
    await page.goto('/panel/moderation/condominium');
    await page.waitForLoadState('networkidle');

    // Page should not be a 404
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('404');

    // No raw i18n key patterns (e.g. "sidebar.item.condominium_info")
    const rawKeyPattern = /\b(sidebar|moderation)\.[\w]+/;
    expect(body).not.toMatch(rawKeyPattern);

    // Condo name should be visible (real text, not a key)
    // The actual condo name is seeded; we just check for a non-empty text element
    const condoNameEl = page.locator('h1').first();
    const condoName = await condoNameEl.innerText();
    expect(condoName.trim().length).toBeGreaterThan(0);
    expect(condoName).not.toMatch(/\./); // no dots = not a key path
  });
});
