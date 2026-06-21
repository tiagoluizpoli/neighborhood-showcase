import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockQueryData: any = null;
let mockError = false;

mock.module('@/utils/trpc', () => ({
  trpc: {
    user: {
      getPublicProfile: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => ({
          queryKey: ['getPublicProfile', input],
          queryFn: async () => {
            if (mockError) throw new Error('Not found');
            return mockQueryData;
          },
        }),
      },
    },
  },
}));

mock.module('sonner', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { Route: ProfileRoute } = await import('./_portal.providers.$id');
ProfileRoute.useParams = (() => ({
  id: 'provider-123',
})) as typeof ProfileRoute.useParams;

function renderProfile() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = ProfileRoute.options.component as () => JSX.Element;
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('Provider Public Profile Component Visuals', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
    mockError = false;
    mockQueryData = {
      provider: {
        id: 'provider-123',
        displayName: 'Maria Silva',
        avatarUrl: 'http://localhost/maria.jpg',
        logoUrl: null,
        bannerUrl: null,
        companyName: null,
        tradeName: null,
        publicDescription: null,
        socialLinks: {
          whatsapp: '5511988888888',
          phone: '5511777777777',
          email: 'maria@example.com',
          instagram: 'maria.silva',
          tiktok: 'mariatiktok',
          facebook: 'mariafb',
          website: 'http://maria.com',
        },
        isVerified: true,
      },
      announcements: [
        {
          id: 'ad-abc',
          providerId: 'provider-123',
          condominiumId: 'condo-1',
          condoName: 'Residencial Aurora',
          condoCity: 'São Paulo',
          condoState: 'SP',
          condoNeighborhood: 'Centro',
          title: 'Aulas de Violão',
          subtitle: 'Aprenda violão do zero',
          description: 'Aulas particulares para todas as idades.',
          priceCents: 8000,
          imageUrl: 'http://localhost/guitar.jpg',
          category: 'Serviços',
          tags: ['música', 'violão'],
          contactLinks: { whatsapp: '5511988888888' },
          showVerifiedBadge: true,
          status: 'ACTIVE',
          createdAt: new Date(),
          providerName: 'Maria Silva',
          providerAvatarUrl: 'http://localhost/maria.jpg',
          cta: { primary: null, secondary: [] },
        },
      ],
    };
  });

  test('renders loading state correctly — resolves through i18n', () => {
    // The query is pending on first render, so the loading label shows.
    renderProfile();
    expect(screen.getByText('Carregando perfil do prestador...')).toBeTruthy();
  });

  test('back-to-showcase link resolves through i18n', async () => {
    renderProfile();
    expect(await screen.findByText('Voltar para a vitrine')).toBeTruthy();
  });

  test('renders 404/error state correctly', async () => {
    mockError = true;
    mockQueryData = null;
    renderProfile();
    expect(await screen.findByText('Prestador não encontrado')).toBeTruthy();
  });

  test('renders provider display name, avatar, and verified badge', async () => {
    renderProfile();
    expect(await screen.findByText('Maria Silva')).toBeTruthy();
    expect(screen.getByText('Morador verificado')).toBeTruthy();
  });

  test('renders all 7 configured contact channels on profile sidebar', async () => {
    const { container } = renderProfile();
    await screen.findByText('Maria Silva');

    const hrefs = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'),
    ).map((l) => l.getAttribute('href') ?? '');

    expect(hrefs.some((h) => h.includes('wa.me/5511988888888'))).toBe(true);
    expect(hrefs.some((h) => h.includes('tel:5511777777777'))).toBe(true);
    expect(hrefs.some((h) => h.includes('mailto:maria@example.com'))).toBe(
      true,
    );
    expect(hrefs.some((h) => h.includes('instagram.com/maria.silva'))).toBe(
      true,
    );
    expect(hrefs.some((h) => h.includes('tiktok.com/@mariatiktok'))).toBe(true);
    expect(hrefs.some((h) => h.includes('facebook.com/mariafb'))).toBe(true);
    expect(hrefs.some((h) => h.includes('http://maria.com'))).toBe(true);
  });

  test('renders grid list of announcements', async () => {
    const { container } = renderProfile();
    expect(await screen.findByText('Aulas de Violão')).toBeTruthy();
    expect(container.textContent).toContain('Residencial Aurora');
    expect(container.textContent).toContain('São Paulo');
  });

  test('renders empty state correctly', async () => {
    mockQueryData.announcements = [];
    const { container } = renderProfile();
    await screen.findByText('Maria Silva');
    expect(container.textContent).toContain(
      'Este prestador não possui anúncios ativos no momento.',
    );
  });
});
