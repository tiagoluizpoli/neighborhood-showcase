// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals and browser APIs requires explicit any
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

// Define window and history mocks for browser APIs in Node/Bun environment
global.window = {
  addEventListener: (_event: string, _callback: any) => {},
  removeEventListener: (_event: string, _callback: any) => {},
  location: {
    pathname: '/',
  },
  history: {
    pushState: (_state: any, _title: string, url: string) => {
      global.window.location.pathname = url;
    },
  },
} as any;

global.document = {
  title: '',
  querySelector: (_selector: string) => ({
    setAttribute: (_name: string, _value: string) => {},
  }),
  getElementsByTagName: (_name: string) => [],
  head: {
    appendChild: () => {},
  },
  createElement: (_name: string) => ({
    setAttribute: (_name: string, _value: string) => {},
    appendChild: () => {},
  }),
  createTextNode: (_text: string) => ({}),
} as any;

global.localStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  length: 0,
  key: (_index: number) => null,
};

// Hook simulator state
let hookIndex = 0;
const hookState: any[] = [];
const activeEffects: (() => void)[] = [];

const resetHookState = () => {
  hookIndex = 0;
  hookState.length = 0;
  activeEffects.length = 0;
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
        value: initialValue,
        setValue: (newVal: any) => {
          if (typeof newVal === 'function') {
            stateContainer.value = newVal(stateContainer.value);
          } else {
            stateContainer.value = newVal;
          }
        },
      };
      hookState[idx] = [stateContainer.value, stateContainer.setValue];
    }
    return hookState[idx];
  },
}));

let mockQueryData: any = null;
let mockIsLoading = false;
let mockError: any = null;

// Mock @tanstack/react-query
mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useQuery: () => {
    return {
      data: mockQueryData,
      isLoading: mockIsLoading,
      error: mockError,
    };
  },
}));

// Mock lucide-react — Bun CJS bundle omits named exports not in its snapshot
mock.module('lucide-react', () => {
  const icon = () => null;
  return {
    CheckCircle2: icon,
    ChevronLeft: icon,
    Facebook: icon,
    Globe: icon,
    Instagram: icon,
    Loader2: icon,
    Mail: icon,
    MessageCircle: icon,
    Phone: icon,
  };
});

// Mock react-i18next — t returns the key so assertions confirm i18n resolution
mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Dynamic import for component
const { Route: ProfileRoute } = await import('./_portal.providers.$id');
ProfileRoute.useParams = () => ({ id: 'provider-123' });

const findElementByText = (node: any, text: string): any => {
  if (!node) return null;
  if (typeof node === 'string' && node.includes(text)) return node;
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findElementByText(child, text);
      if (found) return found;
    }
  }
  return null;
};

const findElementsByProp = (
  node: any,
  propName: string,
  propValue: any,
  results: any[] = [],
): any[] => {
  if (!node) return results;
  if (node.props?.[propName] === propValue) {
    results.push(node);
  }
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      findElementsByProp(child, propName, propValue, results);
    }
  }
  return results;
};

describe('Provider Public Profile Component Visuals', () => {
  beforeEach(() => {
    resetHookState();
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
          title: 'Aulas de Violão',
          subtitle: 'Aprenda violão do zero',
          description: 'Aulas particulares para todas as idades.',
          priceCents: 8000,
          imageUrl: 'http://localhost/guitar.jpg',
          category: 'Serviços',
          tags: ['música', 'violão'],
          contactLinks: {
            whatsapp: '5511988888888',
          },
          showVerifiedBadge: true,
          status: 'ACTIVE',
          createdAt: new Date(),
          providerName: 'Maria Silva',
          providerAvatarUrl: 'http://localhost/maria.jpg',
        },
      ],
    };
    mockIsLoading = false;
    mockError = null;
  });

  test('renders loading state correctly — resolves through i18n', () => {
    mockIsLoading = true;
    mockQueryData = null;

    const component = ProfileRoute.options.component;
    const tree = renderComponent(component);

    expect(findElementByText(tree, 'provider_profile.loading')).not.toBeNull();
  });

  test('back-to-showcase link resolves through i18n', () => {
    const component = ProfileRoute.options.component;
    const tree = renderComponent(component);

    expect(
      findElementByText(tree, 'provider_profile.back_to_showcase'),
    ).not.toBeNull();
  });

  test('renders 404/error state correctly', () => {
    mockIsLoading = false;
    mockError = new Error('Not found');
    mockQueryData = null;

    const component = ProfileRoute.options.component;
    const tree = renderComponent(component);

    expect(findElementByText(tree, 'Prestador não encontrado')).not.toBeNull();
  });

  test('renders provider display name, avatar, and verified badge', () => {
    const component = ProfileRoute.options.component;
    const tree = renderComponent(component);

    // Verify name
    expect(findElementByText(tree, 'Maria Silva')).not.toBeNull();

    // Verify verified badge text
    expect(findElementByText(tree, 'Morador verificado')).not.toBeNull();
  });

  test('renders all 7 configured contact channels on profile sidebar', () => {
    const component = ProfileRoute.options.component;
    const tree = renderComponent(component);

    // Find links
    const links = findElementsByProp(tree, 'target', '_blank');
    const hrefs = links.map((l) => l.props.href);

    expect(hrefs.some((h) => h?.includes('wa.me/5511988888888'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('tel:5511777777777'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('mailto:maria@example.com'))).toBe(
      true,
    );
    expect(hrefs.some((h) => h?.includes('instagram.com/maria.silva'))).toBe(
      true,
    );
    expect(hrefs.some((h) => h?.includes('tiktok.com/@mariatiktok'))).toBe(
      true,
    );
    expect(hrefs.some((h) => h?.includes('facebook.com/mariafb'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('http://maria.com'))).toBe(true);
  });

  test('renders grid list of announcements', () => {
    const component = ProfileRoute.options.component;
    const tree = renderComponent(component);

    expect(findElementByText(tree, 'Aulas de Violão')).not.toBeNull();
    expect(
      findElementByText(tree, 'Residencial Aurora • São Paulo'),
    ).not.toBeNull();
  });

  test('renders empty state correctly', () => {
    mockQueryData.announcements = [];

    const component = ProfileRoute.options.component;
    const tree = renderComponent(component);

    expect(
      findElementByText(
        tree,
        'Este prestador não possui anúncios ativos no momento.',
      ),
    ).not.toBeNull();
  });
});
