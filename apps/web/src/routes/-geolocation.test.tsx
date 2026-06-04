// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals and browser APIs requires explicit any
import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

// Setup global window / localstorage / geolocation mock
let _mockGeolocationSuccessCallback: ((pos: any) => void) | null = null;
let _mockGeolocationErrorCallback: ((err: any) => void) | null = null;
let savedItems: Record<string, string | null> = {};
let mockFetchJson: Record<string, unknown> = {};
let lastListPublicInput: Record<string, unknown> | null = null;
let mockNearbyCondoResults: Array<{
  condo: {
    id: string;
    name: string;
    city: string;
    state: string;
    cep: string;
  };
  distance: number;
}> = [];
let mockCondoSearchResults: Array<{
  id: string;
  name: string;
  city: string;
  state: string;
  cep: string;
}> = [];

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: {
    pathname: '/',
  },
  history: {
    pushState: () => {},
  },
  navigator: {
    maxTouchPoints: 0,
    platform: 'Linux x86_64',
    userAgent: 'bun-test',
    vendor: 'Google Inc.',
    geolocation: {
      getCurrentPosition: (success: any, error: any) => {
        _mockGeolocationSuccessCallback = success;
        _mockGeolocationErrorCallback = error;
      },
    },
  },
} as any;

(global as typeof globalThis & { navigator?: unknown }).navigator =
  global.window.navigator;

global.localStorage = {
  getItem: (key: string) => savedItems[key] || null,
  setItem: (key: string, value: string) => {
    savedItems[key] = value;
  },
  removeItem: (key: string) => {
    delete savedItems[key];
  },
  clear: () => {
    savedItems = {};
  },
  length: 0,
  key: () => null,
};

global.fetch = async () =>
  ({
    ok: true,
    json: async () => mockFetchJson,
  }) as any;

// Hook simulation state
let hookIndex = 0;
const hookState: any[] = [];
const activeEffects: (() => void)[] = [];

const resetHookState = () => {
  hookIndex = 0;
  hookState.length = 0;
  activeEffects.length = 0;
  savedItems = {};
  mockFetchJson = {};
  lastListPublicInput = null;
  mockNearbyCondoResults = [];
  mockCondoSearchResults = [];
  _mockGeolocationSuccessCallback = null;
  _mockGeolocationErrorCallback = null;
};

const renderComponent = (Component: () => any) => {
  hookIndex = 0;
  activeEffects.length = 0;
  const result = Component();
  // Run all registered effects
  for (const effect of activeEffects) {
    effect();
  }
  return result;
};

const getNodeText = (node: any): string => {
  if (node == null || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }

  return getNodeText(node.props?.children);
};

const findNodeByText = (node: any, text: string): any | null => {
  if (node == null || typeof node === 'boolean') {
    return null;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).includes(text) ? node : null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNodeByText(child, text);
      if (match) return match;
    }
    return null;
  }

  const currentText = getNodeText(node.props?.children);
  if (currentText.includes(text)) {
    return node;
  }

  const children = node.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const match = findNodeByText(child, text);
      if (match) return match;
    }
  } else if (children) {
    return findNodeByText(children, text);
  }

  return null;
};

const findClickableNodeByText = (node: any, text: string): any | null => {
  if (node == null || typeof node === 'boolean') {
    return null;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findClickableNodeByText(child, text);
      if (match) return match;
    }
    return null;
  }

  if (
    typeof node.props?.onClick === 'function' &&
    getNodeText(node.props?.children).includes(text)
  ) {
    return node;
  }

  const children = node.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const match = findClickableNodeByText(child, text);
      if (match) return match;
    }
  } else if (children) {
    return findClickableNodeByText(children, text);
  }

  return null;
};

const findNode = (node: any, predicate: (candidate: any) => boolean): any => {
  if (node == null || typeof node === 'boolean') {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNode(child, predicate);
      if (match) return match;
    }
    return null;
  }

  if (typeof node === 'object' && predicate(node)) {
    return node;
  }

  return findNode(node.props?.children, predicate);
};

// Mock react while preserving its internals and JSX runtime dependencies
mock.module('react', () => ({
  ...RealReact,
  useCallback: (fn: any, _deps: any[]) => fn,
  useEffect: (callback: () => void, _deps: any[]) => {
    activeEffects.push(callback);
  },
  useRef: (initialValue: any) => {
    const idx = hookIndex++;
    if (hookState[idx] === undefined) {
      hookState[idx] = { current: initialValue };
    }
    return hookState[idx];
  },
  useState: (initialValue: any) => {
    const idx = hookIndex++;
    if (hookState[idx] === undefined) {
      const stateContainer = {
        value:
          typeof initialValue === 'function' ? initialValue() : initialValue,
        setValue: (newVal: any) => {
          if (typeof newVal === 'function') {
            stateContainer.value = newVal(stateContainer.value);
          } else {
            stateContainer.value = newVal;
          }
          hookState[idx][0] = stateContainer.value;
        },
      };
      hookState[idx] = [stateContainer.value, stateContainer.setValue];
    }
    return hookState[idx];
  },
}));

const mockNavigate = mock(() => {});
mock.module('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: any) => ({
    options,
    useRouteContext: () => ({}),
    useSearch: () => ({}),
    useParams: () => ({}),
  }),
  Link: (props: any) => {
    const { to, params, children, ...rest } = props;
    return (
      <a {...rest} data-to={to} data-params={JSON.stringify(params)}>
        {children}
      </a>
    );
  },
  useNavigate: () => mockNavigate,
}));

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'location.change': 'Alterar',
        'location.clear': 'Limpar localização',
        'location.condo_empty': 'Nenhum condomínio aprovado encontrado.',
        'location.condo_placeholder':
          'Buscar condomínio pelo nome, cidade ou CEP',
        'location.denied': 'Localização desativada',
        'location.err_permission_denied': 'Localização desativada',
        'location.err_position_unavailable':
          'Não conseguimos encontrar sua localização agora',
        'location.err_timeout': 'A localização demorou para responder',
        'location.err_unsupported': 'Localização indisponível neste navegador',
        'location.fresh_gps': 'Perto de você',
        'location.ip_fallback': 'Região aproximada',
        'location.modal_desc': 'Escolha como deseja personalizar o feed:',
        'location.modal_title': 'Selecionar Localização',
        'location.nearby_dismissed':
          'Tudo bem. Você pode continuar navegando sem vincular um condomínio.',
        'location.nearby_single_title': `Você mora no Condomínio ${params?.name}?`,
        'location.no_signal': 'Todos os anúncios',
        'location.city_placeholder': 'Digite a cidade',
        'location.city_example': 'Ex: Florianópolis',
        'location.neighborhood_placeholder': 'Digite o bairro (opcional)',
        'location.neighborhood_example': 'Ex: Centro',
        'location.option_condo_desc':
          'Define um condomínio específico para priorizar no feed.',
        'location.option_gps': 'Usar minha localização atual (GPS)',
        'location.option_gps_desc':
          'Ordena anúncios pela proximidade exata de você.',
        'location.option_region_desc':
          'Filtra anúncios por uma cidade e bairro específicos.',
        'location.refreshing_gps': 'Perto da última localização',
        'location.radius_expand': 'Expandir para 25 km',
        'location.radius_expanded': 'Raio de busca: 25 km (Expandido)',
        'location.radius_expanded_desc':
          'Atenção: Prestadores a distâncias maiores (até 25 km) podem não realizar entregas ou atendimentos na sua região.',
        'location.radius_shrink': 'Voltar para 10 km',
        'location.radius_standard': 'Raio de busca: 10 km (Padrão)',
        'location.radius_standard_desc':
          'Procurando prestadores e condomínios próximos em Florianópolis e região.',
        'location.selected_condo': 'Condomínio selecionado',
        'location.stale_gps_fail': 'Última localização conhecida',
        'location.tab_condo': 'Condomínio',
        'location.tab_region': 'Região',
        'location.unavailable': 'Localização indisponível',
        'moderation.confirm': 'Confirmar',
      };

      return translations[key] ?? key;
    },
  }),
}));

// Mock @tanstack/react-query
mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useQuery: (options: any) => {
    const queryKey = JSON.stringify(options?.queryKey ?? options ?? {});
    if (queryKey.includes('listNearby')) {
      return {
        data: mockNearbyCondoResults,
        isLoading: false,
      };
    }

    if (queryKey.includes('listApproved')) {
      return {
        data: mockCondoSearchResults,
        isLoading: false,
      };
    }

    if (queryKey.includes('listPublic')) {
      lastListPublicInput = JSON.parse(queryKey)[1]?.input ?? null;
    }

    return {
      data: [],
      isLoading: false,
    };
  },
  useMutation: () => ({
    mutate: () => {},
  }),
}));

const { Route: IndexRoute } = await import('./_portal.index');

describe('Geolocation Permission Modal Flow', () => {
  beforeEach(() => {
    resetHookState();
  });

  test('does not auto-open geolocation prompt on first visit', () => {
    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    expect(findNodeByText(tree, 'Todos os anúncios')).toBeTruthy();
    expect(findNodeByText(tree, 'Descubra serviços perto de você')).toBeNull();
    expect(_mockGeolocationSuccessCallback).toBeNull();
    expect(_mockGeolocationErrorCallback).toBeNull();
  });

  test('refreshes precise location in the background after prior grant', () => {
    global.localStorage.setItem('geolocation_preference', 'granted');
    global.localStorage.setItem(
      'user_coords',
      JSON.stringify({
        latitude: -27.5969,
        longitude: -48.5495,
        capturedAt: new Date().toISOString(),
      }),
    );

    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    expect(findNodeByText(tree, 'Perto de você')).toBeTruthy();
    expect(findNodeByText(tree, 'Descubra serviços perto de você')).toBeNull();
    expect(_mockGeolocationSuccessCallback).toBeFunction();
    expect(_mockGeolocationErrorCallback).toBeFunction();
  });

  test('does not reuse stale stored GPS for radius controls', () => {
    global.localStorage.setItem('geolocation_preference', 'granted');
    global.localStorage.setItem(
      'user_coords',
      JSON.stringify({
        latitude: -27.5969,
        longitude: -48.5495,
        capturedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      }),
    );

    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    expect(findNodeByText(tree, 'Raio de busca: 10 km (Padrão)')).toBeNull();
    expect(_mockGeolocationSuccessCallback).toBeFunction();
    expect(_mockGeolocationErrorCallback).toBeFunction();
  });

  test('does not request geolocation automatically after explicit denial', () => {
    global.localStorage.setItem('geolocation_preference', 'denied');
    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    expect(findNodeByText(tree, 'Localização desativada')).toBeTruthy();
    expect(findNodeByText(tree, 'Descubra serviços perto de você')).toBeNull();
    expect(_mockGeolocationSuccessCallback).toBeNull();
    expect(_mockGeolocationErrorCallback).toBeNull();
  });

  test('Prompts for a nearby condominium and lets the user confirm it', () => {
    global.localStorage.setItem('geolocation_preference', 'granted');
    global.localStorage.setItem(
      'user_coords',
      JSON.stringify({
        latitude: -27.5969,
        longitude: -48.5495,
      }),
    );

    mockNearbyCondoResults = [
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

    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    expect(
      findNodeByText(tree, 'Você mora no Condomínio Condomínio Próximo?'),
    ).toBeTruthy();
    expect(findNodeByText(tree, 'Sim, sou morador(a)')).toBeTruthy();

    const confirmButton = findClickableNodeByText(tree, 'Sim, sou morador(a)');
    expect(confirmButton).toBeTruthy();
    confirmButton.props.onClick();

    expect(hookState[0][0]).toEqual({
      id: 'condo-close-id',
      name: 'Condomínio Próximo',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000001',
    });
    expect(global.localStorage.getItem('user_condo')).toBe(
      JSON.stringify({
        id: 'condo-close-id',
        name: 'Condomínio Próximo',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000001',
      }),
    );
    expect(
      global.localStorage.getItem('nearby_condo_prompt_dismissed'),
    ).toBeNull();
  });

  test('Lists multiple nearby condominiums and dismisses without context', () => {
    global.localStorage.setItem('geolocation_preference', 'granted');
    global.localStorage.setItem(
      'user_coords',
      JSON.stringify({
        latitude: -27.5969,
        longitude: -48.5495,
      }),
    );

    mockNearbyCondoResults = [
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

    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    expect(
      findNodeByText(tree, 'Encontramos condomínios próximos a você'),
    ).toBeTruthy();
    expect(findNodeByText(tree, '48 m')).toBeTruthy();
    expect(findNodeByText(tree, '513 m')).toBeTruthy();

    const dismissButton = findClickableNodeByText(
      tree,
      'Não, continuar sem condomínio',
    );
    expect(dismissButton).toBeTruthy();
    dismissButton.props.onClick();

    expect(hookState[0][0]).toBeNull();
    expect(global.localStorage.getItem('user_condo')).toBeNull();
    expect(global.localStorage.getItem('nearby_condo_prompt_dismissed')).toBe(
      'true',
    );

    const _rerendered = renderComponent(component);
    expect(global.localStorage.getItem('nearby_condo_prompt_dismissed')).toBe(
      'true',
    );
    expect(hookState[0][0]).toBeNull();
  });

  test('Renders radius controls when geolocation is granted, lets the user toggle between 10km and 25km, and shows the warning', () => {
    global.localStorage.setItem('geolocation_preference', 'granted');
    global.localStorage.setItem(
      'user_coords',
      JSON.stringify({
        latitude: -27.5969,
        longitude: -48.5495,
      }),
    );

    const component = IndexRoute.options.component;
    let tree = renderComponent(component);

    // Should render radius standard text initially (10 km)
    expect(findNodeByText(tree, 'Raio de busca: 10 km (Padrão)')).toBeTruthy();
    expect(findNodeByText(tree, 'Expandir para 25 km')).toBeTruthy();

    const expandButton = findClickableNodeByText(tree, 'Expandir para 25 km');
    expect(expandButton).toBeTruthy();
    expandButton.props.onClick();

    // Rerender and check if it now shows 25 km and the warning text
    tree = renderComponent(component);
    expect(
      findNodeByText(tree, 'Raio de busca: 25 km (Expandido)'),
    ).toBeTruthy();
    expect(
      findNodeByText(
        tree,
        'Atenção: Prestadores a distâncias maiores (até 25 km) podem não realizar entregas ou atendimentos na sua região.',
      ),
    ).toBeTruthy();
    expect(findNodeByText(tree, 'Voltar para 10 km')).toBeTruthy();
  });

  test('keeps explicit denial wording even when IP fallback is available', async () => {
    mockFetchJson = {
      city: 'Florianópolis',
      region_code: 'SC',
    };
    global.localStorage.setItem('geolocation_preference', 'denied');

    const component = IndexRoute.options.component;
    let tree = renderComponent(component);
    await Promise.resolve();
    tree = renderComponent(component);

    expect(findNodeByText(tree, 'Localização desativada')).toBeTruthy();
    expect(findNodeByText(tree, 'Região aproximada')).toBeNull();
  });

  test('shows unavailable wording for non-denial geolocation failure and does not persist denial', async () => {
    mockFetchJson = {
      city: 'Florianópolis',
      region_code: 'SC',
    };

    const component = IndexRoute.options.component;
    let tree = renderComponent(component);
    hookState[2][1](true);
    tree = renderComponent(component);

    const gpsButton = findClickableNodeByText(
      tree,
      'Usar minha localização atual (GPS)',
    );
    expect(gpsButton).toBeTruthy();
    gpsButton.props.onClick();

    expect(_mockGeolocationErrorCallback).toBeFunction();
    _mockGeolocationErrorCallback?.({
      code: 2,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });

    await Promise.resolve();
    tree = renderComponent(component);

    expect(findNodeByText(tree, 'Localização indisponível')).toBeTruthy();
    expect(global.localStorage.getItem('geolocation_preference')).toBeNull();
  });

  test('manual region selection applies explicit city and neighborhood filters without coarse IP fallback', async () => {
    mockFetchJson = {
      city: 'Florianópolis',
      region_code: 'SC',
    };

    const component = IndexRoute.options.component;
    let tree = renderComponent(component);
    await Promise.resolve();
    hookState[2][1](true);
    tree = renderComponent(component);

    const cityInput = findNode(
      tree,
      (candidate) => candidate?.props?.id === 'temp-city-input',
    );
    const neighborhoodInput = findNode(
      tree,
      (candidate) => candidate?.props?.id === 'temp-neighborhood-input',
    );
    expect(cityInput).toBeTruthy();
    expect(neighborhoodInput).toBeTruthy();

    cityInput.props.onChange({ target: { value: 'Florianópolis' } });
    neighborhoodInput.props.onChange({ target: { value: 'Centro' } });
    tree = renderComponent(component);

    const confirmButton = findClickableNodeByText(tree, 'Confirmar');
    expect(confirmButton).toBeTruthy();
    confirmButton.props.onClick();

    tree = renderComponent(component);

    expect(findNodeByText(tree, 'Florianópolis - Centro')).toBeTruthy();
    expect(global.localStorage.getItem('user_region')).toBe(
      JSON.stringify({
        city: 'Florianópolis',
        neighborhood: 'Centro',
      }),
    );
    expect(lastListPublicInput).toMatchObject({
      city: 'Florianópolis',
      neighborhood: 'Centro',
    });
    expect(lastListPublicInput?.userCondoId).toBeUndefined();
    expect(lastListPublicInput?.ipCity).toBeUndefined();
    expect(lastListPublicInput?.ipState).toBeUndefined();
  });

  test('manual condominium selection sets preferred context without hard filtering and clears coarse IP fallback', async () => {
    mockFetchJson = {
      city: 'Florianópolis',
      region_code: 'SC',
    };
    mockCondoSearchResults = [
      {
        id: 'condo-manual-id',
        name: 'Condomínio Manual',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000003',
      },
    ];

    const component = IndexRoute.options.component;
    let tree = renderComponent(component);
    await Promise.resolve();
    hookState[2][1](true);
    tree = renderComponent(component);

    const condoButton = findClickableNodeByText(tree, 'Condomínio Manual');
    expect(condoButton).toBeTruthy();
    condoButton.props.onClick();

    tree = renderComponent(component);

    expect(
      findNodeByText(tree, 'Condomínio selecionado: Condomínio Manual'),
    ).toBeTruthy();
    expect(findNodeByText(tree, 'Apenas neste condomínio')).toBeTruthy();
    expect(global.localStorage.getItem('user_condo')).toBe(
      JSON.stringify({
        id: 'condo-manual-id',
        name: 'Condomínio Manual',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000003',
      }),
    );
    expect(lastListPublicInput).toMatchObject({
      userCondoId: 'condo-manual-id',
    });
    expect(lastListPublicInput?.condominiumId).toBeUndefined();
    expect(lastListPublicInput?.ipCity).toBeUndefined();
    expect(lastListPublicInput?.ipState).toBeUndefined();
  });
});

afterAll(() => {
  delete (global as typeof globalThis & { window?: unknown }).window;
  delete (global as typeof globalThis & { localStorage?: unknown })
    .localStorage;
  delete (global as typeof globalThis & { fetch?: unknown }).fetch;
});
