import { expect, type Page, test } from '@playwright/test';

const PROVIDER_EMAIL = 'provider@test.com';
const PROVIDER_PASSWORD = 'Test@1234';

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
  await expect(page.getByTestId('cta-section')).toBeVisible();
}

test.describe('Announcement create — bounded CTA authoring', () => {
  test('CTA section starts empty and stays separate from contact', async ({
    page,
  }) => {
    await openCreateAnnouncement(page);

    // CTA is its own section, distinct from the contact card.
    await expect(page.getByTestId('cta-section')).toBeVisible();
    await expect(page.getByTestId('cta-add-primary')).toBeVisible();
    // No target editors are present until the provider adds one.
    await expect(page.getByTestId('cta-primary-editor')).toHaveCount(0);

    await expect(page).toHaveScreenshot('create-cta-empty.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('author a primary URL CTA plus a secondary target', async ({ page }) => {
    await openCreateAnnouncement(page);

    // Add a primary target and switch it to a website URL destination via the
    // shadcn Select (open the trigger, pick the item).
    await page.getByTestId('cta-add-primary').click();
    await expect(page.getByTestId('cta-primary-editor')).toBeVisible();
    await page.getByTestId('cta-primary-type').click();
    await page.getByTestId('cta-primary-type-option-website').click();
    await page
      .getByTestId('cta-primary-value')
      .fill('https://menu.example.com');

    // Add a secondary target (defaults to provider_profile, which needs no URL).
    await page.getByTestId('cta-add-secondary').click();
    await expect(page.getByTestId('cta-secondary-0-editor')).toBeVisible();

    await expect(page).toHaveScreenshot('create-cta-authored.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });

    // Removing the primary returns to the empty add-affordance.
    await page.getByTestId('cta-primary-remove').click();
    await expect(page.getByTestId('cta-add-primary')).toBeVisible();
  });
});
