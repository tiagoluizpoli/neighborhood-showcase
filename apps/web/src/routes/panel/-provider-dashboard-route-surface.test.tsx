import { describe, expect, mock, test } from 'bun:test';
import * as RealReact from 'react';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';

mock.module('react', () => ({
  ...RealReact,
  useEffect: (callback: () => void) => {
    callback();
  },
}));

mock.module('@tanstack/react-router', () => ({
  useNavigate: () => () => {},
}));

mock.module('./-provider-dashboard-message-handler', () => ({
  handleProviderDashboardMessage: mock(() => {}),
}));

mock.module('./-provider-dashboard-state', () => ({
  useProviderDashboardState: () => ({
    activeTab: 'active',
    analyticsQuery: {
      data: {
        chartData: [],
      },
      isError: false,
      isLoading: false,
    },
    dashboardQuery: {
      data: {
        announcements: {
          active: [baseAnnouncement],
          draft: [],
          expired: [],
          suspended: [],
        },
        stats: {
          conversionRate: 20,
          totalImpressions: 15,
          totalInteractions: 3,
        },
      },
      isError: false,
      isLoading: false,
    },
    editingAd: null,
    handleEditSuccess: () => {},
    handlePay: () => {},
    handleRenew: () => {},
    period: '7d',
    renewMutation: {},
    setActiveTab: () => {},
    setEditingAd: () => {},
    setPeriod: () => {},
    setViewingAnalyticsAd: () => {},
    viewingAnalyticsAd: null,
  }),
}));

const { ProviderDashboardRouteSurface } = await import(
  './-provider-dashboard-route-surface'
);

const baseAnnouncement = {
  id: 'ad-1',
  title: 'Bolos caseiros',
  description: 'Bolos sob encomenda para festas e aniversários.',
  imageUrl: 'https://example.com/image.jpg',
  category: 'Doces',
  condoName: 'Residencial Aurora',
  status: 'ACTIVE',
  flaggedForReview: false,
  showVerifiedBadge: true,
  priceCents: 4500,
  expiresAt: '2026-06-30T12:00:00.000Z',
  suspensionReason: null,
} satisfies ProviderDashboardAnnouncementItem;

const textContent = (node: unknown): string => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (typeof node !== 'object' || node === null) return '';
  const children = (node as { props?: { children?: unknown } }).props?.children;
  if (!children) return '';
  if (Array.isArray(children)) {
    return children.map((child) => textContent(child)).join('');
  }
  return textContent(children);
};

const findElement = (
  node: unknown,
  predicate: (el: {
    props?: { [key: string]: unknown };
    type?: unknown;
  }) => boolean,
): { props?: { [key: string]: unknown }; type?: unknown } | null => {
  if (!node) return null;
  if (
    predicate(node as { props?: { [key: string]: unknown }; type?: unknown })
  ) {
    return node as { props?: { [key: string]: unknown }; type?: unknown };
  }
  if (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    typeof (node as { type?: unknown }).type === 'function'
  ) {
    try {
      const evaluated = (
        node as { type: (props?: unknown) => unknown; props?: unknown }
      ).type?.((node as { props?: unknown }).props);
      const found = findElement(evaluated, predicate);
      if (found) return found;
    } catch (_error) {}
  }
  const children =
    typeof node === 'object' && node !== null
      ? (node as { props?: { children?: unknown } }).props?.children
      : null;
  if (children) {
    const items = Array.isArray(children) ? children : [children];
    for (const child of items) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
  }
  return null;
};

describe('ProviderDashboardRouteSurface', () => {
  test('renders the dashboard shell with the composed content', () => {
    const tree = ProviderDashboardRouteSurface({
      displayName: 'John Analytics',
      message: '',
    });

    expect(
      findElement(tree, (element) =>
        textContent(element).includes('John Analytics'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) =>
        textContent(element).includes('Visualizações'),
      ),
    ).toBeTruthy();
    expect(
      findElement(tree, (element) => textContent(element).includes('Ativos')),
    ).toBeTruthy();
  });
});
