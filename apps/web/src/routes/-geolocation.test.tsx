// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals and browser APIs requires explicit any
import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

// Setup global window / localstorage / geolocation mock
let _mockGeolocationSuccessCallback: ((pos: any) => void) | null = null;
let _mockGeolocationErrorCallback: ((err: any) => void) | null = null;
let savedItems: Record<string, string | null> = {};
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
    geolocation: {
      getCurrentPosition: (success: any, error: any) => {
        _mockGeolocationSuccessCallback = success;
        _mockGeolocationErrorCallback = error;
      },
    },
  },
} as any;

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

// Hook simulation state
let hookIndex = 0;
const hookState: any[] = [];
const activeEffects: (() => void)[] = [];

const resetHookState = () => {
  hookIndex = 0;
  hookState.length = 0;
  activeEffects.length = 0;
  savedItems = {};
  mockNearbyCondoResults = [];
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

  test('Shows dialog on first visit when geolocation preference is not set', () => {
    const component = IndexRoute.options.component;
    // Render
    renderComponent(component);

    // Let's check hookState values to verify state of isGeoDialogOpen
    // From _portal.index.tsx state declarations:
    // index 0: selectedCondo (null)
    // index 1: isSelectorOpen (false)
    // index 2: condoSearchQuery ('')
    // index 3: geoPreference (null)
    // index 4: isGeoDialogOpen (true - since preference is null)
    expect(hookState[4][0]).toBe(true);
  });

  test('Does not show dialog if geolocation preference is already granted', () => {
    global.localStorage.setItem('geolocation_preference', 'granted');
    const component = IndexRoute.options.component;
    renderComponent(component);
    // isGeoDialogOpen should be false
    expect(hookState[4][0]).toBe(false);
  });

  test('Does not show dialog if geolocation preference is already denied', () => {
    global.localStorage.setItem('geolocation_preference', 'denied');
    const component = IndexRoute.options.component;
    renderComponent(component);
    // isGeoDialogOpen should be false
    expect(hookState[4][0]).toBe(false);
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
});

afterAll(() => {
  delete (global as typeof globalThis & { window?: unknown }).window;
  delete (global as typeof globalThis & { localStorage?: unknown })
    .localStorage;
  delete (global as typeof globalThis & { fetch?: unknown }).fetch;
});
