import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: sign in via the UI
// ---------------------------------------------------------------------------
async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// CondoSelector component — moderation context switcher
// ---------------------------------------------------------------------------
test.describe('CondoSelector', () => {
  /**
   * Seeded as part of Epic 12 Task 03:
   *   moderator@test.com / Test@1234
   *   APPROVED MODERATOR assignments for:
   *     - "Condomínio Teste Moderador" (id: moderator-condo-1)
   *     - "Segundo Condomínio"        (id: moderator-condo-2)
   */
  const MODERATOR_EMAIL = 'moderator@test.com';
  const MODERATOR_PASSWORD = 'Test@1234';

  test.beforeEach(async ({ page }) => {
    await signInViaUI(page, MODERATOR_EMAIL, MODERATOR_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
  });

  test('appears as the first item inside the Moderation group', async ({
    page,
  }) => {
    // Locate the Moderation group label
    const modGroupLabel = page.getByText(/moderação/i).first();
    await expect(modGroupLabel).toBeVisible();

    // Walk up to the group container, then find the content section
    const modGroup = modGroupLabel.locator('..').locator('..');
    const modGroupContent = modGroup.locator('..');

    // The CondoSelector should be the first element inside the group content,
    // before the nav menu items
    const condoSelector = modGroupContent
      .locator('[data-condo-selector]')
      .first();
    await expect(condoSelector).toBeVisible();
  });

  test('multiple condos: shows dropdown with both condo names', async ({
    page,
  }) => {
    // Locate the CondoSelector trigger (the visible button/input)
    const selectorTrigger = page
      .locator('[data-condo-selector-trigger]')
      .first();
    await expect(selectorTrigger).toBeVisible();

    // Click to open dropdown
    await selectorTrigger.click();
    await page.waitForSelector('[data-condo-selector-dropdown]', {
      timeout: 5_000,
    });

    // Both condos should appear in the dropdown
    const dropdown = page.locator('[data-condo-selector-dropdown]');
    await expect(
      dropdown.getByText(/condomínio teste moderador/i),
    ).toBeVisible();
    await expect(dropdown.getByText(/segundo condomínio/i)).toBeVisible();
  });

  test('selected condo persists across page reloads (localStorage)', async ({
    page,
  }) => {
    const selectorTrigger = page
      .locator('[data-condo-selector-trigger]')
      .first();
    await selectorTrigger.click();
    await page.waitForSelector('[data-condo-selector-dropdown]', {
      timeout: 5_000,
    });

    // Select the second condo
    await page
      .locator('[data-condo-selector-dropdown]')
      .getByText(/segundo condomínio/i)
      .click();

    // Reload the page
    await page.reload();
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    // The selected condo should still be shown (persisted in localStorage)
    const selectedText = page.locator('[data-condo-selector-trigger]').first();
    await expect(selectedText).toContainText(/segundo condomínio/i);
  });

  test('condo selection updates localStorage context', async ({ page }) => {
    const selectorTrigger = page
      .locator('[data-condo-selector-trigger]')
      .first();
    await selectorTrigger.click();
    await page.waitForSelector('[data-condo-selector-dropdown]', {
      timeout: 5_000,
    });

    // Select "Condomínio Teste Moderador"
    await page
      .locator('[data-condo-selector-dropdown]')
      .getByText(/condomínio teste moderador/i)
      .click();

    // Verify localStorage reflects the selection (key: mod_ctx__cndo)
    const stored = await page.evaluate(() => {
      return localStorage.getItem('mod_ctx__cndo');
    });
    expect(stored).toBe('moderator-condo-1');
  });
});
