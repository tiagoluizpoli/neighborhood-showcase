import { beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Use the real i18n instance instead of mocking react-i18next. bun's
// `mock.module` is process-global and permanent, so a partial react-i18next mock
// (one that drops `initReactI18next`/`I18nextProvider`) breaks every other test
// file that imports `@/i18n` in the same process. Spying on the real instance's
// `changeLanguage` keeps the integration assertion intact without that leak.

const mutateAsync = mock(async () => ({}));
mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    user: { update: { mutationOptions: () => ({ mutationFn: mutateAsync }) } },
  },
}));

// Render the popover inline so the language options are queryable without
// driving base-ui's open/portal lifecycle — this test owns LanguageSwitcher's
// behavior, not the popover primitive.
mock.module('@neighborhood-showcase/ui/components/popover', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  Popover: ({ children }: any) => children,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  PopoverTrigger: (props: any) => props.render ?? null,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  PopoverContent: ({ children }: any) => children,
}));

const { LanguageSwitcher } = await import('@/components/language-switcher');

function renderSwitcher() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('LanguageSwitcher Component Tests', () => {
  beforeEach(async () => {
    mutateAsync.mockClear();
    await i18n.changeLanguage('pt');
  });

  test('renders flag for currently selected language (pt = 🇧🇷)', () => {
    renderSwitcher();
    expect(screen.getAllByText('🇧🇷').length).toBeGreaterThan(0);
  });

  test('trigger shows 🇺🇸 when i18n language is en', async () => {
    await i18n.changeLanguage('en');
    renderSwitcher();
    expect(screen.getAllByText('🇺🇸').length).toBeGreaterThan(0);
  });

  test('popover contains both language options with flags', () => {
    renderSwitcher();
    expect(screen.getAllByText('🇧🇷').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🇺🇸').length).toBeGreaterThan(0);
  });

  test('clicking the English option calls i18n.changeLanguage with "en"', () => {
    const changeLanguage = spyOn(i18n, 'changeLanguage');
    renderSwitcher();

    fireEvent.click(screen.getByRole('button', { name: /English/ }));

    expect(changeLanguage).toHaveBeenCalledWith('en');
    changeLanguage.mockRestore();
  });
});
