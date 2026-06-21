import { describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// The old /panel/dashboard analytics page was sharded by later work: T-14 turned
// the route into a redirect-only shim and the analytics UI moved to
// /panel/provider (covered by the provider-dashboard route-frame/route-surface
// tests). The edit image/form-field seams remain and are exercised here against
// their current T-17 contracts.

mock.module('sonner', () => ({
  toast: { success: () => {}, error: () => {} },
}));

// The edit form fields render AnnouncementTagsInput, which queries tag
// suggestions; provide the trpc paths it (and the category combobox) touch.
mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    announcement: {
      listTagSuggestions: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input?: any) => ({
          queryKey: ['listTagSuggestions', input ?? null],
          queryFn: async () => [],
          initialData: [],
        }),
      },
      listCategories: {
        queryOptions: () => ({
          queryKey: ['listCategories'],
          queryFn: async () => [],
          initialData: [],
        }),
      },
    },
  },
}));

const { Route: DashboardIndexRoute } = await import('./panel.dashboard.index');
const { ProviderDashboardEditImageField } = await import(
  './panel/-provider-dashboard-edit-image-field'
);
const { ProviderDashboardEditFormFields } = await import(
  './panel/-provider-dashboard-edit-form-fields'
);

function renderWithProviders(ui: JSX.Element) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('Dashboard index redirect shim', () => {
  test('redirects /panel/dashboard/ to the provider dashboard', () => {
    let result: unknown = null;
    try {
      // biome-ignore lint/style/noNonNullAssertion: shim defines beforeLoad
      DashboardIndexRoute.options.beforeLoad!({} as never);
    } catch (redirectResult) {
      result = redirectResult;
    }
    expect((result as { options?: { to?: string } })?.options?.to).toBe(
      '/panel/dashboard',
    );
  });
});

describe('ProviderDashboardEditImageField', () => {
  test('renders the cover preview and the change-image control', async () => {
    await i18n.changeLanguage('pt');
    const { container } = renderWithProviders(
      <ProviderDashboardEditImageField
        imageUrl="preview.jpg"
        onImageUrlChange={() => {}}
        onUploadingChange={() => {}}
      />,
    );

    expect(container.querySelector('img[src="preview.jpg"]')).toBeTruthy();
    expect(screen.getByText('Alterar imagem')).toBeTruthy();
  });
});

describe('ProviderDashboardEditFormFields', () => {
  test('renders the content controls and the verification toggle copy', async () => {
    await i18n.changeLanguage('pt');
    const { container } = renderWithProviders(
      <ProviderDashboardEditFormFields
        backendCategories={[{ id: 'cat-1', name: 'Serviços Gerais' }]}
        canVerify={false}
        categoryId="cat-1"
        contactMode="inherit"
        cta={{ primary: null, secondary: [] }}
        customCallEnabled={false}
        customPhone=""
        description="Descrição longa o suficiente"
        imageUrl="preview.jpg"
        isLoadingProviderDefaults={false}
        isUploading={false}
        priceCents={null}
        providerDefaults={null}
        showVerifiedBadge={false}
        subtitle="Subtítulo"
        tags={['bolo']}
        title="Título"
        onCategoryIdChange={() => {}}
        onConfigureContact={() => {}}
        onContactModeChange={() => {}}
        onCtaChange={() => {}}
        onCustomCallEnabledChange={() => {}}
        onCustomPhoneChange={() => {}}
        onDescriptionChange={() => {}}
        onImageUrlChange={() => {}}
        onPriceCentsChange={() => {}}
        onShowVerifiedBadgeChange={() => {}}
        onSubtitleChange={() => {}}
        onTagsChange={() => {}}
        onTitleChange={() => {}}
        onUploadingChange={() => {}}
      />,
    );

    // Content controls (title + price + tags inputs) render.
    expect(screen.getByLabelText('Título *')).toBeTruthy();
    expect(container.querySelector('[data-testid="price-input"]')).toBeTruthy();
    expect(
      container.querySelector('[data-testid="tag-chip-bolo"]'),
    ).toBeTruthy();

    // Verification toggle copy (now i18n-resolved).
    expect(screen.getByText('Exibir selo de morador verificado')).toBeTruthy();
  });
});
