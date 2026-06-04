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
  useQuery: () => ({
    data: [],
    isLoading: false,
  }),
  useMutation: () => ({
    mutate: () => {},
  }),
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
});
