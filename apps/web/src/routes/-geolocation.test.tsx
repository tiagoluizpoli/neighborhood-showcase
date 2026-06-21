import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// biome-ignore lint/suspicious/noExplicitAny: geolocation callbacks captured
let successCb: ((pos: any) => void) | null = null;
// biome-ignore lint/suspicious/noExplicitAny: geolocation callbacks captured
let errorCb: ((err: any) => void) | null = null;
let mockFetchJson: Record<string, unknown> = {};
// biome-ignore lint/suspicious/noExplicitAny: captured listPublic input
let lastListPublicInput: any = null;
// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockNearby: any[] = [];
// biome-ignore lint/suspicious/noExplicitAny: fixture mirrors API payload
let mockCondoSearch: any[] = [];

mock.module('@/utils/trpc', () => ({
  trpcClient: {},
  trpc: {
    announcement: {
      listPublic: {
        // biome-ignore lint/suspicious/noExplicitAny: test boundary mock
        queryOptions: (input: any) => {
          lastListPublicInput = input;
          return {
            queryKey: ['listPublic', input],
            queryFn: async () => [],
            initialData: [],
          };
        },
      },
      listCategories: {
        queryOptions: () => ({
          queryKey: ['listCategories'],
          queryFn: async () => [],
          initialData: [],
        }),
      },
      trackEvent: { mutationOptions: () => ({ mutationFn: async () => ({}) }) },
    },
    condominium: {
      listNearby: {
        queryOptions: () => ({
          queryKey: ['listNearby'],
          queryFn: async () => mockNearby,
          initialData: mockNearby,
        }),
      },
      listApproved: {
        queryOptions: () => ({
          queryKey: ['listApproved'],
          queryFn: async () => mockCondoSearch,
          initialData: mockCondoSearch,
        }),
      },
    },
  },
}));

mock.module('@/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null, isPending: false }) },
}));
mock.module('sonner', () => {
  const toast = Object.assign(() => {}, {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
    message: () => {},
    loading: () => {},
    dismiss: () => {},
  });
  return { toast };
});

const { Route: IndexRoute } = await import('./_portal.index');

const originalFetch = globalThis.fetch;

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Component = IndexRoute.options.component as () => JSX.Element;
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <Component />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

const setCoords = (capturedAt?: string) =>
  localStorage.setItem(
    'user_coords',
    JSON.stringify({
      latitude: -27.5969,
      longitude: -48.5495,
      ...(capturedAt ? { capturedAt } : {}),
    }),
  );

describe('Geolocation Permission Modal Flow', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
    localStorage.clear();
    successCb = null;
    errorCb = null;
    mockFetchJson = {};
    lastListPublicInput = null;
    mockNearby = [];
    mockCondoSearch = [];
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      configurable: true,
      value: {
        // biome-ignore lint/suspicious/noExplicitAny: stub signature
        getCurrentPosition: (s: any, e: any) => {
          successCb = s;
          errorCb = e;
        },
      },
    });
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => mockFetchJson,
    })) as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  test('does not auto-request geolocation on first visit', () => {
    const { container } = renderHome();
    expect(container.textContent).toContain('Todos os anúncios');
    expect(successCb).toBeNull();
    expect(errorCb).toBeNull();
  });

  test('refreshes precise location in the background after a prior grant', async () => {
    localStorage.setItem('geolocation_preference', 'granted');
    setCoords(new Date().toISOString());
    const { container } = renderHome();
    expect(typeof successCb).toBe('function');
    // Background refresh resolves with a fresh fix.
    act(() => {
      successCb?.({ coords: { latitude: -27.5969, longitude: -48.5495 } });
    });
    await waitFor(() =>
      expect(container.textContent).toContain('Perto de você'),
    );
  });

  test('does not reuse stale stored GPS for radius controls', () => {
    localStorage.setItem('geolocation_preference', 'granted');
    setCoords(new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString());
    const { container } = renderHome();
    expect(container.textContent).not.toContain(
      'Raio de busca: 10 km (Padrão)',
    );
    expect(typeof successCb).toBe('function');
  });

  test('does not request geolocation automatically after explicit denial', () => {
    localStorage.setItem('geolocation_preference', 'denied');
    const { container } = renderHome();
    expect(container.textContent).toContain('Localização desativada');
    expect(successCb).toBeNull();
    expect(errorCb).toBeNull();
  });

  test('prompts for a single nearby condominium and lets the user confirm it', async () => {
    localStorage.setItem('geolocation_preference', 'granted');
    setCoords();
    mockNearby = [
      {
        condo: {
          id: 'condo-close-id',
          name: 'Condomínio Próximo',
          city: 'Florianópolis',
          state: 'SC',
          cep: '88000001',
        },
        distance: 48.2,
      },
    ];
    renderHome();
    act(() => {
      successCb?.({ coords: { latitude: -27.5969, longitude: -48.5495 } });
    });

    fireEvent.click(await screen.findByText('Sim, sou morador(a)'));

    expect(localStorage.getItem('user_condo')).toBe(
      JSON.stringify({
        id: 'condo-close-id',
        name: 'Condomínio Próximo',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000001',
      }),
    );
  });

  test('lists multiple nearby condominiums and dismisses without context', async () => {
    localStorage.setItem('geolocation_preference', 'granted');
    setCoords();
    mockNearby = [
      {
        condo: {
          id: 'condo-close-id',
          name: 'Condomínio Próximo',
          city: 'Florianópolis',
          state: 'SC',
          cep: '88000001',
        },
        distance: 48.2,
      },
      {
        condo: {
          id: 'condo-mid-id',
          name: 'Condomínio Médio',
          city: 'Florianópolis',
          state: 'SC',
          cep: '88000002',
        },
        distance: 512.7,
      },
    ];
    renderHome();
    act(() => {
      successCb?.({ coords: { latitude: -27.5969, longitude: -48.5495 } });
    });

    // The nearby prompt is a Dialog rendered in a portal (document.body).
    expect(
      await screen.findByText('Encontramos condomínios próximos a você'),
    ).toBeTruthy();
    expect(document.body.textContent).toContain('48 m');
    expect(document.body.textContent).toContain('513 m');

    fireEvent.click(await screen.findByText('Não, continuar sem condomínio'));
    expect(localStorage.getItem('nearby_condo_prompt_dismissed')).toBe('true');
    expect(localStorage.getItem('user_condo')).toBeNull();
  });

  test('renders radius controls and toggles between 10km and 25km with a warning', () => {
    localStorage.setItem('geolocation_preference', 'granted');
    setCoords();
    const { container } = renderHome();

    expect(container.textContent).toContain('Raio de busca: 10 km (Padrão)');
    fireEvent.click(screen.getByText('Expandir para 25 km'));

    expect(container.textContent).toContain('Raio de busca: 25 km (Expandido)');
    expect(container.textContent).toContain(
      'Atenção: Prestadores a distâncias maiores (até 25 km) podem não realizar entregas ou atendimentos na sua região.',
    );
    expect(container.textContent).toContain('Voltar para 10 km');
  });

  test('keeps explicit denial wording even when an IP fallback is available', () => {
    mockFetchJson = { city: 'Florianópolis', region_code: 'SC' };
    localStorage.setItem('geolocation_preference', 'denied');
    const { container } = renderHome();
    expect(container.textContent).toContain('Localização desativada');
    expect(container.textContent).not.toContain('Região aproximada');
  });

  test('shows unavailable wording for a non-denial GPS failure without persisting denial', async () => {
    const { container } = renderHome();
    fireEvent.click(screen.getByText('Alterar'));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Usar minha localização atual (GPS)',
      }),
    );

    expect(typeof errorCb).toBe('function');
    errorCb?.({
      code: 2,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });

    await waitFor(() =>
      expect(container.textContent).toContain('Localização indisponível'),
    );
    expect(localStorage.getItem('geolocation_preference')).toBeNull();
  });

  test('manual region selection applies explicit city/neighborhood filters', async () => {
    renderHome();
    fireEvent.click(screen.getByText('Alterar'));
    // Ensure the Region tab is active, then fill its fields. The desktop
    // location popover renders its content in a portal (document.body).
    fireEvent.click(await screen.findByText('Região'));
    await waitFor(() =>
      expect(document.querySelector('#temp-city-input')).toBeTruthy(),
    );
    const cityInput =
      document.querySelector<HTMLInputElement>('#temp-city-input');
    const neighborhoodInput = document.querySelector<HTMLInputElement>(
      '#temp-neighborhood-input',
    );
    if (!cityInput || !neighborhoodInput) {
      throw new Error('region inputs not rendered');
    }

    fireEvent.change(cityInput, { target: { value: 'Florianópolis' } });
    fireEvent.change(neighborhoodInput, { target: { value: 'Centro' } });
    fireEvent.click(screen.getByText('Confirmar'));

    await waitFor(() =>
      expect(document.body.textContent).toContain('Florianópolis - Centro'),
    );
    expect(localStorage.getItem('user_region')).toBe(
      JSON.stringify({ city: 'Florianópolis', neighborhood: 'Centro' }),
    );
    expect(lastListPublicInput).toMatchObject({
      city: 'Florianópolis',
      neighborhood: 'Centro',
    });
  });
});
