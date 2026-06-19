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

function getSidebar(page: Page) {
  return page.locator('[data-sidebar]');
}

test.describe('Seeded access states', () => {
  test('Provider-enabled user sees the Provedor group', async ({ page }) => {
    await signInViaUI(page, 'provider@test.com');

    await expect(
      getSidebar(page).getByText('Provedor', { exact: true }),
    ).toBeVisible();
  });

  test('Provider-disabled user does not see Provider, Moderation, or Admin groups', async ({
    page,
  }) => {
    await signInViaUI(page, 'nonprovider@test.com');

    await expect(
      getSidebar(page).getByText('Provedor', { exact: true }),
    ).toHaveCount(0);
    await expect(
      getSidebar(page).getByText(/moderação|moderation/i),
    ).toHaveCount(0);
    await expect(
      getSidebar(page).getByText(/administração|administration/i),
    ).toHaveCount(0);
    await expect(getSidebar(page).getByText(/spectrum/i)).toHaveCount(0);
  });

  test('Moderator-only user sees Moderation but not Provider', async ({
    page,
  }) => {
    await signInViaUI(page, 'moderator@test.com');

    await expect(
      getSidebar(page).getByText(/moderação|moderation/i),
    ).toBeVisible();
    await expect(
      getSidebar(page).getByText('Provedor', { exact: true }),
    ).toHaveCount(0);
  });

  test('Administrator sees Administração and Spectrum but not Provider', async ({
    page,
  }) => {
    await signInViaUI(page, 'admin@test.com');

    await expect(
      getSidebar(page).getByText(/administração|administration/i),
    ).toBeVisible();
    await expect(
      getSidebar(page)
        .locator('[data-sidebar="group-label"]')
        .getByText(/spectrum/i),
    ).toBeVisible();
    await expect(
      getSidebar(page).getByText('Provedor', { exact: true }),
    ).toHaveCount(0);
  });

  test('System manager sees Administração but not Spectrum or Provider', async ({
    page,
  }) => {
    await signInViaUI(page, 'system.manager@test.com');

    await expect(
      getSidebar(page).getByText(/administração|administration/i),
    ).toBeVisible();
    await expect(getSidebar(page).getByText(/spectrum/i)).toHaveCount(0);
    await expect(
      getSidebar(page).getByText('Provedor', { exact: true }),
    ).toHaveCount(0);
  });
});
