import { describe, expect, test } from 'bun:test';
import {
  formatProviderDashboardDate,
  formatProviderDashboardPrice,
} from './-provider-dashboard-formatters';

describe('provider dashboard formatters', () => {
  test('formats null values', () => {
    expect(formatProviderDashboardDate(null)).toBe('-');
    expect(formatProviderDashboardPrice(null)).toBe('A combinar');
  });
});
