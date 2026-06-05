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

mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useMutation: () => ({
    mutate: () => {},
    isPending: false,
  }),
}));

const { ProviderDashboardCondoSetupExternalFlow } = await import(
  './-provider-dashboard-condo-setup-external-flow'
);

describe('ProviderDashboardCondoSetupExternalFlow', () => {
  beforeEach(() => {
    resetHookState();
  });

  test('renders extracted external address form fields', () => {
    const tree = renderComponent(() =>
      ProviderDashboardCondoSetupExternalFlow({
        onBack: () => {},
        onRegisterSuccess: () => {},
      }),
    );

    expect(
      findElement(tree, (element) => element.props?.id === 'ext-cep'),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) => element.props?.id === 'ext-number'),
    ).toBeTruthy();
    expect(
      findElement(
        tree,
        (element) =>
          element.props?.type === 'submit' &&
          element.props.children === 'Confirmar Endereço',
      ),
    ).toBeTruthy();
  });

  test('renders persisted external state values', () => {
    hookState[0] = ['', () => {}];
    hookState[1] = ['Rua Aurora', () => {}];

    const tree = renderComponent(() =>
      ProviderDashboardCondoSetupExternalFlow({
        onBack: () => {},
        onRegisterSuccess: () => {},
      }),
    );

    expect(
      findElement(
        tree,
        (element) =>
          element.props?.id === 'ext-street' &&
          element.props.value === 'Rua Aurora',
      ),
    ).toBeTruthy();
  });
});
