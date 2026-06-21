import { describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react';

mock.module('@/utils/trpc', () => ({
  trpc: {
    assignment: {
      registerExternal: {
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

const { ProviderDashboardCondoSetupExternalFlow } = await import(
  './-provider-dashboard-condo-setup-external-flow'
);

function renderFlow() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ProviderDashboardCondoSetupExternalFlow
        onBack={() => {}}
        onRegisterSuccess={() => {}}
      />
    </QueryClientProvider>,
  );
}

describe('ProviderDashboardCondoSetupExternalFlow', () => {
  test('renders extracted external address form fields', () => {
    const { container } = renderFlow();

    expect(container.querySelector('#ext-cep')).toBeTruthy();
    expect(container.querySelector('#ext-number')).toBeTruthy();

    const submit = container.querySelector('button[type="submit"]');
    expect(submit).toBeTruthy();
    expect(submit?.textContent).toBe('Confirmar Endereço');
  });

  test('renders persisted external state values', () => {
    const { container } = renderFlow();

    const street = container.querySelector<HTMLInputElement>('#ext-street');
    expect(street).toBeTruthy();
    if (!street) throw new Error('ext-street not rendered');

    fireEvent.change(street, { target: { value: 'Rua Aurora' } });

    expect(
      container.querySelector<HTMLInputElement>('#ext-street')?.value,
    ).toBe('Rua Aurora');
  });
});
