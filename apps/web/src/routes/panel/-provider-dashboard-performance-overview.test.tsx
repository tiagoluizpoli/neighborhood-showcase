import { beforeEach, describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ProviderDashboardPerformanceOverview } from './-provider-dashboard-performance-overview';
import i18n from '@/i18n';

// Real i18n + <I18nextProvider>, assert real pt strings. A partial react-i18next
// mock is process-global under bun and would break every other `@/i18n` importer.

describe('ProviderDashboardPerformanceOverview', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
  });

  test('renders KPI cards and period controls', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ProviderDashboardPerformanceOverview
          announcements={{
            active: [],
            draft: [],
            expired: [],
            suspended: [],
          }}
          analytics={{
            chartData: [
              {
                label: '2026-06-05',
                impressions: 10,
                clicks: 2,
              },
            ],
            isError: false,
            isLoading: false,
          }}
          formatPeriodLabel={(value) =>
            value === '7d'
              ? '7 Days'
              : value === '30d'
                ? '30 Days'
                : '12 Months'
          }
          onPeriodChange={() => {}}
          period="7d"
          stats={{
            totalImpressions: 12,
            totalInteractions: 7,
            conversionRate: 58,
          }}
        />
      </I18nextProvider>,
    );

    expect(screen.getByText('Visualizações')).toBeTruthy();
    expect(screen.getByText('Interações')).toBeTruthy();
    expect(screen.getByText('Taxa de Conversão')).toBeTruthy();
    expect(screen.getByText('Anúncios')).toBeTruthy();
    expect(screen.getByText('7 Days')).toBeTruthy();
    expect(screen.getByText('30 Days')).toBeTruthy();
    expect(screen.getByText('12 Months')).toBeTruthy();
  });
});
