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

let currentId = 'ann-123';
const mockMutate = mock(() => {});
const mockTrackEventMutation = {
  mutate: mockMutate,
  isPending: false,
};

// Mock @tanstack/react-query while spreading real exports to prevent breaking other tests
mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useQuery: (options: any) => {
    // Differentiate queries by queryKey (safely extracted from options)
    const queryKey = options?.queryKey || [];
    const queryHash = options?.queryKeyHash || '';

    // Check if query is listPublic (public announcements list)
    if (
      queryHash.includes('listPublic') ||
      JSON.stringify(queryKey).includes('listPublic')
    ) {
      return {
        data: [
          {
            id: currentId,
            title: 'Test Ad',
            description: 'Test Description',
            imageUrl: 'test.jpg',
            category: 'Serviços',
            contactLinks: {},
          },
        ],
        isLoading: false,
      };
    }

    // Default to public ad details
    return {
      data: {
        id: currentId,
        title: 'Test Ad',
        description: 'Test Description',
        imageUrl: 'test.jpg',
        category: 'Serviços',
        contactLinks: {},
      },
      isLoading: false,
    };
  },
  useMutation: () => mockTrackEventMutation,
}));

// Use dynamic imports to prevent ES module hoisting from importing original modules before mocks are set up
const { Route: DetailsRoute } = await import('./_portal.anuncios.$id');
const { Route: IndexRoute } = await import('./_portal.index');

// Monkeypatch Route.useParams to bypass React Router context calls in testing environment
DetailsRoute.useParams = () => ({ id: currentId });
IndexRoute.useParams = () => ({});

describe('Analytics Impression Tracking tests', () => {
  beforeEach(() => {
    resetHookState();
    mockMutate.mockClear();
    currentId = 'ann-123';
    global.window.location.pathname = '/';
  });

  test('Detail component tracks impression exactly once on initial load', () => {
    const component = DetailsRoute.options.component;
    renderComponent(component);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      announcementId: 'ann-123',
      eventType: 'IMPRESSION',
    });
  });

  test('useRef guard prevents double-counting due to StrictMode in development', () => {
    const component = DetailsRoute.options.component;

    // Simulate first mount
    renderComponent(component);
    expect(mockMutate).toHaveBeenCalledTimes(1);

    // Simulate StrictMode double-render (rerun component render with existing hook states)
    renderComponent(component);

    // Should still only be called once
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  test('Navigating away and back (re-visit) counts as a new impression', () => {
    const component = DetailsRoute.options.component;

    // First visit
    renderComponent(component);
    expect(mockMutate).toHaveBeenCalledTimes(1);

    // Navigate away/back (unmount & fresh mount - resets hookState)
    resetHookState();
    renderComponent(component);

    expect(mockMutate).toHaveBeenCalledTimes(2);
  });

  test('Changing parameters (navigating to another announcement) tracks new impression', () => {
    const component = DetailsRoute.options.component;

    // Visit first ad
    renderComponent(component);
    expect(mockMutate).toHaveBeenCalledTimes(1);

    // Update current ID (parameter change)
    currentId = 'ann-456';

    // Rerender with new ID param
    renderComponent(component);

    expect(mockMutate).toHaveBeenCalledTimes(2);
    expect(mockMutate.mock.calls[1][0]).toEqual({
      announcementId: 'ann-456',
      eventType: 'IMPRESSION',
    });
  });

  test('Vitrine grid card click does not track IMPRESSION event directly', () => {
    const vitrineComponent = IndexRoute.options.component;

    // Render vitrine
    const tree = renderComponent(vitrineComponent);

    // Helper to find a element recursively
    const findElement = (node: any, predicate: (el: any) => boolean): any => {
      if (!node) return null;
      if (predicate(node)) return node;
      if (node.props?.children) {
        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];
        for (const child of children) {
          const found = findElement(child, predicate);
          if (found) return found;
        }
      }
      return null;
    };

    // Find the Card in the vitrine tree (identify it by its specific class names or type name)
    const card = findElement(tree, (el) => {
      return el.props?.className?.includes('bg-card/45');
    });
    expect(card).toBeDefined();
    expect(card.props.onClick).toBeDefined();

    // Call click handler on vitrine card
    card.props.onClick();

    // Verify it did not invoke mutate for impression
    const impressionCalls = mockMutate.mock.calls.filter(
      (call) => call[0]?.eventType === 'IMPRESSION',
    );
    expect(impressionCalls.length).toBe(0);
  });
});
