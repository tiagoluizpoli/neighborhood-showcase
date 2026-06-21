import { describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';

const approvedCondos = [
  {
    id: 'condo-1',
    name: 'Residencial Aurora',
    city: 'Sao Paulo',
    state: 'SP',
    cep: '01000-000',
  },
];

mock.module('@/utils/trpc', () => ({
  trpc: {
    condominium: {
      listApproved: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['condos', input],
          queryFn: async () => approvedCondos,
        }),
      },
    },
    assignment: {
      request: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        mutationOptions: (opts: any) => ({
          mutationFn: async () => ({}),
          ...opts,
        }),
      },
    },
  },
}));

mock.module('sonner', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { ProviderDashboardCondoSetupResidentFlow } = await import(
  './-provider-dashboard-condo-setup-resident-flow'
);

function renderFlow() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ProviderDashboardCondoSetupResidentFlow
        onBack={() => {}}
        onRequestSuccess={() => {}}
      />
    </QueryClientProvider>,
  );
}

describe('ProviderDashboardCondoSetupResidentFlow', () => {
  test('renders condo search results before selection', async () => {
    const { container } = renderFlow();

    expect(container.querySelector('#search-condo')).toBeTruthy();
    // Approved condos come from the query and render as selectable results.
    expect(await screen.findByText('Residencial Aurora')).toBeTruthy();
  });

  test('renders selected condo form state', async () => {
    const { container } = renderFlow();

    // Select a condo to advance into the request form.
    fireEvent.click(await screen.findByText('Residencial Aurora'));

    const unit = container.querySelector<HTMLInputElement>('#unit-info');
    expect(unit).toBeTruthy();
    if (!unit) throw new Error('unit-info not rendered');

    fireEvent.change(unit, { target: { value: 'Bloco B' } });
    expect(container.querySelector<HTMLInputElement>('#unit-info')?.value).toBe(
      'Bloco B',
    );

    const submit = container.querySelector('button[type="submit"]');
    expect(submit?.textContent).toBe('Solicitar Acesso');
  });
});
