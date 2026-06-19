import { expect, type Page, test } from '@playwright/test';

const PASSWORD = 'Test@1234';
const PROVIDER_EMAIL = 'provider@test.com';
const MODERATOR_EMAIL = 'moderator@test.com';
const ADMIN_EMAIL = 'admin@test.com';

async function signInViaUI(page: Page, email: string) {
  await page.goto('/auth');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Provider sign-in landing
// ---------------------------------------------------------------------------
test.describe('Provider sign-in landing', () => {
  test('provider sign-in lands at /panel/provider', async ({ page }) => {
    await signInViaUI(page, PROVIDER_EMAIL);

    await page.waitForURL(/\/panel\/provider/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/panel\/provider/);
  });

  test('provider section shows KPI dashboard identity', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await signInViaUI(page, PROVIDER_EMAIL);
    await page.waitForURL(/\/panel\/provider/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    await expect(
      page.getByText(/visualizações|impressions/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/interações|interactions/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await expect(page).toHaveScreenshot(
      'provider-section-identity-1280x1024.png',
      {
        fullPage: false,
        maxDiffPixels: 10000,
        mask: [
          page.locator('[data-slot="sidebar-footer"]'),
          page.getByText(/bem-vindo de volta/i),
          page.getByRole('application'),
        ],
      },
    );
  });
});

// ---------------------------------------------------------------------------
// /panel/dashboard shim — redirect semantics
// ---------------------------------------------------------------------------
test.describe('/panel/dashboard shim redirect semantics', () => {
  test('provider visiting /panel/dashboard is redirected to /panel/provider', async ({
    page,
  }) => {
    await signInViaUI(page, PROVIDER_EMAIL);
    await page.goto('/panel/dashboard');

    await page.waitForURL(/\/panel\/provider/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/panel\/provider/);
  });

  test('admin visiting /panel/dashboard is redirected to /panel/admin', async ({
    page,
  }) => {
    await signInViaUI(page, ADMIN_EMAIL);
    await page.goto('/panel/dashboard');

    await page.waitForURL(/\/panel\/admin/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/panel\/admin/);
  });

  test('non-provider visiting /panel/dashboard is redirected to condo-setup', async ({
    page,
  }) => {
    await signInViaUI(page, MODERATOR_EMAIL);
    await page.goto('/panel/dashboard');

    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    expect(page.url()).toMatch(/\/panel\/dashboard\/condo-setup/);
  });

  test('/panel/dashboard does not render a real dashboard surface for provider', async ({
    page,
  }) => {
    await signInViaUI(page, PROVIDER_EMAIL);
    // The final URL must not be /panel/dashboard itself
    await page.waitForURL(/\/panel\/provider/, { timeout: 15_000 });
    expect(page.url()).not.toMatch(/^.*\/panel\/dashboard$/);
  });
});

// ---------------------------------------------------------------------------
// /panel/provider/* direct-URL blocking for non-providers
// ---------------------------------------------------------------------------
test.describe('/panel/provider/* direct-URL blocking', () => {
  test('non-provider visiting /panel/provider is redirected away', async ({
    page,
  }) => {
    await signInViaUI(page, MODERATOR_EMAIL);
    await page.goto('/panel/provider');

    // Provider group guard → /panel/dashboard → shim → /panel/dashboard/condo-setup
    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/provider/);
  });

  test('non-provider visiting /panel/provider/announcements is redirected away', async ({
    page,
  }) => {
    await signInViaUI(page, MODERATOR_EMAIL);
    await page.goto('/panel/provider/announcements');

    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/provider/);
  });

  test('non-provider visiting /panel/provider/configuration is redirected away', async ({
    page,
  }) => {
    await signInViaUI(page, MODERATOR_EMAIL);
    await page.goto('/panel/provider/configuration');

    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/provider/);
  });

  test('unauthenticated visiting /panel/provider is redirected to /', async ({
    page,
  }) => {
    await page.goto('/panel/provider');

    await page.waitForURL('/', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/$/);
  });
});
