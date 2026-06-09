// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals and browser APIs requires explicit any
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealReact from 'react';

// Mock localStorage for Node/Bun environment
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

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

// Mock react
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

// Mutable mock state — set in beforeEach, read by PanelLayout via mocks
let mockSession: any = null;
let mockAssignments: any[] = [];

// Mock react-i18next
mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // JSON keys already include 'sidebar.' prefix (e.g. 'sidebar.group.provedor')
      return options?.defaultValue || key;
    },
    i18n: {
      language: 'pt',
      changeLanguage: () => Promise.resolve(),
    },
  }),
}));

// Mock @tanstack/react-query
mock.module('@tanstack/react-query', () => ({
  useQuery: (options: any) => {
    if (JSON.stringify(options.queryKey).includes('getMyAssignments')) {
      return { data: mockAssignments, isPending: false, refetch: () => {} };
    }
    return { data: undefined, isPending: false, refetch: () => {} };
  },
  useMutation: () => ({
    mutate: () => {},
    isPending: false,
  }),
}));

// Mock lucide-react icons used in sidebar
mock.module('lucide-react', () => ({
  LayoutDashboard: () => 'LayoutDashboard',
  Settings: () => 'Settings',
  ShieldAlert: () => 'ShieldAlert',
  ShieldCheck: () => 'ShieldCheck',
  LineChart: () => 'LineChart',
  Megaphone: () => 'Megaphone',
  Users: () => 'Users',
  UserCog: () => 'UserCog',
  Store: () => 'Store',
  Building2: () => 'Building2',
  Monitor: () => 'Monitor',
  Sun: () => 'Sun',
  Moon: () => 'Moon',
}));

// Mock shadcn sidebar components
mock.module('@neighborhood-showcase/ui/components/sidebar', () => ({
  SidebarProvider: ({ children }: any) => children,
  Sidebar: ({ children }: any) => children,
  SidebarContent: ({ children }: any) => children,
  SidebarFooter: ({ children }: any) => children,
  SidebarGroup: ({ children }: any) => children,
  SidebarGroupContent: ({ children }: any) => children,
  SidebarGroupLabel: ({ children }: any) => children,
  SidebarHeader: ({ children }: any) => children,
  SidebarMenu: ({ children }: any) => children,
  SidebarMenuButton: (props: any) => (props.render ? props.render : null),
  SidebarMenuItem: ({ children }: any) => children,
  SidebarMenuSub: ({ children }: any) => children,
  SidebarMenuSubButton: (props: any) => (props.render ? props.render : null),
  SidebarRail: () => null,
  SidebarTrigger: () => 'SidebarTrigger',
}));

// Mock shadcn popover
mock.module('@neighborhood-showcase/ui/components/popover', () => ({
  Popover: ({ children }: any) => children,
  PopoverTrigger: (props: any) => (props.render ? props.render : null),
  PopoverContent: ({ children }: any) => children,
}));

// Mock shadcn alert-dialog
mock.module('@neighborhood-showcase/ui/components/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => children,
  AlertDialogTrigger: (props: any) => (props.render ? props.render : null),
  AlertDialogContent: ({ children }: any) => children,
  AlertDialogTitle: ({ children }: any) => children,
  AlertDialogDescription: ({ children }: any) => children,
  AlertDialogFooter: ({ children }: any) => children,
  AlertDialogCancel: ({ children }: any) => children,
  AlertDialogAction: ({ children }: any) => children,
}));

// Mock shadcn avatar
mock.module('@neighborhood-showcase/ui/components/avatar', () => ({
  Avatar: ({ children }: any) => children,
  AvatarFallback: ({ children }: any) => children,
}));

// Mock authClient
mock.module('@/lib/auth-client', () => ({
  authClient: {
    getSession: () => ({ data: mockSession }),
    useSession: () => ({ data: mockSession, isPending: false }),
    signOut: () => {},
  },
}));

// Mock @tanstack/react-router
// createFileRoute(path)(config) — first call returns a function, second call applies config
mock.module('@tanstack/react-router', () => {
  // Route config stored here so we can access it after the chained calls
  const routeConfig: any = {};

  // This is the function returned by createFileRoute(path)
  const routeFn = (config: any) => {
    // Copy config properties onto routeConfig
    if (config.beforeLoad) {
      Object.defineProperty(routeConfig, 'beforeLoad', {
        get: () => config.beforeLoad,
        enumerable: true,
      });
    }
    if (config.component) {
      Object.defineProperty(routeConfig, 'component', {
        get: () => config.component,
        enumerable: true,
      });
    }
    return routeFn; // return the function object itself so Route = routeFn
  };

  // Make routeFn.component delegate to routeConfig.component
  Object.defineProperty(routeFn, 'component', {
    get: () => routeConfig.component,
    enumerable: true,
  });
  Object.defineProperty(routeFn, 'beforeLoad', {
    get: () => routeConfig.beforeLoad,
    enumerable: true,
  });
  // useRouteContext is called by the component — return session from mock state
  Object.defineProperty(routeFn, 'useRouteContext', {
    value: () => ({ session: mockSession }),
    enumerable: true,
  });
  Object.defineProperty(routeFn, 'options', {
    value: routeConfig,
    enumerable: true,
  });

  return {
    createFileRoute: (_path: string) => routeFn,
    useNavigate: () => ({}),
    Link: (props: any) => props,
    Outlet: () => 'Outlet',
    redirect: () => {
      throw new Error('REDIRECT');
    },
  };
});

// Mock trpc
mock.module('@/utils/trpc', () => ({
  trpc: {
    assignment: {
      getMyAssignments: {
        queryOptions: () => ({ queryKey: ['getMyAssignments'] }),
      },
    },
  },
}));

// Mock theme-provider
mock.module('@/components/theme-provider', () => ({
  useTheme: () => ({
    theme: 'system',
    setTheme: () => {},
  }),
}));

// Mock theme-cycle-toggle
mock.module('@/components/theme-cycle-toggle', () => ({
  ThemeCycleToggle: () => 'ThemeCycleToggle',
}));

// Mock language-switcher
mock.module('@/components/language-switcher', () => ({
  LanguageSwitcher: () => 'LanguageSwitcher',
}));

// Tree traversal — find by prop value
const findNodeByProp = (node: any, propName: string, propValue: any): any => {
  if (!node) return null;
  // Handle primitive nodes (strings, numbers) — check if they equal the propValue
  if (typeof node === 'string') {
    return node === propValue ? node : null;
  }
  if (typeof node === 'number') {
    return String(node) === String(propValue) ? node : null;
  }
  // React element: check prop
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

// Import panel after all mocks are set up — Route.component is accessible after import
let Route: any;

describe('Panel Layout Visibility Tests', () => {
  beforeEach(async () => {
    resetHookState();
    mockSession = null;
    mockAssignments = [];
    // Import panel module — all mocks are already registered above
    const mod = await import('@/routes/panel');
    Route = mod.Route;
    // Route.component is set when panel.tsx calls createFileRoute('/panel')({component: ...})
  });

  test('plain USER with no assignments sees no moderator, admin, or spectrum groups', () => {
    mockSession = {
      data: {
        user: {
          id: 'user-1',
          name: 'Plain User',
          email: 'plain@example.com',
          role: 'USER',
        },
      },
    };
    mockAssignments = [];

    const tree = renderComponent(Route.component);

    // Moderação group label should NOT appear (no moderator assignment)
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.moderacao'),
    ).toBeNull();
    // Administração group label should NOT appear (USER role)
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.administracao'),
    ).toBeNull();
    // Spectrum group label should NOT appear (ADMINISTRATOR only)
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.spectrum'),
    ).toBeNull();
    // Provedor group always visible for authenticated users
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.provedor'),
    ).not.toBeNull();
  });

  test('PROVIDER with approved assignment sees only Provedor group', () => {
    mockSession = {
      data: {
        user: {
          id: 'user-2',
          name: 'Provider User',
          email: 'provider@example.com',
          role: 'USER',
        },
      },
    };
    mockAssignments = [
      {
        id: 'assignment-prov-1',
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'PROVIDER',
        status: 'APPROVED',
        enabled: true,
      },
    ];

    const tree = renderComponent(Route.component);

    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.provedor'),
    ).not.toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.moderacao'),
    ).toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.administracao'),
    ).toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.spectrum'),
    ).toBeNull();
  });

  test('MODERATOR with approved assignment sees Moderação group', () => {
    mockSession = {
      data: {
        user: {
          id: 'user-3',
          name: 'Moderator User',
          email: 'mod@example.com',
          role: 'USER',
        },
      },
    };
    mockAssignments = [
      {
        id: 'assignment-mod-1',
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ];

    const tree = renderComponent(Route.component);

    // Moderação group visible (approved MODERATOR assignment)
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.moderacao'),
    ).not.toBeNull();
    // Provedor always visible
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.provedor'),
    ).not.toBeNull();
    // No admin role → no Administração or Spectrum
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.administracao'),
    ).toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.spectrum'),
    ).toBeNull();
  });

  test('SYSTEM_MANAGER sees Administração group', () => {
    mockSession = {
      data: {
        user: {
          id: 'user-4',
          name: 'System Manager',
          email: 'sysman@example.com',
          role: 'SYSTEM_MANAGER',
        },
      },
    };
    mockAssignments = [];

    const tree = renderComponent(Route.component);

    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.administracao'),
    ).not.toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.provedor'),
    ).not.toBeNull();
    // Spectrum only for ADMINISTRATOR
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.spectrum'),
    ).toBeNull();
  });

  test('ADMINISTRATOR sees Spectrum group (Moderação requires moderator assignment)', () => {
    mockSession = {
      data: {
        user: {
          id: 'user-5',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMINISTRATOR',
        },
      },
    };
    mockAssignments = [];

    const tree = renderComponent(Route.component);

    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.provedor'),
    ).not.toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.administracao'),
    ).not.toBeNull();
    // Spectrum — ADMINISTRATOR only
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.spectrum'),
    ).not.toBeNull();
    // Moderação — requires moderator assignment (none here)
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.moderacao'),
    ).toBeNull();
  });

  test('ADMINISTRATOR with moderator assignment sees all four groups', () => {
    mockSession = {
      data: {
        user: {
          id: 'user-6',
          name: 'Admin+Mod User',
          email: 'adminmod@example.com',
          role: 'ADMINISTRATOR',
        },
      },
    };
    mockAssignments = [
      {
        id: 'assignment-mod-2',
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ];

    const tree = renderComponent(Route.component);

    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.provedor'),
    ).not.toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.moderacao'),
    ).not.toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.administracao'),
    ).not.toBeNull();
    expect(
      findNodeByProp(tree, 'children', 'sidebar.group.spectrum'),
    ).not.toBeNull();
  });
});
