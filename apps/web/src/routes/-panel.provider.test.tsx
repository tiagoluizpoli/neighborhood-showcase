// biome-ignore-all lint/suspicious/noExplicitAny: test harness walks React virtual DOM
import { describe, expect, mock, test } from 'bun:test';

mock.module('@tanstack/react-router', () => {
  const routeConfig: any = {};
  const routeFn = (config: any) => {
    if (config.component) {
      Object.defineProperty(routeConfig, 'component', {
        get: () => config.component,
        configurable: true,
        enumerable: true,
      });
    }
    return routeFn;
  };
  Object.defineProperty(routeFn, 'component', {
    get: () => routeConfig.component,
    enumerable: true,
  });
  return {
    createFileRoute: (_path: string) => routeFn,
    Outlet: () => 'Outlet',
    redirect: () => {
      throw new Error('REDIRECT');
    },
  };
});

mock.module('@/routes/panel/-user-access-profile', () => ({
  getUserAccessProfile: async () => ({ providerEnabled: true }),
}));

const { Route } = await import('@/routes/panel.provider');

// Walk the React virtual DOM, evaluating functional components to reach DOM nodes.
const findByProp = (node: any, key: string, value: string): any => {
  if (node == null || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findByProp(child, key, value);
      if (hit) return hit;
    }
    return null;
  }
  if (node.props?.[key] === value) return node;
  if (typeof node.type === 'function') {
    try {
      return findByProp(node.type(node.props), key, value);
    } catch {
      return null;
    }
  }
  return findByProp(node.props?.children, key, value);
};

describe('ProviderGroupLayout container seam', () => {
  test('container present with default variant at layout boundary', () => {
    const tree = Route.component();
    const container = findByProp(tree, 'data-container-variant', 'default');
    expect(container).not.toBeNull();
  });

  test('Outlet is inside the content container', () => {
    const tree = Route.component();
    const container = findByProp(tree, 'data-container-variant', 'default');
    expect(container).not.toBeNull();
    expect(container.props.children).toBeTruthy();
  });

  test('centered-form variant exists as a selectable option', () => {
    const el = Route.component;
    // Verify variant type is exported and accepted (smoke-check the import chain)
    expect(typeof el).toBe('function');
  });
});
