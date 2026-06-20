// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals and browser APIs requires explicit any
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

// Define window and history mocks for browser APIs in Node/Bun environment
global.window = {
  addEventListener: (_event: string, _callback: any) => {},
  removeEventListener: (_event: string, _callback: any) => {},
} as any;

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

// Mock react-i18next
mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

// Mock lucide-react icons used by the reports chain
mock.module('lucide-react', () => ({
  AlertTriangle: () => 'AlertTriangle',
  Check: () => 'Check',
  History: () => 'History',
  Loader2: () => 'Loader2',
  ShieldAlert: () => 'ShieldAlert',
}));

// Mock shadcn UI primitives so the real ones (and their lucide imports) stay out
mock.module('@neighborhood-showcase/ui/components/card', () => ({
  Card: ({ children }: any) => children,
  CardContent: ({ children }: any) => children,
}));
mock.module('@neighborhood-showcase/ui/components/badge', () => ({
  Badge: ({ children }: any) => children,
}));
mock.module('@neighborhood-showcase/ui/components/button', () => ({
  Button: ({ children }: any) => children,
}));
mock.module('@neighborhood-showcase/ui/components/label', () => ({
  Label: ({ children }: any) => children,
}));
mock.module('@neighborhood-showcase/ui/components/dialog', () => ({
  Dialog: ({ children }: any) => children,
  DialogContent: ({ children }: any) => children,
  DialogDescription: ({ children }: any) => children,
  DialogHeader: ({ children }: any) => children,
  DialogTitle: ({ children }: any) => children,
}));

let mockResidentsData: any[] = [];
let mockAnnouncementsData: any[] = [];
let mockReportedData: any[] = [];

// Mock @tanstack/react-query
mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useQuery: (options: any) => {
    const queryKey = options.queryKey;
    let data: any[] = [];
    if (JSON.stringify(queryKey).includes('listPending')) {
      data = mockResidentsData;
    } else if (JSON.stringify(queryKey).includes('listForModeration')) {
      data = mockAnnouncementsData;
    } else if (JSON.stringify(queryKey).includes('listReported')) {
      data = mockReportedData;
    }
    return {
      data,
      isPending: false,
      refetch: () => {},
    };
  },
  useMutation: () => {
    return {
      mutate: () => {},
      isPending: false,
    };
  },
}));

// Mock @tanstack/react-router so route context can be driven directly
let mockRouteContext: any = { isSystemManager: true };
mock.module('@tanstack/react-router', () => ({
  createFileRoute: () => (options: any) => ({
    options,
    useRouteContext: () => mockRouteContext,
  }),
  redirect: (opts: any) => ({ isRedirect: true, ...opts }),
  Link: (props: any) => props.children,
  Outlet: () => null,
  useNavigate: () => () => {},
}));

// Dynamic import for the reports section component
const { Route: ReportsRoute } = await import('./panel/moderation/reports');

// Dynamic import for the index redirect route
const { Route: IndexRoute } = await import('./panel/moderation/index');

const findElementByText = (node: any, text: string): any => {
  if (!node) return null;
  if (typeof node === 'string' && node.includes(text)) return node;
  if (
    typeof node === 'object' &&
    node !== null &&
    typeof node.type === 'function'
  ) {
    try {
      const evaluated = node.type(node.props);
      const found = findElementByText(evaluated, text);
      if (found) return found;
    } catch (_error) {}
  }
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

describe('Moderation Reports Section', () => {
  beforeEach(() => {
    resetHookState();
    mockRouteContext = { isSystemManager: true };
    mockResidentsData = [];
    mockAnnouncementsData = [];
    mockReportedData = [
      {
        id: 'rep-ad-1',
        title: 'Reported Ad Title',
        imageUrl: 'http://localhost/rep-ad.jpg',
        status: 'ACTIVE',
        suspensionReason: null,
        createdAt: new Date(),
        providerId: 'provider-1',
        providerName: 'John Spam',
        providerEmail: 'john@spam.com',
        totalReports: 5,
        reasonBreakdown: {
          FRAUDE_GOLPE: 3,
          ASSEDIO_OFENSIVO: 2,
          SPAM: 0,
          SERVICO_ILEGAL: 0,
          OUTROS: 0,
        },
        reports: [
          {
            id: 'report-a',
            reporterName: 'Reporter A',
            reporterEmail: 'repa@example.com',
            reason: 'FRAUDE_GOLPE',
            createdAt: new Date(),
          },
        ],
      },
    ];
  });

  test('displays reported announcements with counts and reasons', () => {
    const component = ReportsRoute.options.component;
    const tree = renderComponent(component);

    // Verify reported ad title is present
    expect(findElementByText(tree, 'Reported Ad Title')).not.toBeNull();
    // Verify provider details
    expect(findElementByText(tree, 'John Spam')).not.toBeNull();
    expect(findElementByText(tree, 'john@spam.com')).not.toBeNull();
  });

  test('ban provider button is visible to SYSTEM_MANAGER and hidden otherwise', () => {
    const component = ReportsRoute.options.component;

    // 1. System manager sees the ban action
    mockRouteContext = { isSystemManager: true };
    resetHookState();
    let tree = renderComponent(component);
    expect(findElementByText(tree, 'moderation.ban')).not.toBeNull();

    // 2. Non system manager does not
    mockRouteContext = { isSystemManager: false };
    resetHookState();
    tree = renderComponent(component);
    expect(findElementByText(tree, 'moderation.ban')).toBeNull();
  });
});

describe('Moderation Index Redirect', () => {
  const runBeforeLoad = (context: any): any => {
    try {
      IndexRoute.options.beforeLoad({ context });
    } catch (redirectResult) {
      return redirectResult;
    }
    return null;
  };

  test('redirects a moderator with assignments to the residents queue', () => {
    const result = runBeforeLoad({
      isSystemManager: false,
      moderatorAssignments: [{ condominiumId: 'condo-1' }],
    });
    expect(result?.to).toBe('/panel/moderation/residents');
  });

  test('redirects a system manager without assignments to the reports queue', () => {
    const result = runBeforeLoad({
      isSystemManager: true,
      moderatorAssignments: [],
    });
    expect(result?.to).toBe('/panel/moderation/reports');
  });
});
