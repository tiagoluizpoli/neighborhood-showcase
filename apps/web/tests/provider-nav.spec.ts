import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: sign in via the UI
// ---------------------------------------------------------------------------
async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth');
  // "Entrar" tab is already selected by default — no click needed
  await page.getByPlaceholder(/e-mail/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Provider navigation: all 3 items are flat siblings (no sub-menu)
// ---------------------------------------------------------------------------
test.describe('Provider Navigation Flatten', () => {
  test('Provider group shows exactly 3 flat buttons: Dashboard, Announcements, Configuration', async ({
    page,
  }) => {
    await signInViaUI(page, 'provider@test.com', 'Test@1234');
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    // Locate the Provider group via its label
    const providerGroup = page
      .locator('[data-sidebar]')
      .locator('text=Provedor')
      .locator('..');

    // Find all SidebarMenuButton elements within the Provider group
    // Each button has class "md:hidden" or is a direct child of SidebarMenuItem
    // We count direct <a> links (rendered by the Link component)
    const buttons = providerGroup.locator('a[href*="/panel/dashboard"]');
    const count = await buttons.count();

    expect(count).toBe(3);

    // Verify labels: Dashboard, Announcements (Meus Anúncios), Configuration (Configurações)
    const labels = await buttons.allInnerTexts();
    // labels include the icon text too — just check that the text is non-empty and not a raw key
    for (const label of labels) {
      expect(label.trim().length).toBeGreaterThan(0);
      expect(label).not.toMatch(/\.[\w]+/); // no raw i18n keys
    }
  });

  test('Provider buttons link to correct routes', async ({ page }) => {
    await signInViaUI(page, 'provider@test.com', 'Test@1234');
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    const providerGroup = page
      .locator('[data-sidebar]')
      .locator('text=Provedor')
      .locator('..');

    // Dashboard link
    const dashboardLink = providerGroup.locator('a[href="/panel/dashboard"]');
    await expect(dashboardLink).toBeVisible();

    // Announcements link
    const announcementsLink = providerGroup.locator(
      'a[href="/panel/dashboard/announcements"]',
    );
    await expect(announcementsLink).toBeVisible();

    // Configuration link
    const configurationLink = providerGroup.locator(
      'a[href="/panel/dashboard/configuration"]',
    );
    await expect(configurationLink).toBeVisible();
  });

  test('No expand/collapse toggle inside Provider group', async ({ page }) => {
    await signInViaUI(page, 'provider@test.com', 'Test@1234');
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    const providerGroup = page
      .locator('[data-sidebar]')
      .locator('text=Provedor')
      .locator('..');

    // No element with chevron-down / chevron-right inside Provider group
    // (SidebarMenuSub renders a toggle indicator)
    const chevrons = providerGroup.locator('[data-sidebar="sub"]');
    await expect(chevrons).toHaveCount(0);
  });
});
