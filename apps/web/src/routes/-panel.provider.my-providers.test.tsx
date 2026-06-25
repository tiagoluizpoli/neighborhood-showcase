import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// My Providers lists the caller's owned providers. The trpc proxy keys on the
// procedure name and serves the mutable `mockProviders` fixture via initialData
// so the query resolves synchronously (no loading state under test). `Link` is
// the global test-setup stub: it renders an <a> carrying `data-to`/`data-params`,
// which the navigation assertions read.

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

// biome-ignore lint/suspicious/noExplicitAny: route component type
function renderRoute(Component: any) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

const { Route } = await import('@/routes/panel.provider.my-providers');

describe('My Providers page', () => {
  beforeEach(() => {
    mockProviders = [];
  });

  test('zero-provider empty state routes into condo-setup', () => {
    mockProviders = [];
    renderRoute(Route.options.component);

    expect(screen.getByTestId('my-providers-empty')).not.toBeNull();
    const cta = screen.getByTestId('my-providers-empty-cta');
    expect(cta.getAttribute('data-to')).toBe('/panel/provider/condo-setup');
  });

  test('populated list links each provider into its $providerId route', () => {
    mockProviders = [
      { id: 'prov-1', displayName: 'Padaria do Zé', logoUrl: null },
      { id: 'prov-2', displayName: null, logoUrl: null },
    ];
    renderRoute(Route.options.component);

    expect(screen.queryByTestId('my-providers-empty')).toBeNull();

    const cardOne = screen.getByTestId('my-providers-card-prov-1');
    expect(cardOne.getAttribute('data-to')).toBe('/panel/provider/$providerId');
    expect(cardOne.getAttribute('data-params')).toBe(
      JSON.stringify({ providerId: 'prov-1' }),
    );
    expect(cardOne.textContent).toContain('Padaria do Zé');

    // Unnamed provider falls back to the localized placeholder label.
    const cardTwo = screen.getByTestId('my-providers-card-prov-2');
    expect(cardTwo.getAttribute('data-params')).toBe(
      JSON.stringify({ providerId: 'prov-2' }),
    );
    expect(cardTwo.textContent).toContain(i18n.t('my_providers.unnamed'));
  });
});
