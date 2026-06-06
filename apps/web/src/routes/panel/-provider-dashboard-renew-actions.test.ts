import { describe, expect, test } from 'bun:test';
import { createProviderDashboardRenewActions } from './-provider-dashboard-renew-actions';

describe('createProviderDashboardRenewActions', () => {
  test('returns success and error handlers', () => {
    const actions = createProviderDashboardRenewActions({
      navigate: () => {},
    });

    expect(typeof actions.onSuccess).toBe('function');
    expect(typeof actions.onError).toBe('function');
  });
});
