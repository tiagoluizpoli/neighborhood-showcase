import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Seed-stable IDs and URL constants
// ---------------------------------------------------------------------------

/** Full-branding provider: bannerUrl + logoUrl + companyName + tradeName + socialLinks */
const BRANDING_PROVIDER_ID = 'seed-branding-id';

/** Minimal-branding provider: no banner, no logo, no social links */
const PLAIN_PROVIDER_ID = 'seed-provider-other-id';

/** Banned provider: user.status === 'BANNED' → must render not-found */
const BANNED_PROVIDER_ID = 'seed-banned-id';

/** Non-existent ID → must render not-found */
const NONEXISTENT_PROVIDER_ID = 'does-not-exist';

const VIEWPORT = { width: 1280, height: 900 };

// ---------------------------------------------------------------------------
// Full branding render
// ---------------------------------------------------------------------------
test.describe('Public provider page — full branding', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(`/providers/${BRANDING_PROVIDER_ID}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
  });

  test('renders the banner image', async ({ page }) => {
    const banner = page.locator('section img[alt*="Banner"]');
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await expect(banner).toHaveAttribute('src', /placehold\.co/);
  });

  test('renders displayName as the h1 heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Branding Visual Test' }),
    ).toBeVisible();
  });

  test('renders company identity line (tradeName • companyName)', async ({
    page,
  }) => {
    await expect(
      page.getByText(/Branding Co\. • Branding Ltda\./),
    ).toBeVisible();
  });

  test('renders logo image', async ({ page }) => {
    const logo = page.locator('img[alt*="Logo"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', /placehold\.co/);
  });

  test('renders social link buttons (WhatsApp and Instagram)', async ({
    page,
  }) => {
    await expect(page.getByRole('link', { name: /whatsapp/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /instagram/i })).toBeVisible();
  });

  test('renders public description text', async ({ page }) => {
    await expect(page.getByText(/branding para condominios/i)).toBeVisible();
  });

  test('renders the Sobre section card', async ({ page }) => {
    await expect(page.getByText('Sobre', { exact: true })).toBeVisible();
  });

  test('renders the Anúncios ativos section heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Anúncios ativos' }),
    ).toBeVisible();
  });

  test('visual snapshot — full branding with banner', async ({ page }) => {
    await expect(page).toHaveScreenshot(
      'public-provider-full-branding-1280x900.png',
      {
        fullPage: false,
        maxDiffPixels: 3000,
        mask: [page.locator('section img')],
      },
    );
  });
});

// ---------------------------------------------------------------------------
// No-banner render
// ---------------------------------------------------------------------------
test.describe('Public provider page — no banner', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(`/providers/${PLAIN_PROVIDER_ID}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
  });

  test('renders displayName as the h1 heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Provider Other' }),
    ).toBeVisible();
  });

  test('does NOT render a banner image element', async ({ page }) => {
    // Banner section is conditionally rendered — should be absent
    await expect(page.locator('section img[alt*="Banner"]')).toHaveCount(0);
  });

  test('renders the Sobre section with placeholder text', async ({ page }) => {
    await expect(
      page.getByText(/ainda não adicionou uma descrição pública/i),
    ).toBeVisible();
  });

  test('renders contact card with "no channels" message', async ({ page }) => {
    await expect(
      page.getByText(/nenhum canal de contato cadastrado/i),
    ).toBeVisible();
  });

  test('renders the active announcement (Jardinagem Express)', async ({
    page,
  }) => {
    await expect(page.getByText('Jardinagem Express')).toBeVisible();
  });

  test('verified badge is visible for the approved-resident provider', async ({
    page,
  }) => {
    await expect(page.getByText(/morador verificado/i)).toBeVisible();
  });

  test('visual snapshot — no banner layout', async ({ page }) => {
    await expect(page).toHaveScreenshot(
      'public-provider-no-banner-1280x900.png',
      {
        fullPage: false,
        maxDiffPixels: 10000,
        mask: [page.locator('img')],
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Not-found behavior — banned provider
// ---------------------------------------------------------------------------
test.describe('Public provider page — banned provider', () => {
  test('shows not-found message for a banned provider', async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(`/providers/${BANNED_PROVIDER_ID}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    await expect(
      page.getByRole('heading', { name: 'Prestador não encontrado' }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows the back-to-home button for a banned provider', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(`/providers/${BANNED_PROVIDER_ID}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    await expect(
      page.getByRole('heading', { name: 'Prestador não encontrado' }),
    ).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.getByRole('button', { name: /voltar para o início/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Not-found behavior — non-existent provider ID
// ---------------------------------------------------------------------------
test.describe('Public provider page — non-existent provider', () => {
  test('shows not-found message for an unknown provider ID', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(`/providers/${NONEXISTENT_PROVIDER_ID}`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    await expect(
      page.getByRole('heading', { name: 'Prestador não encontrado' }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ---------------------------------------------------------------------------
// Public announcement detail — CTA present vs fallback (T-17-06 matrix)
// seed-announcement-auth-cta-present: inherit contact + provider_profile CTA
//   → sanitizeCta keeps the primary; public page shows cta-primary-action
// seed-announcement-auth-cta-fallback: inherit contact + website/null CTA
//   → sanitizeCta drops null-valued website; public page falls back to WhatsApp
// ---------------------------------------------------------------------------
test.describe('Public announcement detail — CTA matrix', () => {
  const AUTHORING_PROVIDER_ID = 'seed-authoring-id';

  test('CTA-present announcement shows cta-primary-action linking to provider profile', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto('/anuncios/seed-announcement-auth-cta-present');
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const ctaAction = page.getByTestId('cta-primary-action');
    await expect(ctaAction).toBeVisible({ timeout: 15_000 });
    await expect(ctaAction).toHaveAttribute(
      'href',
      `/providers/${AUTHORING_PROVIDER_ID}`,
    );
  });

  test('CTA-fallback announcement shows no cta-actions block and falls back to WhatsApp', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto('/anuncios/seed-announcement-auth-cta-fallback');
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // The invalid website CTA was sanitized server-side → no CTA block rendered.
    await expect(page.getByTestId('cta-actions')).toHaveCount(0);

    // Contact fallback: provider's inherited WhatsApp link (+5511966667777)
    // must be visible as the primary contact action.
    const whatsappLink = page.locator('a[href*="wa.me"]');
    await expect(whatsappLink).toBeVisible({ timeout: 10_000 });
  });
});
