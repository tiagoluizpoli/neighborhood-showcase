import { describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';
import i18n from '@/i18n';

const baseAnnouncement = {
  id: 'ad-1',
  title: 'Bolos caseiros',
  subtitle: null,
  description: 'Bolos sob encomenda para festas e aniversários.',
  priceCents: 4500,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Doces',
  categoryId: 'cat-1',
  tags: [],
  contact: { mode: 'inherit', custom: null },
  cta: { primary: null, secondary: [] },
  contactLinks: {},
  showVerifiedBadge: true,
  flaggedForReview: false,
  status: 'ACTIVE',
  paidAt: null,
  expiresAt: '2026-06-30T12:00:00.000Z',
  createdAt: '2026-06-01T12:00:00.000Z',
  suspensionReason: null,
  condoName: 'Residencial Aurora',
  providerAssignmentId: null,
} satisfies ProviderDashboardAnnouncementItem;

// @tanstack/react-router (Link/useNavigate/createFileRoute) is stubbed globally
// in test-setup.ts.

mock.module('./-provider-dashboard-state', () => ({
  useProviderDashboardState: () => ({
    activeTab: 'active',
    analyticsQuery: {
      data: { chartData: [] },
      isError: false,
      isLoading: false,
    },
    dashboardQuery: {
      data: {
        announcements: {
          active: [baseAnnouncement],
          draft: [],
          expired: [],
          suspended: [],
        },
        stats: {
          conversionRate: 20,
          totalImpressions: 15,
          totalInteractions: 3,
        },
      },
      isError: false,
      isLoading: false,
    },
    editingAd: null,
    handleEditSuccess: () => {},
    handlePay: () => {},
    handleRenew: () => {},
    period: '7d',
    renewMutation: {},
    setActiveTab: () => {},
    setEditingAd: () => {},
    setPeriod: () => {},
    setViewingAnalyticsAd: () => {},
    viewingAnalyticsAd: null,
  }),
}));

// recharts' ResponsiveContainer needs ResizeObserver, which happy-dom lacks; the
// frame's KPI/bucket labels under test render outside the chart, so stub the
// chart boundary to keep the real DOM rendering crash-free.
mock.module('@neighborhood-showcase/ui/components/chart', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
  ChartContainer: ({ children }: any) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));
// recharts is stubbed globally in test-setup.ts.

const { ProviderDashboardRouteFrame } = await import(
  './-provider-dashboard-route-frame'
);

function renderFrame() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <ProviderDashboardRouteFrame displayName="John Analytics" message="" />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('ProviderDashboardRouteFrame', () => {
  test('renders the dashboard shell with the composed content', async () => {
    await i18n.changeLanguage('pt');
    renderFrame();

    expect(screen.getByText(/John Analytics/)).toBeTruthy();
    expect(screen.getAllByText(/Visualizações/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ativo/).length).toBeGreaterThan(0);
  });
});
