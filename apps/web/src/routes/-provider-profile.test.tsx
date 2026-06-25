import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockQueryData: any = null;
let mockError = false;

// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockProviderProfileData: any = null;
// biome-ignore lint/suspicious/noExplicitAny: test boundary
const configMutationCalls: any[] = [];

mock.module('@/utils/trpc', () => ({
  trpcClient: {},
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
    providerProfile: {
      get: {
        queryOptions: () => ({
          queryKey: ['providerProfile.get'],
          queryFn: async () => mockProviderProfileData,
        }),
      },
      update: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        mutationOptions: (opts?: any) => ({
          // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
          mutationFn: async (vars: any) => {
            configMutationCalls.push(vars);
            return {};
          },
          ...(opts || {}),
        }),
      },
    },
  },
}));

mock.module('sonner', () => ({
  toast: { success: () => {}, error: () => {} },
}));

mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: 'u-1', name: 'Test User', role: 'USER' } },
      isPending: false,
    }),
  },
}));

mock.module('@/components/image-upload-field', () => ({
  ImageUploadField: ({ label }: { label: string }) => (
    <div data-testid="image-field">{label}</div>
  ),
}));

const { Route: ProfileRoute } = await import('./_portal.providers.$id');
ProfileRoute.useParams = (() => ({
  id: 'provider-123',
})) as typeof ProfileRoute.useParams;

const { Route: ConfigRoute } = await import('./panel/provider/configuration');

function renderConfig() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = ConfigRoute.options.component as () => ReactElement;
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

function renderProfile() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = ProfileRoute.options.component as () => ReactElement;
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

  test('renders provider display name and verified badge', async () => {
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

describe('Provider Public Profile — composition, identity mark, and fallback (T-19-05)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
    mockError = false;
    mockQueryData = {
      provider: {
        id: 'provider-123',
        displayName: 'Maria Silva',
        logoUrl: null,
        bannerUrl: null,
        companyName: null,
        tradeName: null,
        publicDescription: 'Prestadora de serviços do bairro.',
        socialLinks: { whatsapp: '5511988888888' },
        isVerified: false,
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
          subtitle: null,
          description: 'Aulas particulares para todas as idades.',
          priceCents: null,
          imageUrl: 'http://localhost/guitar.jpg',
          category: 'Serviços',
          tags: [],
          contactLinks: { whatsapp: '5511988888888' },
          showVerifiedBadge: false,
          status: 'ACTIVE',
          createdAt: new Date(),
          providerName: 'Maria Silva',
          providerAvatarUrl: null,
          cta: { primary: null, secondary: [] },
        },
      ],
    };
  });

  test('renders exactly one identity mark', async () => {
    const { container } = renderProfile();
    await screen.findByText('Maria Silva');
    const marks = container.querySelectorAll('[data-testid="identity-mark"]');
    expect(marks.length).toBe(1);
  });

  test('hero → announcements → contact order in DOM', async () => {
    const { container } = renderProfile();
    await screen.findByText('Maria Silva');

    const hero = container.querySelector('[data-testid="identity-hero"]');
    const announcements = container.querySelector(
      '[data-testid="announcements-section"]',
    );
    const contact = container.querySelector('[data-testid="contact-section"]');

    expect(hero).toBeTruthy();
    expect(announcements).toBeTruthy();
    expect(contact).toBeTruthy();

    expect(
      // biome-ignore lint/style/noNonNullAssertion: asserted above
      hero!.compareDocumentPosition(announcements!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      // biome-ignore lint/style/noNonNullAssertion: asserted above
      announcements!.compareDocumentPosition(contact!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test('sparse fallback hero is centered and shows description when no banner', async () => {
    const { container } = renderProfile();
    await screen.findByText('Maria Silva');

    const hero = container.querySelector('[data-testid="identity-hero"]');
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(hero!.className).toContain('items-center');
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(hero!.className).toContain('text-center');
    expect(
      container.textContent?.includes('Prestadora de serviços do bairro.'),
    ).toBe(true);
  });

  test('sparse fallback has full-width announcement grid', async () => {
    const { container } = renderProfile();
    await screen.findByText('Aulas de Violão');

    const grid = container.querySelector('.md\\:grid-cols-2');
    expect(grid).toBeTruthy();
  });

  test('page has max-width container', async () => {
    const { container } = renderProfile();
    await screen.findByText('Maria Silva');

    const widthCap = container.querySelector('.max-w-5xl');
    expect(widthCap).toBeTruthy();
  });

  test('announcement card link/grid contract unchanged', async () => {
    const { container } = renderProfile();
    await screen.findByText('Aulas de Violão');

    const cardLink = container.querySelector('a[data-to="/anuncios/$id"]');
    expect(cardLink).toBeTruthy();

    const grid = container.querySelector(
      '[data-testid="announcements-section"] .grid',
    );
    expect(grid).toBeTruthy();
  });

  test('with banner: hero has banner img and identity mark below it', async () => {
    mockQueryData.provider.bannerUrl = 'http://localhost/banner.jpg';
    const { container } = renderProfile();
    await screen.findByText('Maria Silva');

    const hero = container.querySelector('[data-testid="identity-hero"]');
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    const bannerImg = hero!.querySelector('img');
    expect(bannerImg).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    const mark = hero!.querySelector('[data-testid="identity-mark"]');
    expect(mark).toBeTruthy();
    // banner img appears before the mark in the hero
    expect(
      // biome-ignore lint/style/noNonNullAssertion: asserted above
      bannerImg!.compareDocumentPosition(mark!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

const baseConfigProfile = {
  displayName: 'Test Provider',
  companyName: null,
  tradeName: null,
  logoUrl: null,
  bannerUrl: null,
  logoOriginalUrl: null,
  bannerOriginalUrl: null,
  publicDescription: null,
  isProviderVisible: false,
  contactDefaults: { primaryPhone: '', callEnabled: false },
  contactMetadata: {
    email: null,
    instagram: null,
    tiktok: null,
    facebook: null,
    website: null,
  },
};

describe('Provider Configuration IA — section order, identity preview, visibility row', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
    mockProviderProfileData = { ...baseConfigProfile };
    configMutationCalls.length = 0;
  });

  test('renders page title while loading', () => {
    renderConfig();
    // Loader shown when query is pending (no initial data)
    const { container } = renderConfig();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  test('sections render in order: identity → visibility row → contact channels', async () => {
    const { container } = renderConfig();
    await screen.findByText('Perfil Público');

    const identityPreview = container.querySelector(
      '[data-testid="identity-preview"]',
    );
    const visibilityRow = container.querySelector(
      '[data-testid="visibility-row"]',
    );
    const contactHeading = screen.getByText('Canais de Contato');

    expect(identityPreview).toBeTruthy();
    expect(visibilityRow).toBeTruthy();

    // identity appears before visibility in DOM
    expect(
      // biome-ignore lint/style/noNonNullAssertion: asserted above
      identityPreview!.compareDocumentPosition(visibilityRow!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // visibility appears before contact in DOM
    expect(
      // biome-ignore lint/style/noNonNullAssertion: asserted above
      visibilityRow!.compareDocumentPosition(contactHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test('live preview renders initials when no images set', async () => {
    renderConfig();
    await screen.findByText('Perfil Público');
    const preview = screen.getByTestId('identity-preview');
    // 'T'est 'P'rovider → TP
    expect(preview.textContent).toContain('TP');
  });

  test('live preview renders logo img when logoUrl set', async () => {
    mockProviderProfileData = {
      ...baseConfigProfile,
      logoUrl: 'http://localhost/logo.jpg',
    };
    renderConfig();
    await screen.findByText('Perfil Público');
    const preview = screen.getByTestId('identity-preview');
    const img = preview.querySelector('img');
    expect(img).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    expect(img!.className).toContain('rounded-lg');
  });

  test('visibility is compact row without heavyweight Card heading', async () => {
    renderConfig();
    await screen.findByText('Perfil Público');
    // compact row testid is present
    expect(screen.getByTestId('visibility-row')).toBeTruthy();
    // old Card title 'Visibilidade Pública' is gone
    expect(screen.queryByText('Visibilidade Pública')).toBeNull();
  });

  test('visibility toggle triggers debounced auto-save mutation', async () => {
    renderConfig();
    await screen.findByText('Perfil Público');
    const toggleBtn = screen.getByTitle('Mostrar no diretório público');
    fireEvent.click(toggleBtn);
    await waitFor(
      () =>
        expect(configMutationCalls.some((c) => 'isProviderVisible' in c)).toBe(
          true,
        ),
      { timeout: 1000 },
    );
    const call = configMutationCalls.find((c) => 'isProviderVisible' in c);
    expect(call?.isProviderVisible).toBe(true);
  });
});
