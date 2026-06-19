// biome-ignore-all lint/suspicious/noExplicitAny: test harness walks React virtual DOM
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealReact from 'react';

// ─── Hook simulator ────────────────────────────────────────────────────────
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
    try {
      effect();
    } catch {
      // ignore effect errors in unit tests
    }
  }
  return result;
};

// ─── React mock ────────────────────────────────────────────────────────────
mock.module('react', () => ({
  ...RealReact,
  useCallback: (fn: any, _deps?: any[]) => fn,
  useEffect: (callback: () => void, _deps?: any[]) => {
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
      const value =
        typeof initialValue === 'function' ? initialValue() : initialValue;
      const container = {
        value,
        setValue: (newVal: any) => {
          container.value =
            typeof newVal === 'function' ? newVal(container.value) : newVal;
          hookState[idx] = [container.value, container.setValue];
        },
      };
      hookState[idx] = [container.value, container.setValue];
    }
    return hookState[idx];
  },
  useMemo: (fn: any, _deps?: any[]) => fn(),
}));

// ─── Mutable mock state ─────────────────────────────────────────────────────
let mockDashboardData: any = null;

// ─── @tanstack/react-router mock ─────────────────────────────────────────────
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
  routeFn.useParams = () => ({ id: 'ann-1' });
  routeFn.useSearch = () => ({});
  routeFn.useRouteContext = () => ({});
  Object.defineProperty(routeFn, 'component', {
    get: () => routeConfig.component,
    enumerable: true,
  });
  return {
    createFileRoute: (_path: string) => routeFn,
    Link: ({ children, to, ...rest }: any) => ({
      type: 'a',
      props: { href: to, ...rest, children },
    }),
    Outlet: () => 'Outlet',
    useNavigate: () => () => {},
    useParams: () => ({ id: 'ann-1' }),
    redirect: () => {
      throw new Error('REDIRECT');
    },
  };
});

// ─── @tanstack/react-query mock ─────────────────────────────────────────────
mock.module('@tanstack/react-query', () => ({
  useQuery: (options: any) => {
    const key = JSON.stringify(options?.queryKey ?? '');
    if (key.includes('getDashboardData')) {
      return {
        data: mockDashboardData,
        isLoading: false,
        isError: mockDashboardData === null,
        refetch: () => {},
      };
    }
    if (key.includes('getMyAssignments')) {
      return { data: [], isLoading: false, isError: false, refetch: () => {} };
    }
    return { data: null, isLoading: false, isError: true, refetch: () => {} };
  },
  useMutation: () => ({ mutate: () => {}, isPending: false, variables: null }),
  useQueryClient: () => ({
    invalidateQueries: () => {},
    setQueryData: () => {},
    getQueryData: () => undefined,
  }),
}));

// ─── react-i18next mock ─────────────────────────────────────────────────────
mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt' },
  }),
}));

// ─── sonner mock ─────────────────────────────────────────────────────────────
mock.module('sonner', () => ({
  toast: { error: () => {}, success: () => {} },
}));

// ─── trpc proxy ──────────────────────────────────────────────────────────────
const trpcProxy = new Proxy(
  {},
  {
    get: (_: any, ns: string) =>
      new Proxy(
        {},
        {
          get: (_: any, method: string) =>
            new Proxy(
              {},
              {
                get: (_: any, option: string) => (opts?: any) => ({
                  queryKey: [ns, method, option],
                  ...(opts || {}),
                }),
              },
            ),
        },
      ),
  },
);
mock.module('@/utils/trpc', () => ({ trpc: trpcProxy }));

// ─── env mock ────────────────────────────────────────────────────────────────
mock.module('@neighborhood-showcase/env/web', () => ({
  env: { VITE_SERVER_URL: 'http://localhost:3000' },
}));

// ─── react-easy-crop mock ─────────────────────────────────────────────────────
mock.module('react-easy-crop', () => ({ default: () => null }));

// ─── lucide-react mock ────────────────────────────────────────────────────────
mock.module('lucide-react', () => {
  const dummyIcon = () => null;
  return {
    AlertTriangle: dummyIcon,
    ArrowLeft: dummyIcon,
    ArrowRight: dummyIcon,
    Calendar: dummyIcon,
    Check: dummyIcon,
    CheckIcon: dummyIcon,
    ChevronDown: dummyIcon,
    Edit: dummyIcon,
    Eye: dummyIcon,
    EyeOff: dummyIcon,
    Loader2: dummyIcon,
    Megaphone: dummyIcon,
    Plus: dummyIcon,
    RefreshCw: dummyIcon,
    Settings: dummyIcon,
    ShieldAlert: dummyIcon,
    ShieldCheck: dummyIcon,
    Sparkles: dummyIcon,
    Trash2: dummyIcon,
    TrendingUp: dummyIcon,
    UploadCloud: dummyIcon,
    X: dummyIcon,
  };
});

// ─── recharts mock (used by analytics panel) ─────────────────────────────────
mock.module('recharts', () => {
  const dummyComp = ({ children }: any) => children ?? null;
  return {
    ResponsiveContainer: dummyComp,
    AreaChart: dummyComp,
    Area: dummyComp,
    BarChart: dummyComp,
    Bar: dummyComp,
    Cell: dummyComp,
    XAxis: dummyComp,
    YAxis: dummyComp,
    CartesianGrid: dummyComp,
    Tooltip: dummyComp,
  };
});

// ─── crop-image utility mock ──────────────────────────────────────────────────
mock.module('@/utils/crop-image', () => ({
  getCroppedImg: async () => new Blob(),
}));

// ─── Tree traversal helper ────────────────────────────────────────────────────
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

// ─── Shared mock data ─────────────────────────────────────────────────────────
const mockAnnouncement = {
  id: 'ann-1',
  category: 'Test Category',
  categoryId: 'cat-1',
  condoName: 'Test Condo',
  contactLinks: { instagram: '', website: '', whatsapp: '' },
  createdAt: '2024-01-01T00:00:00.000Z',
  description: 'Test description',
  expiresAt: null,
  flaggedForReview: false,
  imageUrl: 'http://example.com/img.jpg',
  paidAt: null,
  priceCents: null,
  providerAssignmentId: 'assign-1',
  showVerifiedBadge: false,
  status: 'ACTIVE',
  subtitle: null,
  suspensionReason: null,
  tags: [],
  title: 'Test Announcement',
};

const mockForm = {
  categoryId: 'cat-1',
  description: 'description',
  imageUrl: 'http://example.com/img.jpg',
  instagram: '',
  price: '' as const,
  showVerifiedBadge: false,
  subtitle: '',
  title: 'Test Announcement',
  website: '',
  whatsapp: '',
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Provider route migration — no per-route padding overrides', () => {
  beforeEach(() => {
    resetHookState();
    mockDashboardData = null;
  });

  test('announcements index error state: outer div has no px-6 or py-8', async () => {
    const { Route } = await import(
      '@/routes/panel.provider.announcements.index'
    );
    const tree = renderComponent(Route.component);
    expect(tree.props?.className ?? '').not.toContain('px-6');
    expect(tree.props?.className ?? '').not.toContain('py-8');
  });

  test('announcements new: centered-form variant is present in the tree', async () => {
    const { Route } = await import('@/routes/panel.provider.announcements.new');
    const tree = renderComponent(Route.component);
    const container = findByProp(
      tree,
      'data-container-variant',
      'centered-form',
    );
    expect(container).not.toBeNull();
  });

  test('announcements new: outer element is not a plain div with mx-auto max-w-4xl', async () => {
    const { Route } = await import('@/routes/panel.provider.announcements.new');
    const tree = renderComponent(Route.component);
    // The outer element should be PanelContentContainer (a function component),
    // not the old plain <div className="mx-auto max-w-4xl ...">
    expect(typeof tree.type).toBe('function');
  });

  test('announcements $id main render: outer div has no px-6 or py-8', async () => {
    mockDashboardData = {
      announcements: {
        active: [mockAnnouncement],
        draft: [],
        expired: [],
        suspended: [],
      },
    };
    // Pre-populate useState slots so we reach the main render branch
    hookState[0] = [false, () => {}]; // isEditing
    hookState[1] = ['7d', () => {}]; // period
    hookState[2] = [mockForm, () => {}]; // form (non-null → bypass early return)

    const { Route } = await import('@/routes/panel.provider.announcements.$id');
    const tree = renderComponent(Route.component);
    expect(tree.props?.className ?? '').not.toContain('px-6');
    expect(tree.props?.className ?? '').not.toContain('py-8');
  });
});
