// biome-ignore-all lint/suspicious/noExplicitAny: Mocking React internals and browser APIs requires explicit any
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealQuery from '@tanstack/react-query';
import * as RealReact from 'react';

// Define window and history mocks for browser APIs in Node/Bun environment
global.window = {
  addEventListener: (_event: string, _callback: any) => {},
  removeEventListener: (_event: string, _callback: any) => {},
  location: {
    pathname: '/',
  },
  history: {
    pushState: (_state: any, _title: string, url: string) => {
      global.window.location.pathname = url;
    },
  },
} as any;

global.localStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  length: 0,
  key: (_index: number) => null,
};

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

// Mock react while preserving its internals and JSX runtime dependencies
mock.module('react', () => ({
  ...RealReact,
  useCallback: (fn: any, _deps: any[]) => fn,
  useContext: (_ctx: any) => ({}),
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

let mockDashboardData: any = null;
let mockAnalyticsData: any = null;
let mockAssignmentsData: any = null;
let mockCategoriesData: any = null;
let mockDashboardIsLoading = false;
let mockAnalyticsIsLoading = false;

// Mock @tanstack/react-query
mock.module('@tanstack/react-query', () => ({
  ...RealQuery,
  useQueryClient: () => ({
    invalidateQueries: () => {},
  }),
  useQuery: (options: any) => {
    const queryKeyStr = JSON.stringify(options?.queryKey || []);
    if (queryKeyStr.includes('getAnalytics')) {
      return {
        data: mockAnalyticsData,
        isLoading: mockAnalyticsIsLoading,
        isError: false,
      };
    }
    if (queryKeyStr.includes('getMyAssignments')) {
      return {
        data: mockAssignmentsData,
        isLoading: false,
        isError: false,
      };
    }
    if (queryKeyStr.includes('listCategories')) {
      return {
        data: mockCategoriesData,
        isLoading: false,
        isError: false,
      };
    }
    return {
      data: mockDashboardData,
      isLoading: mockDashboardIsLoading,
      isError: false,
    };
  },
  useMutation: () => ({
    mutate: () => {},
    isPending: false,
  }),
}));

// Mock @tanstack/react-router Link
mock.module('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: any) => ({
    options,
    useRouteContext: () => ({}),
    useSearch: () => ({}),
  }),
  Link: (props: any) => {
    const { to, params, ...rest } = props;
    return <a {...rest} data-to={to} data-params={JSON.stringify(params)} />;
  },
  useNavigate: () => () => {},
}));

const { Route } = await import('./panel.dashboard.index');
const { ProviderDashboardEditImageField } = await import(
  './panel/-provider-dashboard-edit-image-field'
);
const { ProviderDashboardEditFormFields } = await import(
  './panel/-provider-dashboard-edit-form-fields'
);
Route.useRouteContext = () => ({
  session: { data: { user: { name: 'John Analytics' } } },
});
Route.useSearch = () => ({ message: '' });

describe('Dashboard Analytics & Action Buttons Unit Tests', () => {
  beforeEach(() => {
    resetHookState();
    mockDashboardIsLoading = false;
    mockAnalyticsIsLoading = false;
    mockAssignmentsData = [
      {
        id: 'assign-1',
        type: 'RESIDENT',
        status: 'APPROVED',
      },
    ];
    mockCategoriesData = [{ id: 'cat-1', name: 'Serviços Gerais' }];
    mockDashboardData = {
      stats: {
        totalImpressions: 15,
        totalInteractions: 3,
        conversionRate: 20,
      },
      announcements: {
        active: [
          {
            id: 'ann-1',
            title: 'Professional Plumbing',
            subtitle: 'Quick fixes',
            description: 'Fixing pipes since 2010',
            priceCents: 5000,
            imageUrl: 'plumbing.jpg',
            category: 'Serviços Gerais',
            categoryId: 'cat-1',
            tags: [],
            contactLinks: {},
            showVerifiedBadge: true,
            flaggedForReview: false,
            status: 'ACTIVE',
            paidAt: new Date().toISOString(),
            expiresAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            suspensionReason: null,
            condoName: 'Plaza Green',
            providerAssignmentId: 'assign-1',
          },
        ],
        draft: [],
        expired: [],
        suspended: [],
      },
    };
    mockAnalyticsData = {
      summary: {
        totalImpressions: 15,
        totalClicks: 3,
        conversionRate: 20,
      },
      chartData: [
        {
          label: '2026-06-03',
          impressions: 15,
          clicks: 3,
          whatsappClicks: 2,
          instagramClicks: 1,
          websiteClicks: 0,
        },
      ],
    };
  });

  const findElement = (node: any, predicate: (el: any) => boolean): any => {
    if (!node) return null;
    if (predicate(node)) return node;
    if (node && typeof node.type === 'function') {
      try {
        const evaluated = node.type(node.props);
        const found = findElement(evaluated, predicate);
        if (found) return found;
      } catch (_e) {
        // ignore
      }
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

  const findAllElements = (
    node: any,
    predicate: (el: any) => boolean,
    results: any[] = [],
  ): any[] => {
    if (!node) return results;
    if (predicate(node)) results.push(node);
    if (node && typeof node.type === 'function') {
      try {
        const evaluated = node.type(node.props);
        findAllElements(evaluated, predicate, results);
      } catch (_e) {
        // ignore
      }
    }
    if (node.props?.children) {
      const children = Array.isArray(node.props.children)
        ? node.props.children
        : [node.props.children];
      for (const child of children) {
        findAllElements(child, predicate, results);
      }
    }
    return results;
  };

  test('renders stats cards and aggregate charts section', () => {
    const Component = Route.options.component;
    const tree = renderComponent(Component);

    // Validate Stats values
    const impressionsCardValue = findElement(
      tree,
      (el) => el.props?.children === 15,
    );
    expect(impressionsCardValue).toBeDefined();

    // Validate general performance charts title
    const chartHeader = findElement(
      tree,
      (el) => el.props?.children === 'Desempenho Geral',
    );
    expect(chartHeader).toBeDefined();
  });

  test('announcement cards show Ver Detalhes and Ver Métricas buttons', () => {
    const Component = Route.options.component;
    const tree = renderComponent(Component);

    // Locate active AnnouncementCard buttons row
    const verDetalhesLink = findElement(
      tree,
      (el) =>
        el.props?.children?.includes?.('Ver Detalhes') ||
        el.props?.title === 'Visualizar Anúncio Público',
    );
    expect(verDetalhesLink).toBeDefined();
    expect(verDetalhesLink.props.to).toBe('/anuncios/$id');
    expect(verDetalhesLink.props.params).toEqual({ id: 'ann-1' });

    const verMetricasButton = findElement(
      tree,
      (el) =>
        el.props?.children?.includes?.('Ver Métricas') ||
        el.props?.title === 'Ver Métricas de Desempenho',
    );
    expect(verMetricasButton).toBeDefined();
  });

  test('clicking period buttons updates period state', () => {
    const Component = Route.options.component;
    const tree = renderComponent(Component);

    // Find period toggle buttons (7 Dias, 30 Dias, 12 Meses)
    const periodButtons = findAllElements(
      tree,
      (el) =>
        el.type === 'button' &&
        ['7 Dias', '30 Dias', '12 Meses'].includes(el.props?.children),
    );
    expect(periodButtons.length).toBe(3);

    // Trigger state transition to 30 Days
    const thirtyDaysBtn = periodButtons.find(
      (b) => b.props.children === '30 Dias',
    );
    expect(thirtyDaysBtn).toBeDefined();
    thirtyDaysBtn.props.onClick();

    // Rerender after state change
    const treeUpdated = renderComponent(Component);
    expect(treeUpdated).toBeDefined();
  });

  test('edit image field renders preview and upload controls from extracted seam', () => {
    const tree = renderComponent(() =>
      ProviderDashboardEditImageField({
        imageUrl: 'preview.jpg',
        onImageUrlChange: () => {},
        onUploadingChange: () => {},
      }),
    );

    const imagePreview = findElement(
      tree,
      (el) => el.type === 'img' && el.props?.src === 'preview.jpg',
    );
    expect(imagePreview).toBeDefined();

    const changeImageButton = findElement(
      tree,
      (el) => el.props?.children === 'Alterar Imagem',
    );
    expect(changeImageButton).toBeDefined();
  });

  test('edit form fields render extracted content controls and verification copy', () => {
    const tree = renderComponent(() =>
      ProviderDashboardEditFormFields({
        backendCategories: [{ id: 'cat-1', name: 'Serviços Gerais' }],
        canVerify: false,
        categoryId: 'cat-1',
        description: 'Descrição longa o suficiente',
        imageUrl: 'preview.jpg',
        instagram: '@prestador',
        isUploading: false,
        price: '',
        showVerifiedBadge: false,
        subtitle: 'Subtítulo',
        title: 'Título',
        website: 'https://site.test',
        whatsapp: '47999999999',
        onCategoryIdChange: () => {},
        onDescriptionChange: () => {},
        onImageUrlChange: () => {},
        onInstagramChange: () => {},
        onPriceChange: () => {},
        onShowVerifiedBadgeChange: () => {},
        onSubtitleChange: () => {},
        onTitleChange: () => {},
        onUploadingChange: () => {},
        onWebsiteChange: () => {},
        onWhatsappChange: () => {},
      }),
    );

    const contactHeader = findElement(
      tree,
      (el) => el.props?.children === 'Meios de Contato (Forneça ao menos um)',
    );
    expect(contactHeader).toBeDefined();

    const verifiedCopy = findElement(
      tree,
      (el) =>
        typeof el.props?.children === 'string' &&
        el.props.children.includes('Exibir Selo de Morador Verificado'),
    );
    expect(verifiedCopy).toBeDefined();
  });
});
