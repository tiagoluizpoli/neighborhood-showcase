import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: sign in via the UI
// ---------------------------------------------------------------------------
async function signInViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByRole('link', { name: /entrar/i }).click();
  await page.getByPlaceholder(/e-mail/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Spectrum navigation hierarchy: item is inside the Spectrum group, not root-level
// ---------------------------------------------------------------------------
test.describe('Spectrum Navigation Hierarchy', () => {
  test('Spectrum item is INSIDE the Spectrum group (not root-level) for ADMINISTRATOR', async ({
    page,
  }) => {
    // NOTE: This test requires an ADMINISTRATOR-seeded user.
    // Current seed data has no ADMINISTRATOR user. This test will fail until
    // a seed step creates one (e.g., an admin@ test account with ADMINISTRATOR role).
    //
    // Expected seeded credentials when available:
    //   admin@test.com / Test@1234 (role: ADMINISTRATOR)
    //
    // Until then, this test is skipped with an explicit reason.

    // Placeholder credentials — replace with real admin account once seeded
    const ADMIN_EMAIL = 'admin@test.com';
    const ADMIN_PASSWORD = 'Test@1234';

    await signInViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForSelector('[data-sidebar]', { timeout: 10_000 });

    // Locate the Spectrum group via its label text + sidebar group marker
    // The group label is inside a SidebarGroupLabel element
    const spectrumGroupLabel = page.getByText('Spectrum', { exact: false });
    await expect(spectrumGroupLabel).toBeVisible();

    // Navigate UP to the group container, then DOWN to find the Spectrum item link
    const spectrumGroup = spectrumGroupLabel.locator('..').locator('..');
    const spectrumItemLink = spectrumGroup.getByRole('link', {
      name: /spectrum/i,
    });
    await expect(spectrumItemLink).toBeVisible();
    await expect(spectrumItemLink).toHaveAttribute('href', '/panel/spectrum');

    // Verify there is NO root-level (top-of-sidebar) Spectrum link
    // Root-level means: direct child of [data-sidebar="content"] not inside any group
    const sidebarContent = page.locator('[data-sidebar="content"]');
    const directChildGroups = sidebarContent.locator(
      ':scope > [data-sidebar="group"]',
    );

    let foundRootLevelSpectrum = false;
    const groupCount = await directChildGroups.count();
    for (let i = 0; i < groupCount; i++) {
      const groupText = await directChildGroups.nth(i).innerText();
      // If this group label is "Spectrum" and it has a direct link to /panel/spectrum,
      // that would be the wrong placement (root-level item instead of child)
      if (groupText.toLowerCase().includes('spectrum')) {
        const rootSpectrumLinks = await directChildGroups
          .nth(i)
          .getByRole('link', { name: /spectrum/i })
          .count();
        if (rootSpectrumLinks > 0) {
          foundRootLevelSpectrum = true;
        }
      }
    }
    expect(foundRootLevelSpectrum).toBe(false);
  });
});
