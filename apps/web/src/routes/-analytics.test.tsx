import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as RealRouter from '@tanstack/react-router';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { createElement, StrictMode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// biome-ignore lint/suspicious/noExplicitAny: captured trackEvent payloads
const trackCalls: any[] = [];
let currentId = 'ann-123';

// Complete router mock (spreads the real module so no named export is dropped
// for other files) with a navigate spy so card-click navigation is assertable.
const navigate = mock(
  (_opts: { to: string; params?: Record<string, unknown> }) => {},
);
mock.module('@tanstack/react-router', () => ({
  ...RealRouter,
  // biome-ignore lint/suspicious/noExplicitAny: test boundary stub
  Link: (props: any) => {
    const { to, hash, search, params, children, ...rest } = props;
    return createElement(
      'a',
      {
        ...rest,
        'data-to': to,
        'data-hash': hash,
        'data-params': params ? JSON.stringify(params) : undefined,
        'data-search': search ? JSON.stringify(search) : undefined,
      },
      children,
    );
  },
  useNavigate: () => navigate,
  Outlet: () => null,
}));

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
const detailAd = (id: string): any => ({
  id,
  title: 'Test Ad',
  subtitle: 'Sub',
  description: 'Test Description',
  imageUrl: 'test.jpg',
  category: 'Serviços',
  tags: [],
  priceCents: null,
  contactLinks: {},
  providerId: 'provider-1',
  providerName: 'Test Provider',
  providerAvatarUrl: null,
  showVerifiedBadge: false,
  cta: { primary: null, secondary: [] },
});

const listAd = {
  ...detailAd('ann-123'),
  condoCity: 'Florianópolis',
  condoNeighborhood: null,
  condominiumId: null,
  latitude: null,
  longitude: null,
};

mock.module('@/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null, isPending: false }) },
}));

mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    announcement: {
      getPublic: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['getPublic', input],
          queryFn: async () => detailAd(currentId),
        }),
      },
      trackEvent: {
        mutationOptions: () => ({
          // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
          mutationFn: async (payload: any) => {
            trackCalls.push(payload);
            return {};
          },
        }),
      },
      listPublic: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['listPublic', input],
          queryFn: async () => [listAd],
        }),
      },
      listCategories: {
        queryOptions: () => ({
          queryKey: ['listCategories'],
          queryFn: async () => [
            {
              id: 'cat-servicos',
              slug: 'servicos',
              name: 'Serviços',
              displayOrder: 1,
              isActive: true,
            },
          ],
        }),
      },
    },
    condominium: {
      listApproved: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['listApproved', input],
          queryFn: async () => [],
        }),
      },
      listNearby: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['listNearby', input],
          queryFn: async () => [],
        }),
      },
    },
  },
}));

mock.module('sonner', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { Route: DetailsRoute } = await import('./_portal.anuncios.$id');
const { Route: IndexRoute } = await import('./_portal.index');
DetailsRoute.useParams = (() => ({
  id: currentId,
})) as typeof DetailsRoute.useParams;

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderDetail(strict = false) {
  const Component = DetailsRoute.options.component as () => ReactElement;
  const tree = (
    <QueryClientProvider client={makeClient()}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

function renderIndex() {
  const Component = IndexRoute.options.component as () => ReactElement;
  return render(
    <QueryClientProvider client={makeClient()}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

const impressionCalls = () =>
  trackCalls.filter((c) => c?.eventType === 'IMPRESSION');

describe('Analytics Impression Tracking tests', () => {
  beforeEach(() => {
    trackCalls.length = 0;
    currentId = 'ann-123';
    navigate.mockClear();
  });

  test('Detail component tracks impression exactly once on initial load', async () => {
    renderDetail();
    await waitFor(() => expect(impressionCalls().length).toBe(1));
    expect(impressionCalls()[0]).toEqual({
      announcementId: 'ann-123',
      eventType: 'IMPRESSION',
    });
  });

  test('useRef guard prevents double-counting under StrictMode', async () => {
    renderDetail(true);
    await waitFor(() => expect(impressionCalls().length).toBe(1));
    // Give any double-invoked effect a chance to (incorrectly) fire again.
    await Promise.resolve();
    expect(impressionCalls().length).toBe(1);
  });

  test('Navigating away and back (re-visit) counts as a new impression', async () => {
    renderDetail();
    await waitFor(() => expect(impressionCalls().length).toBe(1));

    cleanup();

    renderDetail();
    await waitFor(() => expect(impressionCalls().length).toBe(2));
  });

  test('Changing the announcement id tracks a new impression', async () => {
    const { rerender } = renderDetail();
    await waitFor(() => expect(impressionCalls().length).toBe(1));

    currentId = 'ann-456';
    const Component = DetailsRoute.options.component as () => ReactElement;
    rerender(
      <QueryClientProvider client={makeClient()}>
        <I18nextProvider i18n={i18n}>
          <Component />
        </I18nextProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(impressionCalls().length).toBe(2));
    expect(impressionCalls()[1]).toEqual({
      announcementId: 'ann-456',
      eventType: 'IMPRESSION',
    });
  });

  test('Vitrine grid card click does not track an IMPRESSION event', async () => {
    renderIndex();
    const card = await screen.findByRole('button', { name: /Test Ad/ });

    fireEvent.click(card);

    expect(impressionCalls().length).toBe(0);
  });

  test('Vitrine grid card click navigates to the details route', async () => {
    renderIndex();
    const card = await screen.findByRole('button', { name: /Test Ad/ });

    navigate.mockClear();
    fireEvent.click(card);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).toEqual({
      to: '/anuncios/$id',
      params: { id: 'ann-123' },
    });
  });
});
