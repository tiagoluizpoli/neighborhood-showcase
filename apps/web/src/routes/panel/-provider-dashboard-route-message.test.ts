import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';

const handleProviderDashboardMessage = mock(() => {});

// @tanstack/react-router (incl. useNavigate) is stubbed globally in test-setup.ts.

mock.module('./-provider-dashboard-message-handler', () => ({
  handleProviderDashboardMessage,
}));

const { useProviderDashboardRouteMessage } = await import(
  './-provider-dashboard-route-message'
);

describe('useProviderDashboardRouteMessage', () => {
  test('forwards message and navigation into the message handler', () => {
    renderHook(() => useProviderDashboardRouteMessage('saved'));

    expect(handleProviderDashboardMessage).toHaveBeenCalledTimes(1);
    expect(handleProviderDashboardMessage).toHaveBeenCalledWith({
      message: 'saved',
      navigate: expect.any(Function),
    });
  });
});
