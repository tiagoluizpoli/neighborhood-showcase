import { describe, expect, test } from 'bun:test';
import { handleProviderDashboardMessage } from './-provider-dashboard-message-handler';

describe('handleProviderDashboardMessage', () => {
  test('does nothing when message is empty', () => {
    let navigated = false;

    const result = handleProviderDashboardMessage({
      message: undefined,
      navigate: () => {
        navigated = true;
      },
    });

    expect(result).toBeUndefined();
    expect(navigated).toBe(false);
  });
});
