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

const { ProviderDashboardCondoSetupSindicoFlow } = await import(
  './-provider-dashboard-condo-setup-sindico-flow'
);

describe('ProviderDashboardCondoSetupSindicoFlow', () => {
  beforeEach(() => {
    resetHookState();
  });

  test('renders core condo registration fields', () => {
    const tree = renderComponent(() =>
      ProviderDashboardCondoSetupSindicoFlow({
        onBack: () => {},
        onSuccess: () => {},
      }),
    );

    expect(
      findElement(tree, (element) => element.props?.id === 'condo-name'),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) => element.props?.id === 'condo-cep'),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) => element.props?.id === 'condo-email'),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) => element.props?.id === 'file-upload'),
    ).toBeTruthy();
    expect(
      findElement(
        tree,
        (element) =>
          element.props?.type === 'submit' &&
          element.props.children === 'Solicitar Aprovação',
      ),
    ).toBeTruthy();
  });

  test('renders persisted form values', () => {
    hookState[0] = ['Condomínio Aurora', () => {}];
    hookState[4] = ['admin@condo.com', () => {}];

    const tree = renderComponent(() =>
      ProviderDashboardCondoSetupSindicoFlow({
        onBack: () => {},
        onSuccess: () => {},
      }),
    );

    expect(
      findElement(
        tree,
        (element) =>
          element.props?.id === 'condo-name' &&
          element.props.value === 'Condomínio Aurora',
      ),
    ).toBeTruthy();
    expect(
      findElement(
        tree,
        (element) =>
          element.props?.id === 'condo-email' &&
          element.props.value === 'admin@condo.com',
      ),
    ).toBeTruthy();
  });
});
