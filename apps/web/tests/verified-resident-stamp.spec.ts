import { expect, type Page, test } from '@playwright/test';

const PASSWORD = 'Test@1234';

async function signInViaUI(page: Page, email: string) {
  await page.goto('/auth');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
  await page.waitForSelector('[data-sidebar]', { timeout: 15_000 });
}

test.describe('E-21 Verified Resident Stamp E2E Matrix', () => {
  test('header-switcher: multi-provider owner can switch active provider and URL updates', async ({
    page,
  }) => {
    await signInViaUI(page, 'multi.provider.owner@test.com');

    // Land on the first provider
    await page.waitForURL(/\/panel\/provider\/seed-multi-provider-condo-1/, {
      timeout: 15_000,
    });
    expect(page.url()).toContain('/panel/provider/seed-multi-provider-condo-1');

    // Check switcher trigger label reflects active provider
    const switcherTrigger = page.getByTestId('provider-switcher-trigger');
    await expect(switcherTrigger).toBeVisible({ timeout: 10_000 });
    await expect(switcherTrigger).toContainText(
      'Multi Provider Owner — Condo 1',
    );

    // Open switcher popover
    await switcherTrigger.click();

    // Select second provider
    const secondProviderItem = page.getByTestId(
      'provider-switcher-item-seed-multi-provider-condo-2',
    );
    await expect(secondProviderItem).toBeVisible({ timeout: 10_000 });
    await secondProviderItem.click();

    // Verify URL updates and switcher updates
    await page.waitForURL(/\/panel\/provider\/seed-multi-provider-condo-2/, {
      timeout: 15_000,
    });
    expect(page.url()).toContain('/panel/provider/seed-multi-provider-condo-2');
    await expect(switcherTrigger).toContainText(
      'Multi Provider Owner — Condo 2',
    );
  });

  test('deep-link & refresh: active provider context is retained', async ({
    page,
  }) => {
    await signInViaUI(page, 'multi.provider.owner@test.com');

    // Go directly to second provider configuration page
    await page.goto(
      '/panel/provider/seed-multi-provider-condo-2/configuration',
    );
    await page.waitForURL(
      /\/panel\/provider\/seed-multi-provider-condo-2\/configuration/,
      { timeout: 15_000 },
    );

    // Assert that the page displays the second provider's profile data
    const nameInput = page.locator('#displayName');
    await expect(nameInput).toBeVisible({ timeout: 15_000 });
    await expect(nameInput).toHaveValue('Multi Provider Owner — Condo 2');

    // Reload page
    await page.reload();
    await page.waitForURL(
      /\/panel\/provider\/seed-multi-provider-condo-2\/configuration/,
      { timeout: 15_000 },
    );

    // Assert that the context and value are still correct after reload
    await expect(nameInput).toBeVisible({ timeout: 15_000 });
    await expect(nameInput).toHaveValue('Multi Provider Owner — Condo 2');
  });

  test('empty-state: non-provider sees empty state and CTA routes to condo-setup', async ({
    page,
  }) => {
    await signInViaUI(page, 'nonprovider@test.com');

    // Go to My Providers page
    await page.goto('/panel/provider/my-providers');
    await page.waitForURL(/\/panel\/provider\/my-providers/, {
      timeout: 15_000,
    });

    // Verify empty state is visible
    const emptyState = page.getByTestId('my-providers-empty');
    await expect(emptyState).toBeVisible({ timeout: 10_000 });

    // Click the empty state CTA to setup first provider
    const emptyCta = page.getByTestId('my-providers-empty-cta');
    await expect(emptyCta).toBeVisible();
    await emptyCta.click();

    // Verify it routes to condo-setup page
    await page.waitForURL(/\/panel\/provider\/condo-setup/, {
      timeout: 15_000,
    });
    expect(page.url()).toContain('/panel/provider/condo-setup');
  });

  test('stamp gating: resident hero stamp is shown only for eligible providers', async ({
    page,
  }) => {
    // Case A: APPROVED RESIDENT provider (branding@test.com / seed-branding-id)
    await page.goto('/providers/seed-branding-id');
    await page.waitForLoadState('networkidle');

    const verifiedStamp = page.getByTestId('verified-resident-stamp');
    await expect(verifiedStamp).toBeVisible({ timeout: 15_000 });
    // Text should be the condo name
    await expect(verifiedStamp).toContainText('Condomínio Teste Moderador');
    // Title/Aria-label should contain localized "Morador verificado em ..."
    await expect(verifiedStamp).toHaveAttribute(
      'aria-label',
      /Morador verificado em Condomínio Teste Moderador/,
    );

    // Case B: MODERATOR provider (moderator@test.com / seed-moderator-id)
    await page.goto('/providers/seed-moderator-id');
    await page.waitForLoadState('networkidle');

    // Verified stamp must not be visible/present
    const stampCount = await page
      .getByTestId('verified-resident-stamp')
      .count();
    expect(stampCount).toBe(0);
  });

  test('stamp gating: announcement card verified stamp shown only under hybrid gate', async ({
    page,
  }) => {
    // Case A: showVerifiedBadge = true on APPROVED RESIDENT provider card
    await page.goto('/providers/seed-provider-id');
    await page.waitForLoadState('networkidle');

    // The active announcement card "Bolos Caseiros Premium" should show the card stamp
    const activeAdCardStamp = page
      .locator('[role="button"]')
      .filter({ hasText: 'Bolos Caseiros Premium' })
      .locator('[aria-label*="Morador verificado em"]');
    await expect(activeAdCardStamp).toBeVisible({ timeout: 15_000 });

    // Case B: showVerifiedBadge = false on APPROVED RESIDENT provider card
    await page.goto('/providers/seed-provider-other-id');
    await page.waitForLoadState('networkidle');

    // The active announcement card "Jardinagem Express" should NOT show the card stamp
    const draftAdCardStamp = page
      .locator('[role="button"]')
      .filter({ hasText: 'Jardinagem Express' })
      .locator('[aria-label*="Morador verificado em"]');
    await expect(draftAdCardStamp).toHaveCount(0);
  });

  test('seed smoke: the three seed states are correctly set up and observable', async ({
    page,
  }) => {
    // State 1: multi.provider.owner@test.com owns 2 providers
    await signInViaUI(page, 'multi.provider.owner@test.com');
    await page.goto('/panel/provider/my-providers');
    await page.waitForURL(/\/panel\/provider\/my-providers/, {
      timeout: 15_000,
    });
    const multiCards = page.locator('[data-testid^="my-providers-card-"]');
    await expect(multiCards).toHaveCount(2, { timeout: 10_000 });

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // State 2: branding@test.com owns 1 provider
    await signInViaUI(page, 'branding@test.com');
    await page.goto('/panel/provider/my-providers');
    await page.waitForURL(/\/panel\/provider\/my-providers/, {
      timeout: 15_000,
    });
    const brandingCards = page.locator('[data-testid^="my-providers-card-"]');
    await expect(brandingCards).toHaveCount(1);

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // State 3: provider.transition@test.com owns 1 provider with no approved assignment
    await signInViaUI(page, 'provider.transition@test.com');
    await page.goto('/panel/provider/my-providers');
    await page.waitForURL(/\/panel\/provider\/my-providers/, {
      timeout: 15_000,
    });
    const transitionCards = page.locator('[data-testid^="my-providers-card-"]');
    await expect(transitionCards).toHaveCount(1);

    // Verify stamp is absent on their public provider page
    await page.goto('/providers/seed-provider-transition-id');
    await page.waitForLoadState('networkidle');
    const stamp = page.locator('[aria-label*="Morador verificado em"]');
    await expect(stamp).toHaveCount(0);
  });
});
