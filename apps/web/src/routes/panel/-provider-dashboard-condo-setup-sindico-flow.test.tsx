import { describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react';

mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    condominium: {
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

const { ProviderDashboardCondoSetupSindicoFlow } = await import(
  './-provider-dashboard-condo-setup-sindico-flow'
);

function renderFlow() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ProviderDashboardCondoSetupSindicoFlow
        onBack={() => {}}
        onSuccess={() => {}}
      />
    </QueryClientProvider>,
  );
}

describe('ProviderDashboardCondoSetupSindicoFlow', () => {
  test('renders core condo registration fields', () => {
    const { container } = renderFlow();

    expect(container.querySelector('#condo-name')).toBeTruthy();
    expect(container.querySelector('#condo-cep')).toBeTruthy();
    expect(container.querySelector('#condo-email')).toBeTruthy();
    expect(container.querySelector('#file-upload')).toBeTruthy();

    const submit = container.querySelector('button[type="submit"]');
    expect(submit).toBeTruthy();
    expect(submit?.textContent).toBe('Solicitar Aprovação');
  });

  test('renders persisted form values', () => {
    const { container } = renderFlow();

    const name = container.querySelector<HTMLInputElement>('#condo-name');
    const email = container.querySelector<HTMLInputElement>('#condo-email');
    expect(name).toBeTruthy();
    expect(email).toBeTruthy();
    if (!name || !email) throw new Error('condo fields not rendered');

    fireEvent.change(name, { target: { value: 'Condomínio Aurora' } });
    fireEvent.change(email, { target: { value: 'admin@condo.com' } });

    expect(
      container.querySelector<HTMLInputElement>('#condo-name')?.value,
    ).toBe('Condomínio Aurora');
    expect(
      container.querySelector<HTMLInputElement>('#condo-email')?.value,
    ).toBe('admin@condo.com');
  });
});
