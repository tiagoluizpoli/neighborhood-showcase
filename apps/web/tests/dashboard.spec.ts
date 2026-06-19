import { expect, type Page, test } from '@playwright/test';

const PROVIDER_EMAIL = 'provider@test.com';
const PROVIDER_PASSWORD = 'Test@1234';
const MODERATOR_EMAIL = 'moderator@test.com';
const MODERATOR_PASSWORD = 'Test@1234';
const NON_PROVIDER_EMAIL = 'nonprovider@test.com';
const NON_PROVIDER_PASSWORD = 'Test@1234';
const AVATAR_EMAIL = 'avatar@test.com';
const AVATAR_PASSWORD = 'Test@1234';
const DASHBOARD_VIEWPORT = { width: 1280, height: 1024 };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

function getSidebar(page: Page) {
  return page.locator('[data-sidebar]');
}

// ---------------------------------------------------------------------------
// Slim dashboard
// ---------------------------------------------------------------------------
test.describe('Provider Dashboard — slim', () => {
  test('shows KPI strip and chart without an embedded announcement list', async ({
    page,
  }) => {
    await page.setViewportSize(DASHBOARD_VIEWPORT);
    await signInViaUI(page, PROVIDER_EMAIL, PROVIDER_PASSWORD);
    await page.waitForURL(/\/panel\/provider/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    await expect(
      page.getByText(/visualizações|impressions/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/interações|interactions/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/taxa de conversão|conversion rate/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/anúncios|announcements/i).first()).toBeVisible(
      { timeout: 20_000 },
    );
    await expect(
      page.getByText(/desempenho geral|overall performance/i),
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      page.locator('a[href*="/panel/dashboard/announcements/seed-"]'),
    ).toHaveCount(0);

    await expect(page).toHaveScreenshot('dashboard-slim-1280x1024.png', {
      fullPage: false,
      maxDiffPixels: 3000,
      mask: [
        page.locator('[data-slot="sidebar-footer"]'),
        page.getByText(/bem-vindo de volta/i),
        page.getByRole('application'),
      ],
    });
  });
});

// ---------------------------------------------------------------------------
// Sidebar capability gate
// ---------------------------------------------------------------------------
test.describe('Sidebar gating', () => {
  test('non-provider does not see the Provedor sidebar group', async ({
    page,
  }) => {
    await signInViaUI(page, MODERATOR_EMAIL, MODERATOR_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    await expect(
      getSidebar(page).getByText(/moderação|moderation/i),
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      getSidebar(page).getByText('Provedor', { exact: true }),
    ).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------------
test.describe('Route guards — non-provider redirect', () => {
  test('visiting /panel/provider/configuration as non-provider is redirected away', async ({
    page,
  }) => {
    await signInViaUI(page, NON_PROVIDER_EMAIL, NON_PROVIDER_PASSWORD);
    await page.goto('/panel/provider/configuration');

    // Provider group guard rejects non-providers → shim resolves to condo-setup
    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
  });

  test('visiting /panel/provider/announcements as non-provider is redirected away', async ({
    page,
  }) => {
    await signInViaUI(page, NON_PROVIDER_EMAIL, NON_PROVIDER_PASSWORD);
    await page.goto('/panel/provider/announcements');

    // Provider group guard rejects non-providers → shim resolves to condo-setup
    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
  });
});

// ---------------------------------------------------------------------------
// Sidebar footer avatar
// ---------------------------------------------------------------------------
test.describe('Sidebar footer avatar', () => {
  test('shows the stored profile image when the user has one', async ({
    page,
  }) => {
    await signInViaUI(page, AVATAR_EMAIL, AVATAR_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    const avatarImage = getSidebar(page)
      .locator('[data-slot="sidebar-footer"] img[alt="Avatar Visual Test"]')
      .first();

    await expect(avatarImage).toBeVisible();
    await expect(avatarImage).toHaveAttribute('src', /logo\.png/);
  });

  test('shows initials fallback when user has no profile image', async ({
    page,
  }) => {
    await signInViaUI(page, PROVIDER_EMAIL, PROVIDER_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    const footer = getSidebar(page).locator('[data-slot="sidebar-footer"]');
    const displayName = await footer.locator('p').first().innerText();

    await expect(footer.locator('img')).toHaveCount(0);
    await expect(
      footer.getByText(getInitials(displayName), { exact: true }),
    ).toBeVisible({
      timeout: 5_000,
    });
  });
});
