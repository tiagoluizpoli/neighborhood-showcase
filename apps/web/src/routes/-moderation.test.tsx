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

// Dynamic import for component
const { Route: ModerationRoute } = await import('./panel.moderation');

// Set mock context
let mockSession: any = { data: { user: { role: 'SYSTEM_MANAGER' } } };
let mockModeratorAssignments: any[] = [];

ModerationRoute.useRouteContext = () => ({
  session: mockSession,
  moderatorAssignments: mockModeratorAssignments,
});

const findElementByText = (node: any, text: string): any => {
  if (!node) return null;
  if (typeof node === 'string' && node.includes(text)) return node;
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

describe('Moderation Dashboard Component Visuals', () => {
  beforeEach(() => {
    resetHookState();
    mockSession = { data: { user: { role: 'SYSTEM_MANAGER' } } };
    mockModeratorAssignments = [
      {
        condominiumId: 'condo-1',
        condominium: { id: 'condo-1', name: 'Condo Alpha' },
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ];
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

  test('renders title and sub-tabs correctly', () => {
    const component = ModerationRoute.options.component;
    const tree = renderComponent(component);

    // Should find title key
    expect(findElementByText(tree, 'moderation.title')).not.toBeNull();
  });

  test('displays reported announcements with counts and reasons in reports view', () => {
    const component = ModerationRoute.options.component;
    mockModeratorAssignments = []; // Forces default to 'reports'

    resetHookState();
    const tree = renderComponent(component);

    // Verify reported ad title is present
    expect(findElementByText(tree, 'Reported Ad Title')).not.toBeNull();
    // Verify provider details
    expect(findElementByText(tree, 'John Spam')).not.toBeNull();
    expect(findElementByText(tree, 'john@spam.com')).not.toBeNull();
    // Verify total reports count text
    expect(findElementByText(tree, 'Denúncias')).not.toBeNull();
  });

  test('ban provider button is visible to SYSTEM_MANAGER and hidden from PROVIDER', () => {
    const component = ModerationRoute.options.component;

    // 1. SYSTEM_MANAGER context
    mockModeratorAssignments = []; // Forces reports view
    mockSession = { data: { user: { role: 'SYSTEM_MANAGER' } } };
    resetHookState();
    let tree = renderComponent(component);
    expect(findElementByText(tree, 'moderation.ban')).not.toBeNull();

    // 2. PROVIDER context
    mockSession = { data: { user: { role: 'PROVIDER' } } };
    resetHookState();
    tree = renderComponent(component);
    expect(findElementByText(tree, 'moderation.ban')).toBeNull();
  });
});
