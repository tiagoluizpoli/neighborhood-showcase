import { describe, expect, test } from 'bun:test';
import { ProviderDashboardContent } from './-provider-dashboard-content';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';

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

describe('ProviderDashboardContent', () => {
  test('renders dashboard composition with the current route state', () => {
    const tree = ProviderDashboardContent({
      dashboardData: {
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
      displayName: 'John Analytics',
      state: {
        activeTab: 'active',
        analyticsQuery: {
          data: {
            chartData: [
              {
                clicks: 3,
                impressions: 15,
                label: '2026-06-03',
              },
            ],
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
      },
    });

    const children = (
      tree as {
        props?: { children?: unknown };
      }
    ).props?.children as unknown[];
    const renderedChildren = children.filter(Boolean);

    expect((tree as { type?: unknown }).type).toBe('div');
    expect(Array.isArray(children)).toBe(true);
    expect((renderedChildren[0] as { type?: unknown }).type).toBeTruthy();
    expect((renderedChildren[1] as { type?: unknown }).type).toBeTruthy();
    expect((renderedChildren[2] as { type?: unknown }).type).toBeTruthy();
    expect(renderedChildren.length).toBe(3);
  });
});
