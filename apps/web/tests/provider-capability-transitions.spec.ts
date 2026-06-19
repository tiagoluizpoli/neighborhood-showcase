import { type Browser, expect, type Page, test } from '@playwright/test';

const PASSWORD = 'Test@1234';
const TRANSITION_USER_EMAIL = 'provider.transition@test.com';
const TRANSITION_MODERATOR_EMAIL = 'transition.moderator@test.com';
const TRANSITION_CONDO_NAME = 'Condomínio Fluxo de Transição';

async function signInViaUI(page: Page, email: string) {
  await page.goto('/auth');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/panel/, { timeout: 15_000 });
}

async function expectProviderNavVisibility(page: Page, visible: boolean) {
  const providerLink = page.locator('a[href="/panel/provider"]');

  if (visible) {
    await expect(providerLink).toHaveCount(1);
    await expect(providerLink.first()).toBeVisible();
    return;
  }

  await expect(providerLink).toHaveCount(0);
}

async function requestResidentAccess(page: Page) {
  await page.goto('/panel/dashboard/condo-setup');
  await page.setViewportSize({ width: 1280, height: 1024 });
  await page
    .getByRole('button', { name: /solicitar acesso|request access/i })
    .first()
    .click();

  const condoSearch = page.locator('#search-condo');
  await expect(condoSearch).toBeVisible();
  await condoSearch.fill('Fluxo de Transição');

  const condoOption = page.getByRole('button', {
    name: /condomínio fluxo de transição/i,
  });
  await expect(condoOption).toBeVisible({ timeout: 15_000 });
  await condoOption.click();

  await page.locator('#unit-info').fill('Bloco T, Apto 304');
  await page.getByRole('button', { name: /solicitar acesso/i }).click();

  await expect(
    page.getByText(/solicitação pendente|pending request/i),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText(new RegExp(TRANSITION_CONDO_NAME, 'i')).first(),
  ).toBeVisible();

  await expect(page).toHaveScreenshot(
    'provider-transition-pending-status-1280x1024.png',
    {
      fullPage: false,
      maxDiffPixels: 10000,
      mask: [page.locator('[data-slot="sidebar-footer"]')],
    },
  );
}

async function approveResidentAssignment(browser: Browser) {
  const moderatorContext = await browser.newContext();
  const moderatorPage = await moderatorContext.newPage();

  try {
    await signInViaUI(moderatorPage, TRANSITION_MODERATOR_EMAIL);
    await moderatorPage.goto('/panel/moderation');

    await expect(
      moderatorPage.getByRole('heading', {
        name: /solicitações de moradores/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    const residentCard = moderatorPage.locator('[data-slot="card"]').filter({
      hasText: 'Provider Transition Test',
    });

    await expect(residentCard).toBeVisible({ timeout: 15_000 });
    await residentCard.getByRole('button', { name: /aprovar/i }).click();

    await expect(
      moderatorPage.getByText(/morador aprovado com sucesso/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(moderatorPage.getByText(/tudo sob controle/i)).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    await moderatorContext.close();
  }
}

test.describe('Provider capability transitions', () => {
  test('resident activation request becomes provider-enabled after moderator approval', async ({
    browser,
    page,
  }) => {
    await signInViaUI(page, TRANSITION_USER_EMAIL);

    await page.goto('/panel/provider');
    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 15_000,
    });
    await expectProviderNavVisibility(page, false);

    await requestResidentAccess(page);
    await expectProviderNavVisibility(page, false);

    await page.goto('/panel/provider');
    await page.waitForURL(/\/panel\/dashboard\/condo-setup/, {
      timeout: 15_000,
    });

    await approveResidentAssignment(browser);

    await page.reload();
    await expect(
      page.getByText(/associação aprovada|association approved/i),
    ).toBeVisible({ timeout: 15_000 });

    await expectProviderNavVisibility(page, true);
    await page
      .getByRole('button', { name: /ir para o painel|go to dashboard/i })
      .click();
    await page.waitForURL(/\/panel\/provider/, { timeout: 15_000 });

    await expectProviderNavVisibility(page, true);
    await expect(
      page.getByText(/visualizações|impressions/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto('/panel/account');
    await expect(
      page.getByTestId('account-provider-access-card'),
    ).toContainText(
      /provider access is active|acesso de prestador está ativo/i,
    );

    await page.getByTestId('account-provider-access-manage').click();
    await page.waitForURL(/\/panel\/provider\/configuration/, {
      timeout: 15_000,
    });
    await expect(page.locator('#displayName')).toHaveValue(
      'Provider Transition Test',
    );
  });
});
