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
    page.on('console', (msg) => console.log('BROWSER:', msg.text()));
    await signInViaUI(page, PROVIDER_EMAIL, PROVIDER_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
    await page.goto('/panel/provider/configuration');
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
    await page.waitForSelector(
      'text=/salvo|salvo com sucesso|success|atualizado|updated/i',
      {
        timeout: 5_000,
      },
    );

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
    await page.waitForSelector(
      'text=/salvo|salvo com sucesso|success|atualizado|updated/i',
      {
        timeout: 5_000,
      },
    );

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
      if (
        !req.url().includes('/trpc/providerProfile') ||
        req.method() !== 'POST'
      ) {
        return false;
      }
      const data = req.postDataJSON();
      if (!data) return false;
      const firstBatch = data['0'] || data;
      const jsonPayload = firstBatch.json || firstBatch;
      return jsonPayload.isProviderVisible !== undefined;
    });

    // Click the toggle — debounce is 300ms so the request fires shortly after
    await visibilityToggle.click();

    // Wait for the mutation request to fire (debounce = 300ms)
    const request = await updateRequest;
    expect(request).not.toBeNull();

    // The request body should have the toggled value
    const data = request.postDataJSON();
    const firstBatch = data['0'] || data;
    const jsonPayload = firstBatch.json || firstBatch;
    // After toggle, if it was visible it becomes hidden (and vice versa)
    // So the value sent should be the opposite of isCurrentlyVisible
    expect(jsonPayload.isProviderVisible).toBe(!isCurrentlyVisible);
  });
});

// ---------------------------------------------------------------------------
// Configurações page — E-19 identity IA and compact visibility (T-19-06)
// ---------------------------------------------------------------------------
test.describe('Configurações page — identity IA and compact visibility (E-19)', () => {
  const PROVIDER_EMAIL = 'provider@test.com';
  const PROVIDER_PASSWORD = 'Test@1234';

  test.beforeEach(async ({ page }) => {
    await signInViaUI(page, PROVIDER_EMAIL, PROVIDER_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
    await page.goto('/panel/provider/configuration');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
  });

  test('identity-preview block is present in the public-profile section', async ({
    page,
  }) => {
    await expect(page.getByTestId('identity-preview')).toBeVisible();
  });

  test('visibility-row is a compact element, not a full Card', async ({
    page,
  }) => {
    await expect(page.getByTestId('visibility-row')).toBeVisible();
    // Old heavyweight Card title should be gone
    await expect(
      page.getByText('Visibilidade Pública', { exact: true }),
    ).toHaveCount(0);
  });

  test('section order: identity-preview precedes visibility-row precedes contact-channels section', async ({
    page,
  }) => {
    const preview = page.getByTestId('identity-preview');
    const visRow = page.getByTestId('visibility-row');
    // CardTitle renders as a div (data-slot="card-title"), not a semantic heading
    const contactTitle = page.getByText('Canais de Contato', { exact: true });

    await expect(preview).toBeVisible();
    await expect(visRow).toBeVisible();
    await expect(contactTitle).toBeVisible();

    const [previewBox, visBox, contactBox] = await Promise.all([
      preview.boundingBox(),
      visRow.boundingBox(),
      contactTitle.boundingBox(),
    ]);

    if (!previewBox || !visBox || !contactBox)
      throw new Error('bounding box missing');
    expect(previewBox.y).toBeLessThan(visBox.y);
    expect(visBox.y).toBeLessThan(contactBox.y);
  });
});

// ---------------------------------------------------------------------------
// Configurações page — contact defaults for the authoring matrix provider
// These tests use authoring@test.com (seed: primaryPhone=+5511966667777,
// callEnabled=true) and run serially so the restore step is deterministic.
// ---------------------------------------------------------------------------
test.describe('Provider contact defaults — authoring matrix provider', () => {
  const AUTHORING_EMAIL = 'authoring@test.com';
  const AUTHORING_PASSWORD = 'Test@1234';
  const SEEDED_PHONE = '+5511966667777';

  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log('BROWSER:', msg.text()));
    await signInViaUI(page, AUTHORING_EMAIL, AUTHORING_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });
    await page.goto('/panel/provider/configuration');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
  });

  test('primaryPhone field shows seeded baseline and callEnabled is checked', async ({
    page,
  }) => {
    const phoneInput = page.locator('#primaryPhone');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveValue(SEEDED_PHONE);

    const callEnabledCheckbox = page.locator('#callEnabled');
    await expect(callEnabledCheckbox).toBeVisible();
    await expect(callEnabledCheckbox).toBeChecked();
  });

  test('edit primaryPhone → save → reload → assert → restore to seeded value', async ({
    page,
  }) => {
    const alternatePhone = '+5511966660099';
    const phoneInput = page.locator('#primaryPhone');

    await phoneInput.clear();
    await phoneInput.fill(alternatePhone);

    // Contact channels section is the second submit button on the page.
    const saveButtons = page.locator('button[type="submit"]');
    await saveButtons.nth(1).click();
    await page.waitForSelector(
      'text=/salvo|salvo com sucesso|success|atualizado|updated/i',
      { timeout: 5_000 },
    );

    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
    await expect(page.locator('#primaryPhone')).toHaveValue(alternatePhone);

    // Restore: write the seeded phone back so the authoring matrix tests are
    // unaffected regardless of execution order.
    await page.locator('#primaryPhone').clear();
    await page.locator('#primaryPhone').fill(SEEDED_PHONE);
    await page.locator('button[type="submit"]').nth(1).click();
    await page.waitForSelector(
      'text=/salvo|salvo com sucesso|success|atualizado|updated/i',
      { timeout: 5_000 },
    );
  });
});
