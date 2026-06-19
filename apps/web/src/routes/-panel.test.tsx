// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals and browser APIs requires explicit any
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealReact from 'react';

// Mock localStorage for Node/Bun environment
const localStorageState = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => localStorageState.get(key) ?? null,
  setItem: (key: string, value: string) => {
    localStorageState.set(key, value);
  },
  removeItem: (key: string) => {
    localStorageState.delete(key);
  },
  clear: () => {
    localStorageState.clear();
  },
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
let mockAccessProfile: any = { providerEnabled: false };

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
      return {
        data: mockAssignments,
        isPending: false,
        isLoading: false,
        refetch: () => {},
      };
    }
    if (JSON.stringify(options.queryKey).includes('getAccessProfile')) {
      return {
        data: mockAccessProfile,
        isPending: false,
        isLoading: false,
        refetch: () => {},
      };
    }
    return {
      data: undefined,
      isPending: false,
      isLoading: false,
      refetch: () => {},
    };
  },
  useMutation: () => ({
    mutate: () => {},
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: () => {},
    setQueryData: () => {},
    getQueryData: () => undefined,
  }),
}));

// Mock lucide-react icons used in sidebar
mock.module('lucide-react', () => ({
  ChevronDown: () => 'ChevronDown',
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
  AvatarImage: (_props: any) => null,
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
    user: {
      getAccessProfile: {
        queryOptions: () => ({ queryKey: ['getAccessProfile'] }),
      },
    },
  },
  trpcClient: {
    user: {
      getAccessProfile: {
        query: async () => mockAccessProfile,
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

// Tree traversal — find by React key (set on SidebarGroupSection elements by PanelLayout)
// The group key equals group.i18nGroupKey (e.g. 'sidebar.group.moderacao')
const findNodeByKey = (node: any, keyValue: string): any => {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNodeByKey(child, keyValue);
      if (found) return found;
    }
    return null;
  }
  if (node.key === keyValue) return node;
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findNodeByKey(child, keyValue);
      if (found) return found;
    }
  }
  return null;
};

const findNodeByType = (node: any, typeValue: string): any => {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNodeByType(child, typeValue);
      if (found) return found;
    }
    return null;
  }
  if (node.type === typeValue) return node;
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findNodeByType(child, typeValue);
      if (found) return found;
    }
  }
  return null;
};

const findNodeByClassName = (node: any, classNameValue: string): any => {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNodeByClassName(child, classNameValue);
      if (found) return found;
    }
    return null;
  }
  if (node.props?.className === classNameValue) return node;
  if (node.props?.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findNodeByClassName(child, classNameValue);
      if (found) return found;
    }
  }
  return null;
};

const collectText = (node: any): string[] => {
  if (typeof node === 'string') {
    return [node];
  }
  if (!node || typeof node !== 'object') {
    return [];
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectText(child));
  }
  return collectText(node.props?.children);
};

const readTextContent = (node: any): string => collectText(node).join(' ');

const setMockPathname = (pathname: string) => {
  Object.defineProperty(globalThis, 'location', {
    value: { pathname },
    writable: true,
    configurable: true,
  });
};

// Import panel after all mocks are set up — Route.component is accessible after import
let Route: any;

describe('Panel Layout Visibility Tests', () => {
  beforeEach(async () => {
    resetHookState();
    mockSession = null;
    mockAssignments = [];
    mockAccessProfile = { providerEnabled: false };
    localStorageMock.clear();
    setMockPathname('/panel');
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
    expect(findNodeByKey(tree, 'sidebar.group.moderacao')).toBeNull();
    // Administração group label should NOT appear (USER role)
    expect(findNodeByKey(tree, 'sidebar.group.administracao')).toBeNull();
    // Spectrum group label should NOT appear (ADMINISTRATOR only)
    expect(findNodeByKey(tree, 'sidebar.group.spectrum')).toBeNull();
    // Provedor group hidden for users without an approved PROVIDER assignment
    expect(findNodeByKey(tree, 'sidebar.group.provedor')).toBeNull();
  });

  test('RESIDENT with approved assignment sees only Provedor group', () => {
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
        type: 'RESIDENT',
        status: 'APPROVED',
      },
    ];
    mockAccessProfile = { providerEnabled: true };

    const tree = renderComponent(Route.component);

    expect(findNodeByKey(tree, 'sidebar.group.provedor')).not.toBeNull();
    expect(findNodeByKey(tree, 'sidebar.group.moderacao')).toBeNull();
    expect(findNodeByKey(tree, 'sidebar.group.administracao')).toBeNull();
    expect(findNodeByKey(tree, 'sidebar.group.spectrum')).toBeNull();
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
    expect(findNodeByKey(tree, 'sidebar.group.moderacao')).not.toBeNull();
    // No PROVIDER assignment → Provedor group hidden
    expect(findNodeByKey(tree, 'sidebar.group.provedor')).toBeNull();
    // No admin role → no Administração or Spectrum
    expect(findNodeByKey(tree, 'sidebar.group.administracao')).toBeNull();
    expect(findNodeByKey(tree, 'sidebar.group.spectrum')).toBeNull();
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

    expect(findNodeByKey(tree, 'sidebar.group.administracao')).not.toBeNull();
    // No PROVIDER assignment → Provedor group hidden
    expect(findNodeByKey(tree, 'sidebar.group.provedor')).toBeNull();
    // Spectrum only for ADMINISTRATOR
    expect(findNodeByKey(tree, 'sidebar.group.spectrum')).toBeNull();
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

    // No PROVIDER assignment → Provedor group hidden
    expect(findNodeByKey(tree, 'sidebar.group.provedor')).toBeNull();
    expect(findNodeByKey(tree, 'sidebar.group.administracao')).not.toBeNull();
    // Spectrum — ADMINISTRATOR only
    expect(findNodeByKey(tree, 'sidebar.group.spectrum')).not.toBeNull();
    // Moderação — requires moderator assignment (none here)
    expect(findNodeByKey(tree, 'sidebar.group.moderacao')).toBeNull();
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

    // No PROVIDER assignment → Provedor group hidden even for ADMINISTRATOR+MODERATOR
    expect(findNodeByKey(tree, 'sidebar.group.provedor')).toBeNull();
    expect(findNodeByKey(tree, 'sidebar.group.moderacao')).not.toBeNull();
    expect(findNodeByKey(tree, 'sidebar.group.administracao')).not.toBeNull();
    expect(findNodeByKey(tree, 'sidebar.group.spectrum')).not.toBeNull();
  });

  test('provider announcement route chrome shows provider section context', () => {
    mockSession = {
      data: {
        user: {
          id: 'user-7',
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
        type: 'RESIDENT',
        status: 'APPROVED',
      },
    ];
    mockAccessProfile = { providerEnabled: true };
    setMockPathname('/panel/provider/announcements');

    const tree = renderComponent(Route.component);
    const sidebarHeaderContent = findNodeByClassName(
      tree,
      'min-w-0 flex-1 group-data-[collapsible=icon]:hidden',
    );
    const topBar = findNodeByType(tree, 'header');

    expect(sidebarHeaderContent).not.toBeNull();
    expect(readTextContent(sidebarHeaderContent)).toContain(
      'Neighborhood Showcase',
    );
    expect(readTextContent(sidebarHeaderContent)).toContain(
      'sidebar.item.meus_anuncios',
    );
    expect(topBar).not.toBeNull();
    expect(readTextContent(topBar)).toContain('sidebar.group.provedor');
    expect(readTextContent(topBar)).toContain('sidebar.item.meus_anuncios');
  });

  test('moderation chrome shows selected condo context in sidebar header and top bar', () => {
    mockSession = {
      data: {
        user: {
          id: 'user-8',
          name: 'Moderator User',
          email: 'moderator@example.com',
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
      {
        id: 'assignment-mod-2',
        condominiumId: 'condo-2',
        condominium: { id: 'condo-2', name: 'Condo Beta' },
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ];
    localStorageMock.setItem('mod_ctx__cndo', 'condo-2');
    setMockPathname('/panel/moderation/condominium');

    const tree = renderComponent(Route.component);
    const sidebarHeaderContent = findNodeByClassName(
      tree,
      'min-w-0 flex-1 group-data-[collapsible=icon]:hidden',
    );
    const topBar = findNodeByType(tree, 'header');

    expect(sidebarHeaderContent).not.toBeNull();
    expect(readTextContent(sidebarHeaderContent)).toContain(
      'Neighborhood Showcase',
    );
    expect(readTextContent(sidebarHeaderContent)).toContain('Condo Beta');
    expect(topBar).not.toBeNull();
    expect(readTextContent(topBar)).toContain('sidebar.group.moderacao');
    expect(readTextContent(topBar)).toContain('sidebar.item.condominium_info');
    expect(readTextContent(topBar)).toContain('Condo Beta');
  });
});
