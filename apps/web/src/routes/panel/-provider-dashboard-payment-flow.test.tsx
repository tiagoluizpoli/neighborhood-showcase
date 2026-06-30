import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

// biome-ignore lint/suspicious/noExplicitAny: payloads captured for assertion
const mutateCalls: any[] = [];

mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    announcement: {
      getPaymentDetails: {
        mutationOptions: () => ({
          // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
          mutationFn: async (payload: any) => {
            mutateCalls.push(payload);
            return {
              pixQrCode: 'data:image/png;base64,qr',
              pixCopyPaste: '000201010212',
            };
          },
        }),
      },
      getPaymentStatus: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['payment-status', input],
          queryFn: async () => ({ status: 'PENDING' }),
        }),
      },
    },
  },
}));

mock.module('sonner', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { ProviderDashboardPaymentFlow } = await import(
  './-provider-dashboard-payment-flow'
);

const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;

function renderFlow() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ProviderDashboardPaymentFlow announcementId="announcement-123" />
    </QueryClientProvider>,
  );
}

describe('ProviderDashboardPaymentFlow', () => {
  beforeEach(() => {
    mutateCalls.length = 0;
    // Neutralise the countdown timer so it cannot fire during assertions.
    globalThis.setInterval = mock(() => 1) as unknown as typeof setInterval;
    globalThis.clearInterval = mock(
      () => {},
    ) as unknown as typeof clearInterval;
  });

  afterAll(() => {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  });

  test('requests payment details and renders the pix surface', async () => {
    const { container } = renderFlow();

    // The mount effect requests payment details for this announcement.
    await waitFor(() => {
      expect(mutateCalls).toEqual([{ announcementId: 'announcement-123' }]);
    });

    // Once details resolve, the pix copy-paste surface renders.
    expect(await screen.findByText('Copiar Código Pix')).toBeTruthy();
    expect(container.querySelector('#pix-copia-cola')).toBeTruthy();
  }, 5000);
});
