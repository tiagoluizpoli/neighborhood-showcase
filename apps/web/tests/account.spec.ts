import { expect, type Page, test } from '@playwright/test';

const PROVIDER_EMAIL = 'provider@test.com';
const NON_PROVIDER_EMAIL = 'nonprovider@test.com';
const UNVERIFIED_EMAIL = 'unverified@test.com';
const PASSWORD = 'Test@1234';

async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByLabel(/e-mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

async function openAccountPage(page: Page, email: string) {
  await signInViaUI(page, email, PASSWORD);
  await page.goto('/panel/account');
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByRole('heading', {
      name: /conta e segurança|account & security/i,
    }),
  ).toBeVisible();
}

test.describe('Conta e Segurança', () => {
  test('sidebar collapse toggle persists across reloads on panel routes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await signInViaUI(page, PROVIDER_EMAIL, PASSWORD);

    await page.evaluate(() => {
      window.localStorage.setItem('sidebar:state', 'true');
    });
    await page.goto('/panel/account');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('[data-slot="sidebar"][data-state]').first();
    const sidebarMask = [page.locator('[data-slot="sidebar-footer"]')];

    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await expect(sidebar).toHaveScreenshot('account-sidebar-expanded.png', {
      animations: 'disabled',
      mask: sidebarMask,
    });

    await page.locator('[data-slot="sidebar-trigger"]').click();
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('sidebar:state')),
      )
      .toBe('false');
    await expect(sidebar).toHaveScreenshot('account-sidebar-collapsed.png', {
      animations: 'disabled',
      mask: sidebarMask,
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const reloadedSidebar = page
      .locator('[data-slot="sidebar"][data-state]')
      .first();

    await expect(reloadedSidebar).toHaveAttribute('data-state', 'collapsed');
    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem('sidebar:state')),
      )
      .toBe('false');
  });

  test('edit name → save → reload → assert persistence', async ({ page }) => {
    await openAccountPage(page, PROVIDER_EMAIL);

    const nameInput = page.getByTestId('account-name-input');
    const nextName = `Provider Editado ${Date.now()}`;

    await nameInput.clear();
    await nameInput.fill(nextName);
    await page.getByTestId('account-profile-save').click();
    await expect(
      page.getByText(/atualizados com sucesso|updated successfully/i),
    ).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('account-name-input')).toHaveValue(nextName);
  });

  test('header theme toggle → reload → assert persistence', async ({
    page,
  }) => {
    await openAccountPage(page, PROVIDER_EMAIL);

    await page.evaluate(() => {
      window.localStorage.setItem('vite-ui-theme', 'light');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const themeBefore = await page.evaluate(() =>
      window.localStorage.getItem('vite-ui-theme'),
    );

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.waitForTimeout(500);

    const themeAfterToggle = await page.evaluate(() =>
      window.localStorage.getItem('vite-ui-theme'),
    );
    expect(themeAfterToggle).not.toBe(themeBefore);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const themeAfterReload = await page.evaluate(() =>
      window.localStorage.getItem('vite-ui-theme'),
    );
    expect(themeAfterReload).toBe(themeAfterToggle);
  });

  test('verified email renders green checkmark state', async ({ page }) => {
    await openAccountPage(page, PROVIDER_EMAIL);
    await expect(
      page.getByTestId('account-email-status-verified'),
    ).toBeVisible();
    await expect(page.getByTestId('account-email-status-pending')).toHaveCount(
      0,
    );
  });

  test('unverified email renders amber pending state', async ({ page }) => {
    await openAccountPage(page, UNVERIFIED_EMAIL);
    await expect(
      page.getByTestId('account-email-status-pending'),
    ).toBeVisible();
    await expect(page.getByTestId('account-email-status-verified')).toHaveCount(
      0,
    );
  });

  test('provider account surface links to canonical provider configuration', async ({
    page,
  }) => {
    await openAccountPage(page, PROVIDER_EMAIL);

    const providerAccessCard = page.getByTestId('account-provider-access-card');
    await expect(providerAccessCard).toContainText(
      /provider access is active|acesso de prestador está ativo/i,
    );
    await expect(providerAccessCard).toHaveScreenshot(
      'account-provider-access-enabled.png',
    );

    await page.getByTestId('account-provider-access-manage').click();
    await page.waitForURL(/\/panel\/provider\/configuration/, {
      timeout: 10_000,
    });
    await expect(page.url()).not.toMatch(/\/panel\/dashboard\/configuration/);
  });

  test('non-provider account surface links to activation guidance', async ({
    page,
  }) => {
    await openAccountPage(page, NON_PROVIDER_EMAIL);

    const providerAccessCard = page.getByTestId('account-provider-access-card');
    await expect(providerAccessCard).toContainText(
      /provider access is not active yet|acesso de prestador ainda não está ativo/i,
    );
    await expect(providerAccessCard).toHaveScreenshot(
      'account-provider-access-disabled.png',
    );

    await page.getByTestId('account-provider-access-activate').click();
    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 10_000,
    });
    await expect(
      page.getByRole('heading', {
        name: /ativar acesso de prestador|activate provider access/i,
      }),
    ).toBeVisible();
  });
});
