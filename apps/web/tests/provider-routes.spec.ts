import { expect, type Page, test } from '@playwright/test';

const PASSWORD = 'Test@1234';
const PROVIDER_EMAIL = 'provider@test.com';
const MODERATOR_EMAIL = 'moderator@test.com';
const ADMIN_EMAIL = 'admin@test.com';
const SYSTEM_MANAGER_EMAIL = 'system.manager@test.com';
const NON_PROVIDER_EMAIL = 'nonprovider@test.com';

async function signInViaUI(page: Page, email: string) {
  page.on('console', (msg) =>
    console.log(`[BROWSER]: ${msg.type()}: ${msg.text()}`),
  );
  page.on('request', (req) =>
    console.log(`[REQ]: ${req.method()} ${req.url()}`),
  );
  page.on('response', async (res) => {
    if (res.url().includes('/trpc/')) {
      try {
        const text = await res.text();
        console.log(`[TRPC RESP]: ${res.url()} -> ${text}`);
      } catch (_e) {
        console.log(`[TRPC RESP ERROR READ]: ${res.url()}`);
      }
    } else {
      if (res.status() >= 400) {
        console.log(`[RESP ERROR]: ${res.status()} ${res.url()}`);
      } else {
        console.log(`[RESP]: ${res.status()} ${res.url()}`);
      }
    }
  });
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

  test('moderator sign-in lands at /panel/moderation', async ({ page }) => {
    await signInViaUI(page, MODERATOR_EMAIL);

    await page.waitForURL(/\/panel\/moderation/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/panel\/moderation/);
  });

  test('admin sign-in lands at /panel/admin', async ({ page }) => {
    await signInViaUI(page, ADMIN_EMAIL);

    await page.waitForURL(/\/panel\/admin/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/panel\/admin/);
  });

  test('system manager sign-in lands at /panel/admin', async ({ page }) => {
    await signInViaUI(page, SYSTEM_MANAGER_EMAIL);

    await page.waitForURL(/\/panel\/admin/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/panel\/admin/);
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

  test('moderator section shows moderation dashboard identity', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await signInViaUI(page, MODERATOR_EMAIL);
    await page.waitForURL(/\/panel\/moderation/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    await expect(page.getByText(/moderação|moderation/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await expect(page).toHaveScreenshot(
      'moderator-section-identity-1280x1024.png',
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

  test('admin section shows admin dashboard identity', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await signInViaUI(page, ADMIN_EMAIL);
    await page.waitForURL(/\/panel\/admin/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    await expect(page.getByText(/showcase admin/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await expect(page).toHaveScreenshot(
      'admin-section-identity-1280x1024.png',
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

  test('system manager section shows admin dashboard identity', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await signInViaUI(page, SYSTEM_MANAGER_EMAIL);
    await page.waitForURL(/\/panel\/admin/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    await expect(page.getByText(/showcase admin/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await expect(page).toHaveScreenshot(
      'system-manager-section-identity-1280x1024.png',
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

  test('system manager visiting /panel/dashboard is redirected to /panel/admin', async ({
    page,
  }) => {
    await signInViaUI(page, SYSTEM_MANAGER_EMAIL);
    await page.goto('/panel/dashboard');

    await page.waitForURL(/\/panel\/admin/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/panel\/admin/);
  });

  test('moderator visiting /panel/dashboard is redirected to /panel/moderation', async ({
    page,
  }) => {
    await signInViaUI(page, MODERATOR_EMAIL);
    await page.goto('/panel/dashboard');

    await page.waitForURL(/\/panel\/moderation/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/panel\/moderation/);
  });

  test('non-provider visiting /panel/dashboard is redirected to condo-setup', async ({
    page,
  }) => {
    await signInViaUI(page, NON_PROVIDER_EMAIL);
    await page.goto('/panel/dashboard');

    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    expect(page.url()).toMatch(/\/panel\/dashboard\/condo-setup/);
  });

  test('provider visiting legacy dashboard configuration is redirected to canonical provider configuration', async ({
    page,
  }) => {
    await signInViaUI(page, PROVIDER_EMAIL);
    await page.goto('/panel/dashboard/configuration');

    await page.waitForURL(/\/panel\/provider\/configuration/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/dashboard\/configuration/);
  });

  test('non-provider visiting legacy dashboard configuration is redirected to activation guidance', async ({
    page,
  }) => {
    await signInViaUI(page, NON_PROVIDER_EMAIL);
    await page.goto('/panel/dashboard/configuration');

    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    await expect(
      page.getByRole('heading', {
        name: /ativar acesso de prestador|activate provider access/i,
      }),
    ).toBeVisible();
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
  test('non-provider visiting /panel/provider is redirected to condo-setup with activation guidance', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await signInViaUI(page, NON_PROVIDER_EMAIL);
    await page.goto('/panel/provider');

    // Provider group guard → /panel/dashboard → shim → /panel/dashboard/condo-setup
    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/provider/);
    await expect(
      page.getByRole('heading', {
        name: /ativar acesso de prestador|activate provider access/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        /páginas de provedor continuam bloqueadas|provider pages stay blocked/i,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /disponível em breve|available soon/i }),
    ).toBeDisabled();

    await expect(page).toHaveScreenshot(
      'non-provider-provider-activation-surface-1280x1024.png',
      {
        fullPage: false,
        maxDiffPixels: 10000,
        mask: [page.locator('[data-slot="sidebar-footer"]')],
      },
    );
  });

  test('moderator visiting /panel/provider is redirected to moderation', async ({
    page,
  }) => {
    await signInViaUI(page, MODERATOR_EMAIL);
    await page.goto('/panel/provider');

    // Provider group guard → /panel/dashboard → shim → /panel/moderation
    await page.waitForURL(/\/panel\/moderation/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/provider/);
  });

  test('admin visiting /panel/provider is redirected to admin', async ({
    page,
  }) => {
    await signInViaUI(page, ADMIN_EMAIL);
    await page.goto('/panel/provider');

    // Provider group guard rejects non-providers → shim resolves to admin
    await page.waitForURL(/\/panel\/admin/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/provider/);
  });

  test('system manager visiting /panel/provider is redirected to admin', async ({
    page,
  }) => {
    await signInViaUI(page, SYSTEM_MANAGER_EMAIL);
    await page.goto('/panel/provider');

    // Provider group guard rejects non-providers → shim resolves to admin
    await page.waitForURL(/\/panel\/admin/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/provider/);
  });

  test('non-provider visiting /panel/provider/announcements is redirected to condo-setup', async ({
    page,
  }) => {
    await signInViaUI(page, NON_PROVIDER_EMAIL);
    await page.goto('/panel/provider/announcements');

    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    expect(page.url()).not.toMatch(/\/panel\/provider/);
  });

  test('non-provider visiting /panel/provider/configuration is redirected to condo-setup', async ({
    page,
  }) => {
    await signInViaUI(page, NON_PROVIDER_EMAIL);
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
