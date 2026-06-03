// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals and browser APIs requires explicit any
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

// Setup global window / localstorage / geolocation mock
let _mockGeolocationSuccessCallback: ((pos: any) => void) | null = null;
let _mockGeolocationErrorCallback: ((err: any) => void) | null = null;
let savedItems: Record<string, string | null> = {};

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

// Hook simulation state
let hookIndex = 0;
const hookState: any[] = [];
const activeEffects: (() => void)[] = [];

const resetHookState = () => {
  hookIndex = 0;
  hookState.length = 0;
  activeEffects.length = 0;
  savedItems = {};
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
  useQuery: () => ({
    data: [],
    isLoading: false,
  }),
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
});
