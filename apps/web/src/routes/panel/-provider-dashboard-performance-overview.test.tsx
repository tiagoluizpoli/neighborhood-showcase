import { describe, expect, mock, test } from 'bun:test';

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const { ProviderDashboardPerformanceOverview } = await import(
  './-provider-dashboard-performance-overview'
);

const textContent = (node: unknown): string => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (typeof node !== 'object' || node === null) return '';
  const obj = node as {
    props?: { children?: unknown; label?: unknown; value?: unknown };
  };
  const pieces: string[] = [];
  if (obj.props?.label) pieces.push(textContent(obj.props.label));
  if (obj.props?.children) {
    const ch = obj.props.children;
    if (Array.isArray(ch)) {
      pieces.push(...ch.map((c) => textContent(c)));
    } else {
      pieces.push(textContent(ch));
    }
  }
  return pieces.join('');
};

describe('ProviderDashboardPerformanceOverview', () => {
  test('renders KPI cards and period controls', () => {
    const tree = ProviderDashboardPerformanceOverview({
      announcements: {
        active: [],
        draft: [],
        expired: [],
        suspended: [],
      },
      analytics: {
        chartData: [
          {
            label: '2026-06-05',
            impressions: 10,
            clicks: 2,
          },
        ],
        isError: false,
        isLoading: false,
      },
      formatPeriodLabel: (value) =>
        value === '7d' ? '7 Days' : value === '30d' ? '30 Days' : '12 Months',
      onPeriodChange: () => {},
      period: '7d',
      stats: {
        totalImpressions: 12,
        totalInteractions: 7,
        conversionRate: 58,
      },
    });

    const content = textContent(tree);

    expect(content.includes('dashboard.kpi.impressions_label')).toBe(true);
    expect(content.includes('dashboard.kpi.interactions_label')).toBe(true);
    expect(content.includes('dashboard.kpi.conversion_label')).toBe(true);
    expect(content.includes('dashboard.kpi.announcements_label')).toBe(true);
    expect(content.includes('7 Days')).toBe(true);
    expect(content.includes('30 Days')).toBe(true);
    expect(content.includes('12 Months')).toBe(true);
  });
});
