import { expect, type Page, test } from '@playwright/test';

const PROVIDER_EMAIL = 'provider@test.com';
const PROVIDER_PASSWORD = 'Test@1234';
const ACTIVE_ID = 'seed-announcement-active';
const OTHER_PROVIDER_ID = 'seed-announcement-other-provider';

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

async function openMyAnnouncements(page: Page) {
  await signInViaUI(page);
  await page.goto('/panel/dashboard/announcements');
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  await expect(
    page.getByRole('heading', { name: /meus anúncios|my announcements/i }),
  ).toBeVisible();
}

async function openAnnouncementDetail(page: Page, id = ACTIVE_ID) {
  await signInViaUI(page);
  await page.goto(`/panel/dashboard/announcements/${id}`);
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
      /\/panel\/dashboard\/announcements\/seed-announcement-active$/,
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

  test('redirects to the list when the announcement id does not exist', async ({
    page,
  }) => {
    await openAnnouncementDetail(page, 'missing-announcement-id');

    await page.waitForURL(/\/panel\/dashboard\/announcements$/, {
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

    await page.waitForURL(/\/panel\/dashboard\/announcements$/, {
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
});
