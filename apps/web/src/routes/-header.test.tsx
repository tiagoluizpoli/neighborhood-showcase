// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals requires explicit any
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealReact from 'react';

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
  for (const effect of activeEffects) {
    effect();
  }
  return result;
};

// Mock React
mock.module('react', () => ({
  ...RealReact,
  useCallback: (fn: any) => fn,
  useEffect: (callback: () => void) => {
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

// Mock react-i18next
mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'pt',
      changeLanguage: () => Promise.resolve(),
    },
  }),
}));

let mockSession: any = null;

// Mock authClient
mock.module('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: mockSession, isPending: false }),
  },
}));

// Mock ModeToggle
mock.module('./mode-toggle', () => ({
  ModeToggle: () => 'ModeToggle',
}));

// Mock ModeToggle from relative imports as well
mock.module('@/components/mode-toggle', () => ({
  ModeToggle: () => 'ModeToggle',
}));

// Helper to traverse node tree to find text or properties
const findNodeByText = (node: any, text: string): any => {
  if (!node) return null;
  if (typeof node === 'string') return node.includes(text) ? node : null;
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findNodeByText(child, text);
      if (found) return found;
    }
  }
  return null;
};

const findNodeByProp = (node: any, propName: string, propValue: any): any => {
  if (!node) return null;
  if (node.props?.[propName] === propValue) return node;
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findNodeByProp(child, propName, propValue);
      if (found) return found;
    }
  }
  return null;
};

describe('Public Shell Header & Footer Tests', () => {
  beforeEach(() => {
    resetHookState();
    mockSession = null;
  });

  test('Logged-out header renders login button and no private links or dashboard', async () => {
    const { default: Header } = await import('@/components/header');
    const tree = renderComponent(Header);

    // Unauthenticated user sees "menu.login" link pointing to /auth
    const loginLink = findNodeByProp(tree, 'to', '/auth');
    expect(loginLink).not.toBeNull();
    expect(loginLink.props.children).toBe('menu.login');

    // Does not render dashboard (Painel) links in logged-out mode
    const dashboardLink = findNodeByProp(tree, 'to', '/panel/dashboard');
    expect(dashboardLink).toBeNull();

    // Public shell header stays focused: no theme or language utilities
    expect(findNodeByText(tree, 'ModeToggle')).toBeNull();
    expect(findNodeByText(tree, 'PT')).toBeNull();
    expect(findNodeByText(tree, 'EN')).toBeNull();
  });

  test('Logged-in header renders dashboard link and no login link', async () => {
    mockSession = {
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
      },
    };

    const { default: Header } = await import('@/components/header');
    const tree = renderComponent(Header);

    // Authenticated user sees "nav.dashboard" link pointing to /panel/dashboard
    const dashboardLink = findNodeByProp(tree, 'to', '/panel/dashboard');
    expect(dashboardLink).not.toBeNull();
    expect(dashboardLink.props.children).toBe('nav.dashboard');

    // Does not render login link
    const loginLink = findNodeByProp(tree, 'to', '/auth');
    expect(loginLink).toBeNull();

    // Public shell header stays focused: no theme or language utilities
    expect(findNodeByText(tree, 'ModeToggle')).toBeNull();
    expect(findNodeByText(tree, 'PT')).toBeNull();
    expect(findNodeByText(tree, 'EN')).toBeNull();
  });

  test('Public header renders navigation anchors to Explorar, Como Funciona, and Anunciar', async () => {
    const { default: Header } = await import('@/components/header');
    const tree = renderComponent(Header);

    // Explorar anchor exists
    const exploreLink = findNodeByProp(tree, 'hash', 'explorar');
    expect(exploreLink).not.toBeNull();
    expect(exploreLink.props.to).toBe('/');

    // Como funciona anchor exists
    const howLink = findNodeByProp(tree, 'hash', 'como-funciona');
    expect(howLink).not.toBeNull();
    expect(howLink.props.to).toBe('/');

    // Anunciar anchor exists
    const announceLink = findNodeByProp(tree, 'hash', 'anunciar');
    expect(announceLink).not.toBeNull();
    expect(announceLink.props.to).toBe('/');
  });

  test('Public footer contains public links and no private links', async () => {
    const { default: Footer } = await import('@/components/footer');
    const tree = renderComponent(Footer);

    // Explorar hash in footer
    const exploreLink = findNodeByProp(tree, 'hash', 'explorar');
    expect(exploreLink).not.toBeNull();

    // Como funciona hash in footer
    const howLink = findNodeByProp(tree, 'hash', 'como-funciona');
    expect(howLink).not.toBeNull();

    // Anunciar hash in footer
    const announceLink = findNodeByProp(tree, 'hash', 'anunciar');
    expect(announceLink).not.toBeNull();

    // Entrar link exists in footer
    const loginLink = findNodeByProp(tree, 'to', '/auth');
    expect(loginLink).not.toBeNull();

    // No private dashboard or moderator/admin strings/links
    const dashboardLink = findNodeByProp(tree, 'to', '/panel/dashboard');
    expect(dashboardLink).toBeNull();
    const moderationLink = findNodeByProp(tree, 'to', '/panel/moderation');
    expect(moderationLink).toBeNull();
  });
});
