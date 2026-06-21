import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockDashboardData: any = null;
const mockProviderProfileData = {
  contactDefaults: { primaryPhone: '+5511999999999', callEnabled: true },
};

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
function trpcData(method: string): any {
  switch (method) {
    case 'getDashboardData':
      return mockDashboardData;
    case 'listCategories':
      return [
        {
          id: 'cat-1',
          name: 'Test Category',
          slug: 'test-category',
          displayOrder: 1,
          isActive: true,
        },
      ];
    case 'listTagSuggestions':
      return [];
    case 'getMyAssignments':
      return [];
    case 'get':
      return mockProviderProfileData;
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
  mutationOptions: (opts?: any) => ({
    mutationFn: async () => ({}),
    ...(opts || {}),
  }),
});

const trpcProxy = new Proxy(
  {},
  {
    get: () =>
      new Proxy({}, { get: (_t, method: string) => makeMethod(method) }),
  },
);
const trpcClientProxy = new Proxy(
  {},
  {
    get: () =>
      new Proxy(
        {},
        {
          get: (_t, method: string) => ({
            query: async () => trpcData(method),
            mutate: async () => ({}),
          }),
        },
      ),
  },
);
mock.module('@/utils/trpc', () => ({
  trpc: trpcProxy,
  trpcClient: trpcClientProxy,
}));

mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: 'u', name: 'U', role: 'USER' } },
      isPending: false,
    }),
  },
}));

mock.module('sonner', () => ({
  toast: { error: () => {}, success: () => {} },
}));
mock.module('react-easy-crop', () => ({ default: () => null }));
mock.module('@neighborhood-showcase/ui/components/chart', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  ChartContainer: ({ children }: any) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));
// recharts is stubbed globally in test-setup.ts.

const mockAnnouncement = {
  id: 'ann-1',
  category: 'Test Category',
  categoryId: 'cat-1',
  condoName: 'Test Condo',
  contact: { mode: 'inherit', custom: null },
  contactLinks: { phone: '+5511999999999', whatsapp: '+5511999999999' },
  createdAt: '2024-01-01T00:00:00.000Z',
  cta: { primary: null, secondary: [] },
  description: 'Test description',
  expiresAt: null,
  flaggedForReview: false,
  imageUrl: 'http://example.com/img.jpg',
  paidAt: null,
  priceCents: null,
  providerAssignmentId: 'assign-1',
  showVerifiedBadge: false,
  status: 'ACTIVE',
  subtitle: null,
  suspensionReason: null,
  tags: [],
  title: 'Test Announcement',
};

const withAnnouncement = (
  // biome-ignore lint/suspicious/noExplicitAny: fixture override
  overrides: any = mockAnnouncement,
) => ({
  announcements: { active: [overrides], draft: [], expired: [], suspended: [] },
  stats: { totalImpressions: 0, totalInteractions: 0, conversionRate: 0 },
});

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

describe('Provider announcements routes', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
    mockDashboardData = null;
  });

  test('announcements index error state: outer wrapper has no px-6 or py-8', async () => {
    const { Route } = await import(
      '@/routes/panel.provider.announcements.index'
    );
    const { container } = renderRoute(Route.options.component);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).not.toContain('px-6');
    expect(outer.className).not.toContain('py-8');
  });

  test('announcements new: renders inside the default PanelContentContainer', async () => {
    const { Route } = await import('@/routes/panel.provider.announcements.new');
    const { container } = renderRoute(Route.options.component);
    const outer = container.firstElementChild as HTMLElement;
    // Outer element is the shared container (not a bespoke padded div).
    expect(outer.getAttribute('data-container-variant')).toBe('default');
  });

  test('announcements new: page title and subtitle resolve through i18n', async () => {
    const { Route } = await import('@/routes/panel.provider.announcements.new');
    const { container } = renderRoute(Route.options.component);
    expect(container.textContent).toContain('Novo Anúncio');
    expect(container.textContent).toContain(
      'Crie um rascunho da sua oferta e publique para seus vizinhos.',
    );
  });

  test('announcements $id: detail-header renders the announcement title', async () => {
    mockDashboardData = withAnnouncement();
    const { Route } = await import('@/routes/panel.provider.announcements.$id');
    Route.useParams = (() => ({ id: 'ann-1' })) as typeof Route.useParams;
    const { container } = renderRoute(Route.options.component);

    expect(
      (await screen.findAllByText('Test Announcement')).length,
    ).toBeGreaterThan(0);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.getAttribute('data-container-variant')).toBe('default');
  });

  test('announcements $id edit: inherited contact mode is wired into the authoring section', async () => {
    mockDashboardData = withAnnouncement();
    const { Route } = await import('@/routes/panel.provider.announcements.$id');
    Route.useParams = (() => ({ id: 'ann-1' })) as typeof Route.useParams;
    const { container } = renderRoute(Route.options.component);

    fireEvent.click(await screen.findByText('Editar anúncio'));

    expect(
      container.querySelector('[data-testid="contact-mode-inherit-badge"]'),
    ).toBeTruthy();
  });

  test('announcements $id edit: custom contact phone is wired into the authoring section', async () => {
    mockDashboardData = withAnnouncement({
      ...mockAnnouncement,
      contact: {
        mode: 'custom',
        custom: { primaryPhone: '+5511888888888', callEnabled: false },
      },
      contactLinks: { whatsapp: '+5511888888888' },
    });
    const { Route } = await import('@/routes/panel.provider.announcements.$id');
    Route.useParams = (() => ({ id: 'ann-1' })) as typeof Route.useParams;
    const { container } = renderRoute(Route.options.component);

    fireEvent.click(await screen.findByText('Editar anúncio'));

    const phone = container.querySelector<HTMLInputElement>(
      '#custom-contact-phone',
    );
    expect(phone?.value).toBe('+5511888888888');
  });
});
