import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: sign in via the UI
// ---------------------------------------------------------------------------
async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByPlaceholder(/e-mail/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Configurações page — provider profile management
// ---------------------------------------------------------------------------
test.describe('Configurações page', () => {
  /**
   * Seeded in seed.ts:
   *   provider@test.com / Test@1234
   *   APPROVED PROVIDER assignment (id: provider-assignment-1)
   *   provider_profile row with displayName = 'Provider Test'
   */
  const PROVIDER_EMAIL = 'provider@test.com';
  const PROVIDER_PASSWORD = 'Test@1234';

  test.beforeEach(async ({ page }) => {
    await signInViaUI(page, PROVIDER_EMAIL, PROVIDER_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
    await page.goto('/panel/dashboard/configuration');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
  });

  test('edit displayName → save → reload → assert new value persists', async ({
    page,
  }) => {
    // Find the displayName input field
    const displayNameInput = page.locator('#displayName');
    await expect(displayNameInput).toBeVisible();

    // Clear and type a new value
    const newDisplayName = `Provider Editado ${Date.now()}`;
    await displayNameInput.clear();
    await displayNameInput.fill(newDisplayName);

    // Click the save button for Section 1 (Public Profile)
    const saveButton = page.locator('button[type="submit"]').first();
    await saveButton.click();

    // Wait for success toast
    await page.waitForSelector('text=/salvo|salvo com sucesso|success/i', {
      timeout: 5_000,
    });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Assert the new displayName is shown
    await expect(page.locator('#displayName')).toHaveValue(newDisplayName);
  });

  test('edit instagram social link → save → reload → assert persistence', async ({
    page,
  }) => {
    // Find the instagram input
    const instagramInput = page.locator('#instagram');
    await expect(instagramInput).toBeVisible();

    // Scroll to Section 2 to make sure it's in view
    await instagramInput.scrollIntoViewIfNeeded();

    // Fill a new value
    const newInstagram = `@provideredited${Date.now()}`;
    await instagramInput.clear();
    await instagramInput.fill(newInstagram);

    // Click the save button for Section 2 (Contact Channels)
    // It is the second submit button on the page
    const saveButtons = page.locator('button[type="submit"]');
    await saveButtons.nth(1).click();

    // Wait for success toast
    await page.waitForSelector('text=/salvo|salvo com sucesso|success/i', {
      timeout: 5_000,
    });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Assert the new instagram handle is shown
    await expect(page.locator('#instagram')).toHaveValue(newInstagram);
  });

  test('toggle isProviderVisible → assert mutation fires after 300ms debounce', async ({
    page,
  }) => {
    // Find the visibility toggle button
    const visibilityToggle = page.locator('#isProviderVisible');
    await expect(visibilityToggle).toBeVisible();

    // Scroll to make sure it's visible
    await visibilityToggle.scrollIntoViewIfNeeded();

    // Get current state by checking the button text
    const isCurrentlyVisible = await page
      .getByText(/visível|visible/i)
      .first()
      .isVisible();

    // Set up a network request listener BEFORE clicking
    const updateRequest = page.waitForRequest((req) => {
      return (
        req.url().includes('/trpc/providerProfile') &&
        req.method() === 'POST' &&
        req.postDataJSON()?.body?.isProviderVisible !== undefined
      );
    });

    // Click the toggle — debounce is 300ms so the request fires shortly after
    await visibilityToggle.click();

    // Wait for the mutation request to fire (debounce = 300ms)
    const request = await updateRequest;
    expect(request).not.toBeNull();

    // The request body should have the toggled value
    const body = request.postDataJSON();
    // After toggle, if it was visible it becomes hidden (and vice versa)
    // So the value sent should be the opposite of isCurrentlyVisible
    expect(body?.body?.isProviderVisible).toBe(!isCurrentlyVisible);
  });
});
