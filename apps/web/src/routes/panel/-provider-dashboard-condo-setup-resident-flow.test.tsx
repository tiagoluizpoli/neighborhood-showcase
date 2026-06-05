// biome-ignore-all lint/suspicious/noExplicitAny: Lightweight component unit harness uses simple mocks.
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

const hookState: any[] = [];
let hookIndex = 0;
const activeEffects: (() => void)[] = [];

const resetHookState = () => {
  hookState.length = 0;
  hookIndex = 0;
  activeEffects.length = 0;
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

const findElement = (node: any, predicate: (el: any) => boolean): any => {
  if (!node) return null;
  if (predicate(node)) return node;
  if (node && typeof node.type === 'function') {
    try {
      const evaluated = node.type(node.props);
      const found = findElement(evaluated, predicate);
      if (found) return found;
    } catch (_error) {}
  }
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

const findAllElements = (
  node: any,
  predicate: (el: any) => boolean,
  results: any[] = [],
): any[] => {
  if (!node) return results;
  if (predicate(node)) {
    results.push(node);
  }
  if (node && typeof node.type === 'function') {
    try {
      const evaluated = node.type(node.props);
      findAllElements(evaluated, predicate, results);
    } catch (_error) {}
  }
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      findAllElements(child, predicate, results);
    }
  }
  return results;
};

mock.module('react', () => ({
  ...RealReact,
  useEffect: (callback: () => void, _deps: any[]) => {
    activeEffects.push(callback);
  },
  useState: (initialValue: any) => {
    const idx = hookIndex++;
    if (hookState[idx] === undefined) {
      const stateContainer = {
        value: initialValue,
        setValue: (newValue: any) => {
          stateContainer.value =
            typeof newValue === 'function'
              ? newValue(stateContainer.value)
              : newValue;
        },
      };
      hookState[idx] = [stateContainer.value, stateContainer.setValue];
    }
    return hookState[idx];
  },
}));

let mockApprovedCondos: any[] = [];
let mockIsPending = false;

mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useQuery: (_options: any) => ({
    data: mockApprovedCondos,
    isPending: mockIsPending,
  }),
  useMutation: () => ({
    mutate: () => {},
    isPending: false,
  }),
}));

const { ProviderDashboardCondoSetupResidentFlow } = await import(
  './-provider-dashboard-condo-setup-resident-flow'
);

describe('ProviderDashboardCondoSetupResidentFlow', () => {
  beforeEach(() => {
    resetHookState();
    mockIsPending = false;
    mockApprovedCondos = [
      {
        id: 'condo-1',
        name: 'Residencial Aurora',
        city: 'Sao Paulo',
        state: 'SP',
        cep: '01000-000',
      },
    ];
  });

  test('renders condo search results before selection', () => {
    const tree = renderComponent(() =>
      ProviderDashboardCondoSetupResidentFlow({
        onBack: () => {},
        onRequestSuccess: () => {},
      }),
    );

    const title = findElement(
      tree,
      (element) =>
        element.type === 'p' && element.props.children === 'Residencial Aurora',
    );
    expect(title).toBeTruthy();

    const searchInput = findElement(
      tree,
      (element) => element.props?.id === 'search-condo',
    );
    expect(searchInput).toBeTruthy();
  });

  test('renders selected condo form state', () => {
    hookState[2] = [
      {
        id: 'condo-1',
        name: 'Residencial Aurora',
        city: 'Sao Paulo',
        state: 'SP',
        cep: '01000-000',
      },
      () => {},
    ];
    hookState[3] = ['Bloco B', () => {}];

    const tree = renderComponent(() =>
      ProviderDashboardCondoSetupResidentFlow({
        onBack: () => {},
        onRequestSuccess: () => {},
      }),
    );

    const unitInput = findElement(
      tree,
      (element) =>
        element.props?.id === 'unit-info' && element.props.value === 'Bloco B',
    );
    expect(unitInput).toBeTruthy();

    const buttons = findAllElements(
      tree,
      (element) =>
        element.type === 'button' || element.props?.type === 'submit',
    );
    const submit = buttons.find((button) => button.props?.type === 'submit');
    expect(submit?.props.children).toBe('Solicitar Acesso');
  });
});
