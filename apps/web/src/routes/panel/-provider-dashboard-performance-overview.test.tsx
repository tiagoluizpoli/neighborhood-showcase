import { describe, expect, test } from 'bun:test';

const { ProviderDashboardPerformanceOverview } = await import(
  './-provider-dashboard-performance-overview'
);

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

describe('ProviderDashboardPerformanceOverview', () => {
  test('renders stats cards and period controls', () => {
    const tree = ProviderDashboardPerformanceOverview({
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
        value === '7d' ? '7 Dias' : value === '30d' ? '30 Dias' : '12 Meses',
      onPeriodChange: () => {},
      period: '7d',
      stats: {
        totalImpressions: 12,
        totalInteractions: 7,
        conversionRate: 58,
      },
    });

    const content = textContent(tree);

    expect(content.includes('Visualizações')).toBe(true);
    expect(content.includes('Interações')).toBe(true);
    expect(content.includes('Taxa de Conversão')).toBe(true);
    expect(content.includes('7 Dias')).toBe(true);
    expect(content.includes('30 Dias')).toBe(true);
    expect(content.includes('12 Meses')).toBe(true);
  });
});
