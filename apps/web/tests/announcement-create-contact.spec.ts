import { expect, type Page, test } from '@playwright/test';

const PROVIDER_EMAIL = 'provider@test.com';
const PROVIDER_PASSWORD = 'Test@1234';
const SEEDED_PRIMARY_PHONE = '+5511999999999';

test.describe.configure({ mode: 'serial' });

async function signInViaUI(page: Page) {
  if (page.url().includes('/panel')) {
    return;
  }
  await page.goto('/auth');
  if (page.url().includes('/panel')) {
    return;
  }
  await page.getByLabel(/e-mail/i).fill(PROVIDER_EMAIL);
  await page.getByLabel(/senha/i).fill(PROVIDER_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

async function openCreateAnnouncement(page: Page) {
  await signInViaUI(page);
  await page.goto('/panel/provider/announcements/new');
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  await expect(page.getByTestId('contact-mode-inherit-badge')).toBeVisible();
}

test.describe('Announcement create — inherited contact authoring', () => {
  test('inherit mode shows the provider baseline and customize affordance', async ({
    page,
  }) => {
    await openCreateAnnouncement(page);

    // Inherited badge + live provider baseline number are surfaced.
    await expect(page.getByTestId('contact-mode-inherit-badge')).toBeVisible();
    await expect(page.getByText(SEEDED_PRIMARY_PHONE)).toBeVisible();
    await expect(page.getByTestId('contact-customize-button')).toBeVisible();

    // The custom override fields stay hidden until the provider opts in.
    await expect(page.getByTestId('contact-custom-phone')).toHaveCount(0);

    await expect(page).toHaveScreenshot('create-contact-inherit.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('customize reveals override fields and back affordance restores inherit', async ({
    page,
  }) => {
    await openCreateAnnouncement(page);

    await page.getByTestId('contact-customize-button').click();

    // Custom mode: override fields + custom badge are visible.
    await expect(page.getByTestId('contact-mode-custom-badge')).toBeVisible();
    await expect(page.getByTestId('contact-custom-phone')).toBeVisible();
    await expect(page.getByTestId('contact-use-defaults-button')).toBeVisible();
    await expect(page.getByTestId('contact-mode-inherit-badge')).toHaveCount(0);

    await expect(page).toHaveScreenshot('create-contact-custom.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });

    // Returning to inherit hides the override fields again.
    await page.getByTestId('contact-use-defaults-button').click();
    await expect(page.getByTestId('contact-mode-inherit-badge')).toBeVisible();
    await expect(page.getByTestId('contact-custom-phone')).toHaveCount(0);
  });
});
