import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

type Mode = 'data' | 'loading' | 'error';
let listMode: Mode = 'data';
// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockListPublicData: any[] = [];
// biome-ignore lint/suspicious/noExplicitAny: session varies per test
let mockSession: any = null;

const ad = {
  id: 'ann-123',
  title: 'Test Ad',
  description: 'Test Description',
  imageUrl: 'test.jpg',
  category: 'Serviços',
  categoryId: 'cat-servicos',
  contactLinks: {},
  showVerifiedBadge: false,
  condoCity: 'Florianópolis',
  condoNeighborhood: null,
  condominiumId: null,
  latitude: null,
  longitude: null,
  providerName: 'Test Provider',
  providerId: 'prov-1',
  priceCents: null,
  subtitle: null,
  cta: { primary: null, secondary: [] },
};

const listPublicOptions = () => {
  if (listMode === 'loading') {
    return {
      queryKey: ['listPublic', 'loading'],
      queryFn: () => new Promise(() => {}),
    };
  }
  if (listMode === 'error') {
    return {
      queryKey: ['listPublic', 'error'],
      queryFn: async () => {
        throw new Error('boom');
      },
    };
  }
  return {
    queryKey: ['listPublic', 'data'],
    queryFn: async () => mockListPublicData,
    initialData: mockListPublicData,
  };
};

mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    announcement: {
      listPublic: { queryOptions: () => listPublicOptions() },
      listCategories: {
        queryOptions: () => ({
          queryKey: ['listCategories'],
          queryFn: async () => [
            {
              id: 'cat-servicos',
              slug: 'servicos',
              name: 'Alimentação',
              displayOrder: 1,
              isActive: true,
            },
          ],
          initialData: [
            {
              id: 'cat-servicos',
              slug: 'servicos',
              name: 'Alimentação',
              displayOrder: 1,
              isActive: true,
            },
          ],
        }),
      },
      trackEvent: { mutationOptions: () => ({ mutationFn: async () => ({}) }) },
    },
    condominium: {
      listApproved: {
        queryOptions: () => ({
          queryKey: ['listApproved'],
          queryFn: async () => [],
          initialData: [],
        }),
      },
      listNearby: {
        queryOptions: () => ({
          queryKey: ['listNearby'],
          queryFn: async () => [],
          initialData: [],
        }),
      },
    },
  },
}));

mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: mockSession, isPending: false }),
  },
}));

mock.module('sonner', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { Route: IndexRoute } = await import('./_portal.index');

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
    writable: true,
  });
}

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = IndexRoute.options.component as () => ReactElement;
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('Home Discovery Layout Shell', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
    localStorage.clear();
    listMode = 'data';
    mockListPublicData = [ad];
    mockSession = null;
    setViewportWidth(1280);
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: () => {} },
      configurable: true,
    });
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => ({}),
    })) as unknown as typeof fetch;
  });

  test('uses a wide page shell and keeps the home section anchors', () => {
    const { container } = renderHome();
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).not.toContain('max-w-6xl');
    expect(container.querySelector('#explorar')).toBeTruthy();
    expect(container.querySelector('#como-funciona')).toBeTruthy();
    expect(container.querySelector('#anunciar')).toBeTruthy();
  });

  test('renders the compact hero band', () => {
    const { container } = renderHome();
    expect(container.textContent).toContain('Descubra perto de você');
    expect(container.textContent).toContain(
      'Explore serviços e ofertas da sua região',
    );
    expect(container.textContent).toContain(
      'Busque por categoria, condomínio ou palavra-chave e fale direto com quem anuncia.',
    );
  });

  test('groups search, location, and verified-only controls in discovery', () => {
    const { container } = renderHome();
    expect(
      container.querySelector(
        'input[placeholder="Buscar por serviços, comidas, produtos..."]',
      ),
    ).toBeTruthy();
    expect(container.textContent).toContain('Selecionar Localização');
    expect(container.textContent).toContain('Apenas moradores verificados');
  });

  test('shows the Filtros action on mobile', () => {
    setViewportWidth(375);
    const { container } = renderHome();
    expect(container.textContent).toContain('Filtros');
  });

  test('renders the visitor-first como-funciona steps with provider note', () => {
    const { container } = renderHome();
    const how = container.querySelector('#como-funciona') as HTMLElement;
    expect(how.textContent).toContain('Explore perto de você');
    expect(how.textContent).toContain('Confira quem anuncia');
    expect(how.textContent).toContain('Fale direto com o prestador');
    expect(how.textContent).toContain(
      'Quer anunciar? Publique seu serviço no painel e apareça para moradores próximos.',
    );
  });

  test('the #anunciar band swaps CTAs between guest and authenticated states', () => {
    mockSession = null;
    const guest = renderHome();
    const guestBand = guest.container.querySelector('#anunciar') as HTMLElement;
    const guestAnchors = Array.from(guestBand.querySelectorAll('a'));
    const signUp = guestAnchors.find((a) =>
      a.textContent?.includes('Anunciar serviço'),
    );
    expect(signUp?.getAttribute('data-to')).toBe('/auth');
    expect(signUp?.getAttribute('data-search')).toBe(
      JSON.stringify({ tab: 'signup' }),
    );
    const signIn = guestAnchors.find((a) =>
      a.textContent?.includes('Já tem conta? Entrar'),
    );
    expect(signIn?.getAttribute('data-to')).toBe('/auth');
    expect(signIn?.getAttribute('data-search')).toBe(
      JSON.stringify({ tab: 'signin' }),
    );
    guest.unmount();

    mockSession = { user: { id: 'test-user-123' } };
    const authed = renderHome();
    const authBand = authed.container.querySelector('#anunciar') as HTMLElement;
    expect(authBand.querySelector('[data-to="/panel/dashboard"]')).toBeTruthy();
    expect(authBand.textContent).not.toContain('Já tem conta? Entrar');
  });

  test('renders eight skeleton cards while the list is loading', () => {
    listMode = 'loading';
    const { container } = renderHome();
    const grids = container.querySelectorAll('.grid.gap-6');
    const skeletonGrid = grids[grids.length - 1] as HTMLElement;
    expect(skeletonGrid.children.length).toBe(8);
  });

  test('renders an error state with a retry action on query failure', async () => {
    listMode = 'error';
    const { container } = renderHome();
    expect(
      await screen.findByText('Não conseguimos carregar os anúncios agora.'),
    ).toBeTruthy();
    expect(container.textContent).toContain('Tentar novamente');
  });

  test('renders contextual empty-state variants', async () => {
    mockListPublicData = [];

    // 1. No filters, no announcements.
    const base = renderHome();
    expect(base.container.textContent).toContain(
      'Ainda não há anúncios publicados',
    );
    base.unmount();

    // 2. Search active.
    const search = renderHome();
    fireEvent.change(
      search.container.querySelector(
        'input[placeholder="Buscar por serviços, comidas, produtos..."]',
      ) as Element,
      { target: { value: 'pizza' } },
    );
    expect(search.container.textContent).toContain(
      'Nenhum resultado para "pizza"',
    );
    expect(search.container.textContent).toContain('Limpar busca');
    search.unmount();

    // 3. Category active.
    const category = renderHome();
    fireEvent.click(
      await within(category.container).findClickable('Alimentação'),
    );
    expect(category.container.textContent).toContain(
      'Nenhum anúncio em Alimentação',
    );
    category.unmount();

    // 4. Selected condominium filter active.
    localStorage.setItem(
      'user_condo',
      JSON.stringify({ id: 'condo-123', name: 'Residencial Floripa' }),
    );
    const condo = renderHome();
    const condoSwitch = condo.container.querySelector('#condo-filter-switch');
    if (condoSwitch) fireEvent.click(condoSwitch);
    expect(condo.container.textContent).toContain(
      'Ainda não há anúncios neste condomínio',
    );
    condo.unmount();
    localStorage.clear();

    // 5. Region active.
    localStorage.setItem(
      'user_region',
      JSON.stringify({ city: 'Florianópolis' }),
    );
    const region = renderHome();
    expect(region.container.textContent).toContain(
      'Nenhum anúncio encontrado nesta região',
    );
    region.unmount();
    localStorage.clear();

    // 6. Fresh GPS active (radius-expand option available).
    localStorage.setItem('geolocation_preference', 'granted');
    localStorage.setItem(
      'user_coords',
      JSON.stringify({
        latitude: -27.59,
        longitude: -48.54,
        capturedAt: new Date().toISOString(),
      }),
    );
    const gps = renderHome();
    expect(gps.container.textContent).toContain('Nenhum anúncio encontrado');
  });
});

// Small helper: find a clickable element (button/anchor) by its text.
function within(root: HTMLElement) {
  return {
    findClickable: async (text: string): Promise<HTMLElement> => {
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>('button, a, [role="button"]'),
      );
      const hit = nodes.find((n) => n.textContent?.includes(text));
      if (!hit) throw new Error(`No clickable with text: ${text}`);
      return hit;
    },
  };
}
