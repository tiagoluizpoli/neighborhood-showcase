import { expect, type Page, test } from '@playwright/test';

const PROVIDER_EMAIL = 'provider@test.com';
const PROVIDER_PASSWORD = 'Test@1234';
const ACTIVE_ID = 'seed-announcement-active';
const OTHER_PROVIDER_ID = 'seed-announcement-other-provider';
const CUSTOM_PHONE = '551199998888';

const AUTHORING_EMAIL = 'authoring@test.com';
const AUTHORING_PASSWORD = 'Test@1234';

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

async function signInAsAuthoring(page: Page) {
  await page.goto('/auth');
  await page.getByLabel(/e-mail/i).fill(AUTHORING_EMAIL);
  await page.getByLabel(/senha/i).fill(AUTHORING_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

async function openMyAnnouncements(page: Page) {
  await signInViaUI(page);
  await page.goto('/panel/provider/announcements');
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  await expect(
    page.getByRole('heading', { name: /meus anúncios|my announcements/i }),
  ).toBeVisible();
}

async function openAnnouncementDetail(page: Page, id = ACTIVE_ID) {
  await signInViaUI(page);
  await page.goto(`/panel/provider/announcements/${id}`);
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
}

test.describe('Meus Anúncios', () => {
  test('renders the 4 tabs with the seeded count badges', async ({ page }) => {
    await openMyAnnouncements(page);

    await expect(page.getByTestId('meus-anuncios-tab-active')).toBeVisible();
    await expect(page.getByTestId('meus-anuncios-tab-draft')).toBeVisible();
    await expect(page.getByTestId('meus-anuncios-tab-expired')).toBeVisible();
    await expect(page.getByTestId('meus-anuncios-tab-suspended')).toBeVisible();

    await expect(page.getByTestId('meus-anuncios-count-active')).toHaveText(
      '1',
    );
    await expect(page.getByTestId('meus-anuncios-count-draft')).toHaveText('1');
    await expect(page.getByTestId('meus-anuncios-count-expired')).toHaveText(
      '1',
    );
    await expect(page.getByTestId('meus-anuncios-count-suspended')).toHaveText(
      '1',
    );

    await expect(page).toHaveScreenshot('meus-anuncios-list.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('clicking a card navigates to the provider detail route', async ({
    page,
  }) => {
    await openMyAnnouncements(page);
    await page.getByTestId(`meus-anuncios-card-active-${ACTIVE_ID}`).click();
    await expect(page).toHaveURL(
      /\/panel\/provider\/announcements\/seed-announcement-active$/,
    );
  });

  test('draft tab shows only the draft bucket cards', async ({ page }) => {
    await openMyAnnouncements(page);
    await page.getByTestId('meus-anuncios-tab-draft').click();

    await expect(
      page.getByTestId('meus-anuncios-card-draft-seed-announcement-draft'),
    ).toBeVisible();
    await expect(
      page.getByTestId('meus-anuncios-card-active-seed-announcement-active'),
    ).toHaveCount(0);
  });

  test('detail page renders metadata and analytics for the owner announcement', async ({
    page,
  }) => {
    page.on('console', (msg) => console.log('BROWSER:', msg.text()));
    await openAnnouncementDetail(page);

    await expect(
      page.getByRole('heading', { name: /bolos caseiros premium/i }),
    ).toBeVisible();
    const headings = await page.getByRole('heading').allInnerTexts();
    console.log('HEADINGS ON DETAIL PAGE:', headings);
    await expect(
      page.getByRole('heading', { name: /métricas|analytics/i }),
    ).toBeVisible();
    await expect(page.getByText(/resumo rápido|quick summary/i)).toBeVisible();
    await expect(page).toHaveScreenshot('meus-anuncios-detail-view.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('detail page shows inherited contact mode with the live provider baseline', async ({
    page,
  }) => {
    await openAnnouncementDetail(page);

    await expect(
      page.getByText(/usando padrões do perfil|using profile defaults/i),
    ).toBeVisible();
    await expect(page.getByText(/9999/)).toBeVisible();
    await expect(
      page.getByText(/chamadas diretas ativadas|direct calls enabled/i),
    ).toBeVisible();

    await expect(page).toHaveScreenshot(
      'meus-anuncios-detail-contact-inherit.png',
      {
        fullPage: true,
        maxDiffPixels: 1500,
      },
    );
  });

  test('redirects to the list when the announcement id does not exist', async ({
    page,
  }) => {
    await openAnnouncementDetail(page, 'missing-announcement-id');

    await page.waitForURL(/\/panel\/provider\/announcements$/, {
      timeout: 10_000,
    });
    await expect(
      page.getByText(
        /não existe ou não pertence|does not exist or does not belong/i,
      ),
    ).toBeVisible();
  });

  test('redirects to the list when opening another provider announcement id', async ({
    page,
  }) => {
    await openAnnouncementDetail(page, OTHER_PROVIDER_ID);

    await page.waitForURL(/\/panel\/provider\/announcements$/, {
      timeout: 10_000,
    });
    await expect(
      page.getByText(
        /não existe ou não pertence|does not exist or does not belong/i,
      ),
    ).toBeVisible();
  });

  test('edit mode saves and reloads the updated announcement title', async ({
    page,
  }) => {
    await openAnnouncementDetail(page);

    await page
      .getByRole('button', { name: /editar anúncio|edit announcement/i })
      .click();
    const titleInput = page.getByLabel(/título|title/i).first();
    const nextTitle = `Bolos Premium ${Date.now()}`;
    await titleInput.fill(nextTitle);
    await page
      .getByRole('button', { name: /salvar alterações|save changes/i })
      .click();

    await expect(
      page.getByText(
        /anúncio atualizado com sucesso|announcement updated successfully/i,
      ),
    ).toBeVisible();
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: nextTitle })).toBeVisible();
    await expect(page).toHaveScreenshot('meus-anuncios-detail-edit-saved.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('edit mode can switch to custom contact and persists after reload', async ({
    page,
  }) => {
    await openAnnouncementDetail(page);

    await page
      .getByRole('button', { name: /editar anúncio|edit announcement/i })
      .click();
    await expect(page.getByTestId('contact-mode-inherit-badge')).toBeVisible();

    await page.getByTestId('contact-customize-button').click();
    await expect(page.getByTestId('contact-mode-custom-badge')).toBeVisible();

    await page.getByTestId('contact-custom-phone').fill(CUSTOM_PHONE);
    await page
      .getByRole('button', { name: /salvar alterações|save changes/i })
      .click();

    await expect(
      page.getByText(
        /anúncio atualizado com sucesso|announcement updated successfully/i,
      ),
    ).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    await expect(
      page.getByText(
        /personalizado para este anúncio|custom for this announcement/i,
      ),
    ).toBeVisible();
    await expect(page.getByText(CUSTOM_PHONE)).toBeVisible();

    await expect(page).toHaveScreenshot(
      'meus-anuncios-detail-contact-custom.png',
      {
        fullPage: true,
        maxDiffPixels: 1500,
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Authoring model matrix — seeded announcements for authoring@test.com
// ST-01 seeded 4 announcements covering the full inherit/custom x CTA matrix.
// These tests verify the provider-panel contract for each quadrant without
// mutating announcements owned by provider@test.com (keeps tab counts stable).
// ---------------------------------------------------------------------------
test.describe('Authoring model matrix (authoring@test.com)', () => {
  async function openAuthoringDetail(page: Page, id: string) {
    await signInAsAuthoring(page);
    await page.goto(`/panel/provider/announcements/${id}`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  }

  test('auth-inherit detail shows inherited mode badge and calls-on status', async ({
    page,
  }) => {
    await openAuthoringDetail(page, 'seed-announcement-auth-inherit');

    await expect(
      page.getByText(/usando padrões do perfil|using profile defaults/i),
    ).toBeVisible();
    await expect(
      page.getByText(/chamadas diretas ativadas|direct calls enabled/i),
    ).toBeVisible();

    await expect(page).toHaveScreenshot(
      'meus-anuncios-auth-inherit-detail.png',
      {
        fullPage: true,
        maxDiffPixels: 1500,
      },
    );
  });

  test('auth-custom detail shows custom mode badge, custom phone, and calls-off', async ({
    page,
  }) => {
    await openAuthoringDetail(page, 'seed-announcement-auth-custom');

    await expect(
      page.getByText(
        /personalizado para este anúncio|custom for this announcement/i,
      ),
    ).toBeVisible();
    await expect(page.getByText('+5511955554444')).toBeVisible();
    await expect(
      page.getByText(
        /apenas whatsapp|chamadas diretas desativadas|calls.*off/i,
      ),
    ).toBeVisible();

    await expect(page).toHaveScreenshot(
      'meus-anuncios-auth-custom-detail.png',
      {
        fullPage: true,
        maxDiffPixels: 1500,
      },
    );
  });

  test('auth-cta-present edit mode shows CTA primary editor with provider_profile type', async ({
    page,
  }) => {
    await openAuthoringDetail(page, 'seed-announcement-auth-cta-present');

    await page
      .getByRole('button', { name: /editar anúncio|edit announcement/i })
      .click();

    await expect(page.getByTestId('cta-section')).toBeVisible();
    await expect(page.getByTestId('cta-primary-editor')).toBeVisible();
    // Type selector should reflect the seeded provider_profile target.
    await expect(page.getByTestId('cta-primary-type')).toContainText(
      /meu perfil|prestador|provider_profile/i,
    );

    await expect(page).toHaveScreenshot(
      'meus-anuncios-auth-cta-present-edit.png',
      {
        fullPage: true,
        maxDiffPixels: 1500,
      },
    );
  });

  test('auth-cta-fallback edit mode shows CTA primary editor with website type and blank value', async ({
    page,
  }) => {
    await openAuthoringDetail(page, 'seed-announcement-auth-cta-fallback');

    await page
      .getByRole('button', { name: /editar anúncio|edit announcement/i })
      .click();

    await expect(page.getByTestId('cta-section')).toBeVisible();
    await expect(page.getByTestId('cta-primary-editor')).toBeVisible();
    // Type selector must show website (the seeded type that sanitizeCta drops on public reads).
    await expect(page.getByTestId('cta-primary-type')).toContainText(
      /site|cardápio|website/i,
    );
    // Value input exists for the URL-typed target and has no seeded value.
    await expect(page.getByTestId('cta-primary-value')).toHaveValue('');

    await expect(page).toHaveScreenshot(
      'meus-anuncios-auth-cta-fallback-edit.png',
      {
        fullPage: true,
        maxDiffPixels: 1500,
      },
    );
  });
});
