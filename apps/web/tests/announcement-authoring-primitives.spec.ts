import { expect, type Page, test } from '@playwright/test';

const PROVIDER_EMAIL = 'provider@test.com';
const PROVIDER_PASSWORD = 'Test@1234';
// The edit-parity test mutates tags, so it targets the draft announcement —
// no visual baseline depends on the draft detail view, avoiding cross-spec
// seed contamination with meus-anuncios.spec screenshots of the active one.
const DRAFT_ID = 'seed-announcement-draft';

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
  await expect(page.getByTestId('category-combobox-trigger')).toBeVisible();
}

async function openAnnouncementDetail(page: Page, id = DRAFT_ID) {
  await signInViaUI(page);
  await page.goto(`/panel/provider/announcements/${id}`);
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
}

test.describe('Announcement authoring primitives — create', () => {
  test('category is a searchable single-select combobox', async ({ page }) => {
    await openCreateAnnouncement(page);

    const trigger = page.getByTestId('category-combobox-trigger');
    await trigger.click();
    await expect(page.getByTestId('category-combobox-input')).toBeVisible();

    // A non-matching query surfaces the empty state (search actually filters).
    await page.getByTestId('category-combobox-input').fill('zzzznotacategory');
    await expect(
      page.getByText(/nenhuma categoria|no category/i),
    ).toBeVisible();

    // Clearing the query brings options back; selecting one updates the trigger.
    await page.getByTestId('category-combobox-input').fill('');
    const firstOption = page
      .locator('[data-testid^="category-option-"]')
      .first();
    const optionName = (await firstOption.innerText()).trim();
    await firstOption.click();

    await expect(page.getByTestId('category-combobox-input')).toHaveCount(0);
    await expect(trigger).toContainText(optionName);
  });

  test('tags are structured chips with conservative dedupe', async ({
    page,
  }) => {
    await openCreateAnnouncement(page);

    const tagsInput = page.getByTestId('tags-input');
    await tagsInput.fill('Bolo');
    await tagsInput.press('Enter');
    await expect(page.getByTestId('tag-chip-bolo')).toBeVisible();

    // Case/accent duplicate must not create a second chip.
    await tagsInput.fill('BOLO');
    await tagsInput.press('Enter');
    await expect(page.getByTestId('tag-chip-bolo')).toHaveCount(1);

    // A distinct tag is added; singular/plural are NOT collapsed.
    await tagsInput.fill('bolos');
    await tagsInput.press('Enter');
    await expect(page.getByTestId('tag-chip-bolos')).toBeVisible();

    // Chips are individually removable.
    await page.getByTestId('tag-remove-bolo').click();
    await expect(page.getByTestId('tag-chip-bolo')).toHaveCount(0);
    await expect(page.getByTestId('tag-chip-bolos')).toBeVisible();
  });

  test('tags offer autocomplete suggestions sourced from existing tags', async ({
    page,
  }) => {
    await openCreateAnnouncement(page);

    // Focusing the empty field surfaces known tags (seeded announcements have
    // tags); picking one adds it as a chip.
    await page.getByTestId('tags-input').click();
    await expect(page.getByTestId('tag-suggestions')).toBeVisible();

    const firstSuggestion = page
      .locator('[data-testid^="tag-suggestion-"]')
      .first();
    const suggested = (await firstSuggestion.innerText())
      .replace(/^#/, '')
      .trim();
    await firstSuggestion.click();
    await expect(page.getByTestId(`tag-chip-${suggested}`)).toBeVisible();
  });

  test('tag autocomplete is keyboard-navigable', async ({ page }) => {
    await openCreateAnnouncement(page);

    const tagsInput = page.getByTestId('tags-input');
    await tagsInput.click();
    await expect(page.getByTestId('tag-suggestions')).toBeVisible();

    const suggestionTexts = await page
      .locator('[data-testid^="tag-suggestion-"]')
      .allInnerTexts();
    // ArrowDown moves the active row to the second suggestion; Enter commits it.
    const second = suggestionTexts[1].replace(/^#/, '').trim();
    await tagsInput.press('ArrowDown');
    await tagsInput.press('Enter');

    await expect(page.getByTestId(`tag-chip-${second}`)).toBeVisible();
  });

  test('price input behaves like money and shows the details card', async ({
    page,
  }) => {
    await openCreateAnnouncement(page);

    const priceInput = page.getByTestId('price-input');
    await priceInput.click();
    await priceInput.pressSequentially('4599');
    // Calculator-style cents: digits shift into a two-decimal money amount.
    await expect(priceInput).toHaveValue('45,99');

    await expect(page).toHaveScreenshot('create-authoring-primitives.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });
});

test.describe('Announcement authoring primitives — edit parity', () => {
  test('edit exposes the same category/price/tag controls and persists a tag', async ({
    page,
  }) => {
    await openAnnouncementDetail(page);

    await page
      .getByRole('button', { name: /editar anúncio|edit announcement/i })
      .click();

    // Same scalable primitives are available after creation (capability parity).
    await expect(page.getByTestId('category-combobox-trigger')).toBeVisible();
    await expect(page.getByTestId('price-input')).toBeVisible();
    const tagsInput = page.getByTestId('tags-input');
    await expect(tagsInput).toBeVisible();

    const uniqueTag = `e2e${Date.now()}`;
    await tagsInput.fill(uniqueTag);
    await tagsInput.press('Enter');
    await expect(page.getByTestId(`tag-chip-${uniqueTag}`)).toBeVisible();

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

    // The new tag survives a round-trip and renders in the detail tag list.
    await expect(page.getByText(`#${uniqueTag}`)).toBeVisible();
  });
});
