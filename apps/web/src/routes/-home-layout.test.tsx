// biome-ignore-all lint/suspicious/noExplicitAny: test harness mocks browser/react internals
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

let savedItems: Record<string, string | null> = {};
let hookIndex = 0;
const hookState: any[] = [];
const activeEffects: (() => void)[] = [];

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1280,
  location: { pathname: '/' },
  history: { pushState: () => {} },
  navigator: {
    maxTouchPoints: 0,
    platform: 'Linux x86_64',
    userAgent: 'bun-test',
    vendor: 'Google Inc.',
    geolocation: {
      getCurrentPosition: () => {},
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
    json: async () => ({}),
  }) as any;

const resetHookState = () => {
  hookIndex = 0;
  hookState.length = 0;
  activeEffects.length = 0;
  savedItems = {};
};

const renderComponent = (Component: () => any) => {
  hookIndex = 0;
  activeEffects.length = 0;
  const result = Component();
  for (const effect of activeEffects) {
    effect();
  }
  return result;
};

const getNodeText = (node: any): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  return getNodeText(node.props?.children);
};

const findNodeByText = (node: any, text: string): any | null => {
  if (node == null || typeof node === 'boolean') return null;
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

  if (getNodeText(node.props?.children).includes(text)) {
    return node;
  }

  return findNodeByText(node.props?.children, text);
};

const findClickableNodeByText = (node: any, text: string): any | null => {
  if (node == null || typeof node === 'boolean') return null;
  if (typeof node === 'string' || typeof node === 'number') return null;
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

  return findClickableNodeByText(node.props?.children, text);
};

const findNodeByProp = (node: any, propName: string, propValue: string) => {
  if (node == null || typeof node === 'boolean') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNodeByProp(child, propName, propValue);
      if (match) return match;
    }
    return null;
  }
  if (node.props?.[propName] === propValue) return node;
  return findNodeByProp(node.props?.children, propName, propValue);
};

const findLinkByText = (node: any, text: string): any | null => {
  if (node == null || typeof node === 'boolean') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findLinkByText(child, text);
      if (match) return match;
    }
    return null;
  }
  if (node.props?.to && getNodeText(node.props.children).includes(text)) {
    return node;
  }
  return findLinkByText(node.props?.children, text);
};

mock.module('react', () => ({
  ...RealReact,
  useCallback: (fn: any) => fn,
  useEffect: (callback: () => void) => {
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
          stateContainer.value =
            typeof newVal === 'function'
              ? newVal(stateContainer.value)
              : newVal;
          hookState[idx][0] = stateContainer.value;
        },
      };
      hookState[idx] = [stateContainer.value, stateContainer.setValue];
    }
    return hookState[idx];
  },
}));

mock.module('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: any) => ({
    options,
  }),
  Link: (props: any) => {
    const { children, ...rest } = props;
    return <a {...rest}>{children}</a>;
  },
  useNavigate: () => mock(() => {}),
}));

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'home.hero.eyebrow': 'Descubra perto de você',
        'home.hero.title': 'Explore serviços e ofertas da sua região',
        'home.hero.description':
          'Busque por categoria, condomínio ou palavra-chave e fale direto com quem anuncia.',
        'location.modal_title': 'Selecionar Localização',
        'location.modal_desc': 'Escolha como deseja personalizar o feed:',
        'location.change': 'Alterar',
        'location.no_signal': 'Todos os anúncios',
        'location.clear': 'Limpar localização',
        'home.filters': 'Filtros',
        'home.search_placeholder': 'Buscar por serviços, comidas, produtos...',
        'home.filters_title': 'Filtros da busca',
        'home.how_it_works.title': 'Como funciona',
        'home.how_it_works.step_1_title': 'Explore perto de você',
        'home.how_it_works.step_1_description':
          'Navegue por região, condomínio, categoria ou busca.',
        'home.how_it_works.step_2_title': 'Confira quem anuncia',
        'home.how_it_works.step_2_description':
          'Veja identidade do prestador, verificação, contexto local e detalhes.',
        'home.how_it_works.step_3_title': 'Fale direto com o prestador',
        'home.how_it_works.step_3_description':
          'Entre em contato por WhatsApp, telefone, email ou perfil público.',
        'home.how_it_works.provider_note':
          'Quer anunciar? Publique seu serviço no painel e apareça para moradores próximos.',
        'home.anunciar.title': 'Anuncie para quem mora perto',
        'home.anunciar.description':
          'Publique seus serviços ou produtos e seja visto por moradores do seu condomínio e região com facilidade e segurança.',
        'home.anunciar.cta': 'Anunciar serviço',
        'home.anunciar.has_account': 'Já tem conta? Entrar',
        'location.tab_region': 'Região',
        'location.tab_condo': 'Condomínio',
        'location.option_gps': 'Usar minha localização atual (GPS)',
        'location.option_gps_desc':
          'Ordena anúncios pela proximidade exata de você.',
        'location.option_region_desc':
          'Filtra anúncios por uma cidade e bairro específicos.',
        'location.option_condo_desc':
          'Define um condomínio específico para priorizar no feed.',
        'location.condo_placeholder':
          'Buscar condomínio pelo nome, cidade ou CEP',
        'location.condo_empty': 'Nenhum condomínio aprovado encontrado.',
        'location.city_placeholder': 'Digite a cidade',
        'location.city_example': 'Ex: Florianópolis',
        'location.neighborhood_placeholder': 'Digite o bairro (opcional)',
        'location.neighborhood_example': 'Ex: Centro',
        'moderation.confirm': 'Confirmar',
      };
      return translations[key] ?? key;
    },
  }),
}));

mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useQuery: (options: any) => {
    const queryKey = options?.queryKey || [];
    const queryHash = options?.queryKeyHash || '';
    if (
      queryHash.includes('listPublic') ||
      JSON.stringify(queryKey).includes('listPublic')
    ) {
      return {
        data: [
          {
            id: 'ann-123',
            title: 'Test Ad',
            description: 'Test Description',
            imageUrl: 'test.jpg',
            category: 'Serviços',
            contactLinks: {},
            showVerifiedBadge: false,
            condoCity: 'Florianópolis',
            providerName: 'Test Provider',
          },
        ],
        isLoading: false,
      };
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

export let mockSession: any = null;

mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: mockSession, isPending: false }),
  },
}));

const { Route: IndexRoute } = await import('./_portal.index');

describe('Home Discovery Layout Shell', () => {
  beforeEach(() => {
    resetHookState();
  });

  test('uses wider page shell and keeps home section anchors', () => {
    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    expect(tree.props.className).not.toContain('max-w-6xl');
    expect(findNodeByProp(tree, 'id', 'explorar')).toBeTruthy();
    expect(findNodeByProp(tree, 'id', 'como-funciona')).toBeTruthy();
    expect(findNodeByProp(tree, 'id', 'anunciar')).toBeTruthy();
  });

  test('renders compact hero band above discovery controls', () => {
    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    expect(findNodeByText(tree, 'Descubra perto de você')).toBeTruthy();
    expect(
      findNodeByText(tree, 'Explore serviços e ofertas da sua região'),
    ).toBeTruthy();
    expect(
      findNodeByText(
        tree,
        'Busque por categoria, condomínio ou palavra-chave e fale direto com quem anuncia.',
      ),
    ).toBeTruthy();
  });

  test('groups search, location, categories, and filters inside compact discovery controls', () => {
    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    const exploreSection = findNodeByProp(tree, 'id', 'explorar');
    expect(exploreSection).toBeTruthy();
    expect(
      findNodeByProp(
        exploreSection,
        'placeholder',
        'Buscar por serviços, comidas, produtos...',
      ),
    ).toBeTruthy();
    expect(
      findNodeByText(exploreSection, 'Selecionar Localização'),
    ).toBeTruthy();
    expect(
      findNodeByText(exploreSection, 'Apenas moradores verificados'),
    ).toBeTruthy();
  });

  test('shows Filtros action on mobile instead of stacking all controls inline', () => {
    global.window.innerWidth = 375;
    const component = IndexRoute.options.component;

    renderComponent(component);
    const tree = renderComponent(component);

    expect(findClickableNodeByText(tree, 'Filtros')).toBeTruthy();
  });

  test('renders compact visitor-first como-funciona steps with provider note', () => {
    const component = IndexRoute.options.component;
    const tree = renderComponent(component);
    const howSection = findNodeByProp(tree, 'id', 'como-funciona');

    expect(howSection).toBeTruthy();
    expect(findNodeByText(howSection, 'Explore perto de você')).toBeTruthy();
    expect(
      findNodeByText(
        howSection,
        'Navegue por região, condomínio, categoria ou busca.',
      ),
    ).toBeTruthy();
    expect(findNodeByText(howSection, 'Confira quem anuncia')).toBeTruthy();
    expect(
      findNodeByText(
        howSection,
        'Veja identidade do prestador, verificação, contexto local e detalhes.',
      ),
    ).toBeTruthy();
    expect(
      findNodeByText(howSection, 'Fale direto com o prestador'),
    ).toBeTruthy();
    expect(
      findNodeByText(
        howSection,
        'Entre em contato por WhatsApp, telefone, email ou perfil público.',
      ),
    ).toBeTruthy();
    expect(
      findNodeByText(
        howSection,
        'Quer anunciar? Publique seu serviço no painel e apareça para moradores próximos.',
      ),
    ).toBeTruthy();
  });

  test('uses dense responsive columns and handles #anunciar band states', () => {
    // Assert denser announcement grid class (xl:grid-cols-4)
    const component = IndexRoute.options.component;
    const tree = renderComponent(component);

    // Check grid layout classes
    const gridNode = findNodeByProp(
      tree,
      'className',
      'grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
    );
    expect(gridNode).toBeTruthy();

    const anunciarSection = findNodeByProp(tree, 'id', 'anunciar');
    expect(anunciarSection).toBeTruthy();
    // Verify it uses negative margin classes for full width
    expect(anunciarSection.props.className).toContain('-mx-4');
    expect(anunciarSection.props.className).toContain('md:-mx-6');
    expect(anunciarSection.props.className).toContain('lg:-mx-8');

    // Test unauthenticated state
    mockSession = null;
    const treeUnauth = renderComponent(component);
    const unauthSection = findNodeByProp(treeUnauth, 'id', 'anunciar');

    const signUpLink = findLinkByText(unauthSection, 'Anunciar serviço');
    expect(signUpLink).toBeTruthy();
    expect(signUpLink.props.search).toEqual({ tab: 'signup' });

    const signInLink = findLinkByText(unauthSection, 'Já tem conta? Entrar');
    expect(signInLink).toBeTruthy();
    expect(signInLink.props.to).toBe('/auth');
    expect(signInLink.props.search).toEqual({ tab: 'signin' });

    // Test authenticated state
    mockSession = { user: { id: 'test-user-123' } };
    const treeAuth = renderComponent(component);
    const authSection = findNodeByProp(treeAuth, 'id', 'anunciar');

    const dashboardLink = findLinkByText(authSection, 'Anunciar serviço');
    expect(dashboardLink).toBeTruthy();
    expect(dashboardLink.props.to).toBe('/panel/dashboard');

    const signInLinkAuth = findLinkByText(authSection, 'Já tem conta? Entrar');
    expect(signInLinkAuth).toBeNull();
  });
});
