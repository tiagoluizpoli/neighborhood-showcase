import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// condo-setup is the repeatable create-provider flow (T-20-05/ST-04). The gate
// under test: a caller who already owns a provider always sees the create
// selector (so they can create the Nth provider), while the legacy per-user
// status panels only serve the first-time, pre-provider state. The trpc proxy
// keys on the leaf procedure name and serves the mutable fixtures via
// initialData so queries resolve synchronously. flow defaults to 'select', so
// the per-flow child components (which issue their own queries/mutations) are
// never mounted here.

// biome-ignore lint/suspicious/noExplicitAny: fixtures mirror API payloads
let mockOwnedProviders: any = [];
// biome-ignore lint/suspicious/noExplicitAny: fixtures mirror API payloads
let mockAssignments: any = [];
// biome-ignore lint/suspicious/noExplicitAny: fixtures mirror API payloads
let mockMyCondo: any = null;

// biome-ignore lint/suspicious/noExplicitAny: fixtures mirror API payloads
function trpcData(method: string): any {
  switch (method) {
    case 'listMine':
      return mockOwnedProviders;
    case 'getMyAssignments':
      return mockAssignments;
    case 'myCreated':
      return mockMyCondo;
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
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  mutationOptions: (opts?: any) => ({ ...(opts || {}) }),
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

const { Route } = await import('@/routes/panel.provider.condo-setup');

describe('Condo setup repeatable create flow', () => {
  beforeEach(() => {
    mockOwnedProviders = [];
    mockAssignments = [];
    mockMyCondo = null;
  });

  test('owner with a provider sees the create selector, not the status panel', () => {
    mockOwnedProviders = [
      { id: 'prov-1', displayName: 'Padaria', logoUrl: null },
    ];
    // An APPROVED assignment would, in the legacy model, force the status panel.
    mockAssignments = [
      { status: 'APPROVED', condominium: { name: 'Condo X' } },
    ];

    renderRoute(Route.options.component);

    // Create selector is shown (the three flow entry buttons).
    expect(screen.getByText('Cadastrar Endereço')).not.toBeNull();
    // The legacy approved-status panel is NOT shown for a provider owner.
    expect(screen.queryByText('Associação Aprovada!')).toBeNull();
  });

  test('first-time caller with no providers still sees the status panel', () => {
    mockOwnedProviders = [];
    mockAssignments = [
      { status: 'APPROVED', condominium: { name: 'Condo X' } },
    ];

    renderRoute(Route.options.component);

    // Pre-provider state keeps the legacy status panel.
    expect(screen.getByText('Associação Aprovada!')).not.toBeNull();
    expect(screen.queryByText('Cadastrar Endereço')).toBeNull();
  });
});
