// biome-ignore-all lint/suspicious/noExplicitAny: Lightweight component unit harness uses simple mocks.
import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

const hookState: any[] = [];
let hookIndex = 0;
const activeEffects: (() => void)[] = [];
const mutateCalls: any[] = [];

const resetHookState = () => {
  hookState.length = 0;
  hookIndex = 0;
  activeEffects.length = 0;
  mutateCalls.length = 0;
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
    mutate: mock((payload: any) => {
      mutateCalls.push(payload);
    }),
    data: {
      pixQrCode: 'data:image/png;base64,qr',
      pixCopyPaste: '000201010212',
    },
    isPending: false,
    isError: false,
    error: null,
  }),
  useQuery: () => ({
    data: {
      status: 'PENDING',
    },
  }),
}));

mock.module('@tanstack/react-router', () => ({
  useNavigate: () => mock(() => {}),
}));

const { ProviderDashboardPaymentFlow } = await import(
  './-provider-dashboard-payment-flow'
);

const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;

describe('ProviderDashboardPaymentFlow', () => {
  beforeEach(() => {
    resetHookState();
    globalThis.setInterval = mock(() => 1 as any) as any;
    globalThis.clearInterval = mock(() => {}) as any;
  });

  afterAll(() => {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  });

  test('requests payment details and renders the pix surface', () => {
    const tree = renderComponent(() =>
      ProviderDashboardPaymentFlow({
        announcementId: 'announcement-123',
      }),
    );

    expect(mutateCalls).toEqual([{ announcementId: 'announcement-123' }]);
    expect(
      findElement(tree, (element) => element.props?.id === 'pix-copia-cola'),
    ).toBeTruthy();
    expect(
      findElement(
        tree,
        (element) =>
          element.props?.type === 'button' &&
          element.props.children === 'Copiar Código Pix',
      ),
    ).toBeTruthy();
  });
});
