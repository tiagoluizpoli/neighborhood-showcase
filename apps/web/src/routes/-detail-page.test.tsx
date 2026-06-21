import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

const announcement = {
  id: 'ann-123',
  title: 'Delicious Pizza',
  subtitle: 'The best pizza in town',
  description: 'Freshly baked cheese pizza.',
  imageUrl: 'http://localhost/pizza.jpg',
  category: 'Alimentação',
  tags: ['pizza', 'cheese'],
  priceCents: 3500,
  contactLinks: {
    whatsapp: '5511999999999',
    phone: '5511888888888',
    email: 'pizza@example.com',
    instagram: 'pizzaria.delicia',
    tiktok: 'pizzariatiktok',
    facebook: 'pizzariafb',
    website: 'http://pizza.com',
  },
  providerId: 'provider-abc',
  providerName: 'Chef Giovanni',
  providerAvatarUrl: 'http://localhost/giovanni.jpg',
  showVerifiedBadge: true,
  // CTA model (added by T-17): the detail view passes ad.cta straight into
  // <AnnouncementCtaActions>, which dereferences cta.secondary.
  cta: { primary: null, secondary: [] },
};

// biome-ignore lint/suspicious/noExplicitAny: session shape varies per test
let mockSessionData: any = null;
mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: mockSessionData, isPending: false }),
  },
}));

mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    announcement: {
      getPublic: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['announcement', input],
          queryFn: async () => announcement,
        }),
      },
      trackEvent: {
        mutationOptions: () => ({ mutationFn: async () => ({}) }),
      },
      report: {
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

const { Route: DetailsRoute } = await import('./_portal.anuncios.$id');
DetailsRoute.useParams = (() => ({
  id: 'ann-123',
})) as typeof DetailsRoute.useParams;

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = DetailsRoute.options.component as () => JSX.Element;
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('Public Announcement Detail Component Visuals', () => {
  beforeEach(() => {
    mockSessionData = null;
  });

  test('renders provider display name and link to public profile', async () => {
    const { container } = renderDetail();

    expect(await screen.findByText('Chef Giovanni')).toBeTruthy();

    const profileLink = container.querySelector('[data-to="/providers/$id"]');
    expect(profileLink).not.toBeNull();
    expect(profileLink?.getAttribute('data-params')).toBe(
      JSON.stringify({ id: 'provider-abc' }),
    );
  });

  test('renders all 7 configured contact channels', async () => {
    const { container } = renderDetail();
    await screen.findByText('Chef Giovanni');

    const links = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'),
    );
    expect(links.length).toBeGreaterThanOrEqual(7);

    const hrefs = links.map((l) => l.getAttribute('href') ?? '');
    expect(hrefs.some((h) => h.includes('wa.me/5511999999999'))).toBe(true);
    expect(hrefs.some((h) => h.includes('tel:5511888888888'))).toBe(true);
    expect(hrefs.some((h) => h.includes('mailto:pizza@example.com'))).toBe(
      true,
    );
    expect(
      hrefs.some((h) => h.includes('instagram.com/pizzaria.delicia')),
    ).toBe(true);
    expect(hrefs.some((h) => h.includes('tiktok.com/@pizzariatiktok'))).toBe(
      true,
    );
    expect(hrefs.some((h) => h.includes('facebook.com/pizzariafb'))).toBe(true);
    expect(hrefs.some((h) => h.includes('http://pizza.com'))).toBe(true);
  });

  test('does not show Denunciar button for unauthenticated users', async () => {
    mockSessionData = null;
    const { container } = renderDetail();
    await screen.findByText('Chef Giovanni');

    expect(container.querySelector('[title="Denunciar Anúncio"]')).toBeNull();
  });

  test('shows Denunciar button for authenticated users', async () => {
    mockSessionData = { user: { id: 'user-123' } };
    const { container } = renderDetail();
    await screen.findByText('Chef Giovanni');

    expect(
      container.querySelector('[title="Denunciar Anúncio"]'),
    ).not.toBeNull();
  });
});
