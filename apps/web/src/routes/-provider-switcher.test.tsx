import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// The header provider switcher lists the caller's owned providers
// (`providerProfile.listMine`) and reflects the URL-derived active provider.
// The trpc proxy keys on the procedure name and serves the mutable
// `mockProviders` fixture via initialData so the query resolves synchronously.
// `Link` is the global test-setup stub: it renders an <a> carrying
// `data-to`/`data-params`, which the navigation assertions read.

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockProviders: any = [];

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
function trpcData(method: string): any {
  switch (method) {
    case 'listMine':
      return mockProviders;
    default:
      return null;
  }
}

const makeMethod = (method: string) => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  queryOptions: (input?: any, opts?: any) => ({
    queryKey: [method, input ?? null],
    queryFn: async () => trpcData(method),
    initialData: trpcData(method),
    ...(opts || {}),
  }),
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  queryKey: (input?: any) => [method, input ?? null],
});

const trpcProxy = new Proxy(
  {},
  {
    get: () =>
      new Proxy({}, { get: (_t, method: string) => makeMethod(method) }),
  },
);

mock.module('@/utils/trpc', () => ({
  trpc: trpcProxy,
  trpcClient: {},
}));

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// biome-ignore lint/suspicious/noExplicitAny: render node
function renderTree(node: any) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <I18nextProvider i18n={i18n}>{node}</I18nextProvider>
    </QueryClientProvider>,
  );
}

const { ProviderSwitcher, ProviderSwitcherItems } = await import(
  '@/routes/panel/provider/-provider-switcher'
);

describe('ProviderSwitcherItems', () => {
  test('each provider links into its $providerId route, active one is marked', () => {
    renderTree(
      <ProviderSwitcherItems
        providers={[
          { id: 'prov-1', displayName: 'Padaria do Zé', logoUrl: null },
          { id: 'prov-2', displayName: null, logoUrl: null },
        ]}
        activeProviderId="prov-1"
      />,
    );

    const itemOne = screen.getByTestId('provider-switcher-item-prov-1');
    expect(itemOne.getAttribute('data-to')).toBe('/panel/provider/$providerId');
    expect(itemOne.getAttribute('data-params')).toBe(
      JSON.stringify({ providerId: 'prov-1' }),
    );
    expect(itemOne.getAttribute('data-active')).toBe('true');
    expect(itemOne.textContent).toContain('Padaria do Zé');

    const itemTwo = screen.getByTestId('provider-switcher-item-prov-2');
    expect(itemTwo.getAttribute('data-params')).toBe(
      JSON.stringify({ providerId: 'prov-2' }),
    );
    // Non-active provider carries no active marker.
    expect(itemTwo.getAttribute('data-active')).toBeNull();
    // Unnamed provider falls back to the localized placeholder.
    expect(itemTwo.textContent).toContain(i18n.t('my_providers.unnamed'));

    // The manage link routes into the full My Providers page.
    const manage = screen.getByTestId('provider-switcher-manage');
    expect(manage.getAttribute('data-to')).toBe('/panel/provider/my-providers');
  });
});

describe('ProviderSwitcher', () => {
  beforeEach(() => {
    mockProviders = [];
  });

  test('renders nothing when the caller owns no providers', () => {
    mockProviders = [];
    const { container } = renderTree(
      <ProviderSwitcher activeProviderId={null} />,
    );
    expect(screen.queryByTestId('provider-switcher-trigger')).toBeNull();
    expect(container.textContent).toBe('');
  });

  test('reflects the active provider in the trigger label', () => {
    mockProviders = [
      { id: 'prov-1', displayName: 'Padaria do Zé', logoUrl: null },
      { id: 'prov-2', displayName: 'Mercadinho', logoUrl: null },
    ];
    renderTree(<ProviderSwitcher activeProviderId="prov-2" />);

    const trigger = screen.getByTestId('provider-switcher-trigger');
    expect(trigger.textContent).toContain('Mercadinho');
  });

  test('shows the select placeholder when no provider is active', () => {
    mockProviders = [
      { id: 'prov-1', displayName: 'Padaria do Zé', logoUrl: null },
    ];
    renderTree(<ProviderSwitcher activeProviderId={null} />);

    const trigger = screen.getByTestId('provider-switcher-trigger');
    expect(trigger.textContent).toContain(i18n.t('provider_switcher.select'));
  });
});
