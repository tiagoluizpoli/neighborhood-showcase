import { describe, expect, test } from 'bun:test';
import { formatProviderDashboardPeriodLabel } from './-provider-dashboard-period-label';

describe('formatProviderDashboardPeriodLabel', () => {
  test('formats known period labels', () => {
    expect(formatProviderDashboardPeriodLabel('7d')).toBe('7 Dias');
    expect(formatProviderDashboardPeriodLabel('30d')).toBe('30 Dias');
    expect(formatProviderDashboardPeriodLabel('12m')).toBe('12 Meses');
  });
});
