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

let mockSessionData: any = null;
let currentId = 'ann-123';
const mockMutate = mock(() => {});
const mockTrackEventMutation = {
  mutate: mockMutate,
  isPending: false,
};

// Mock @/lib/auth-client
mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: mockSessionData, isPending: false }),
  },
}));

// Mock @tanstack/react-query
mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useQuery: () => {
    return {
      data: {
        id: currentId,
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
      },
      isLoading: false,
    };
  },
  useMutation: () => mockTrackEventMutation,
}));

// Dynamic import for component
const { Route: DetailsRoute } = await import('./_portal.anuncios.$id');
DetailsRoute.useParams = () => ({ id: currentId });

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

const findElementByProp = (
  node: any,
  propName: string,
  propValue: any,
): any => {
  if (!node) return null;
  if (node.props?.[propName] === propValue) return node;
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findElementByProp(child, propName, propValue);
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

describe('Public Announcement Detail Component Visuals', () => {
  beforeEach(() => {
    resetHookState();
    mockMutate.mockClear();
    currentId = 'ann-123';
  });

  test('renders provider display name and link to public profile', () => {
    const component = DetailsRoute.options.component;
    const tree = renderComponent(component);

    // Verify provider display name Chef Giovanni exists in tree
    const providerNameElement = findElementByText(tree, 'Chef Giovanni');
    expect(providerNameElement).not.toBeNull();

    // Verify it contains a link pointing to the provider's public profile page
    const profileLink = findElementByProp(tree, 'to', '/providers/$id');
    expect(profileLink).not.toBeNull();
    expect(profileLink.props.params).toEqual({ id: 'provider-abc' });
  });

  test('renders all 7 configured contact channels', () => {
    const component = DetailsRoute.options.component;
    const tree = renderComponent(component);

    // Find all <a> tags or links with href
    const links = findElementsByProp(tree, 'target', '_blank');
    expect(links.length).toBeGreaterThanOrEqual(7);

    // Verify specific links
    const hrefs = links.map((l) => l.props.href);

    // WhatsApp
    expect(hrefs.some((h) => h?.includes('wa.me/5511999999999'))).toBe(true);
    // Phone
    expect(hrefs.some((h) => h?.includes('tel:5511888888888'))).toBe(true);
    // Email
    expect(hrefs.some((h) => h?.includes('mailto:pizza@example.com'))).toBe(
      true,
    );
    // Instagram
    expect(
      hrefs.some((h) => h?.includes('instagram.com/pizzaria.delicia')),
    ).toBe(true);
    // TikTok
    expect(hrefs.some((h) => h?.includes('tiktok.com/@pizzariatiktok'))).toBe(
      true,
    );
    // Facebook
    expect(hrefs.some((h) => h?.includes('facebook.com/pizzariafb'))).toBe(
      true,
    );
    // Website
    expect(hrefs.some((h) => h?.includes('http://pizza.com'))).toBe(true);
  });

  test('does not show Denunciar button for unauthenticated users', () => {
    mockSessionData = null;
    const component = DetailsRoute.options.component;
    const tree = renderComponent(component);

    const reportButton = findElementByProp(tree, 'title', 'Denunciar Anúncio');
    expect(reportButton).toBeNull();
  });

  test('shows Denunciar button for authenticated users', () => {
    mockSessionData = { user: { id: 'user-123' } };
    const component = DetailsRoute.options.component;
    const tree = renderComponent(component);

    const reportButton = findElementByProp(tree, 'title', 'Denunciar Anúncio');
    expect(reportButton).not.toBeNull();
  });
});
