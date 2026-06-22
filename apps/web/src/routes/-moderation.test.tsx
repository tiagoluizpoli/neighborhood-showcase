import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// biome-ignore lint/suspicious/noExplicitAny: fixture shape mirrors API payload
let reportedData: any[] = [];

mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    announcement: {
      listReported: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['listReported', input],
          queryFn: async () => reportedData,
        }),
      },
      dismissReports: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        mutationOptions: (opts: any) => ({
          mutationFn: async () => ({}),
          ...opts,
        }),
      },
      suspend: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        mutationOptions: (opts: any) => ({
          mutationFn: async () => ({}),
          ...opts,
        }),
      },
    },
    admin: {
      banProvider: {
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

const { Route: ReportsRoute } = await import('./panel/moderation/reports');
const { Route: IndexRoute } = await import('./panel/moderation/index');

// biome-ignore lint/suspicious/noExplicitAny: route context driven directly
let mockRouteContext: any = { isSystemManager: true };
ReportsRoute.useRouteContext = (() =>
  mockRouteContext) as typeof ReportsRoute.useRouteContext;

function renderReports() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = ReportsRoute.options.component as () => ReactElement;
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('Moderation Reports Section', () => {
  beforeEach(async () => {
    mockRouteContext = { isSystemManager: true };
    await i18n.changeLanguage('pt');
    reportedData = [
      {
        id: 'rep-ad-1',
        title: 'Reported Ad Title',
        imageUrl: 'http://localhost/rep-ad.jpg',
        status: 'ACTIVE',
        suspensionReason: null,
        createdAt: new Date(),
        providerId: 'provider-1',
        providerName: 'John Spam',
        providerEmail: 'john@spam.com',
        totalReports: 5,
        reasonBreakdown: {
          FRAUDE_GOLPE: 3,
          ASSEDIO_OFENSIVO: 2,
          SPAM: 0,
          SERVICO_ILEGAL: 0,
          OUTROS: 0,
        },
        reports: [
          {
            id: 'report-a',
            reporterName: 'Reporter A',
            reporterEmail: 'repa@example.com',
            reason: 'FRAUDE_GOLPE',
            createdAt: new Date(),
          },
        ],
      },
    ];
  });

  test('displays reported announcements with counts and reasons', async () => {
    renderReports();

    expect(await screen.findByText('Reported Ad Title')).toBeTruthy();
    expect(screen.getByText('John Spam')).toBeTruthy();
    expect(screen.getByText(/john@spam\.com/)).toBeTruthy();
  });

  test('ban provider button is visible to SYSTEM_MANAGER and hidden otherwise', async () => {
    // 1. System manager sees the ban action ("Banir Prestador").
    mockRouteContext = { isSystemManager: true };
    renderReports();
    expect(await screen.findByText('Banir Prestador')).toBeTruthy();

    cleanup();

    // 2. Non system manager does not, even once the queue has loaded.
    mockRouteContext = { isSystemManager: false };
    renderReports();
    await screen.findByText('Reported Ad Title');
    expect(screen.queryByText('Banir Prestador')).toBeNull();
  });
});

describe('Moderation Index Redirect', () => {
  // biome-ignore lint/suspicious/noExplicitAny: context shape driven directly
  const runBeforeLoad = (context: any): any => {
    try {
      // biome-ignore lint/style/noNonNullAssertion: beforeLoad is defined
      IndexRoute.options.beforeLoad!({ context } as never);
    } catch (redirectResult) {
      return redirectResult;
    }
    return null;
  };

  test('redirects a moderator with assignments to the residents queue', () => {
    const result = runBeforeLoad({
      isSystemManager: false,
      moderatorAssignments: [{ condominiumId: 'condo-1' }],
    });
    expect(result?.options?.to).toBe('/panel/moderation/residents');
  });

  test('redirects a system manager without assignments to the reports queue', () => {
    const result = runBeforeLoad({
      isSystemManager: true,
      moderatorAssignments: [],
    });
    expect(result?.options?.to).toBe('/panel/moderation/reports');
  });
});
