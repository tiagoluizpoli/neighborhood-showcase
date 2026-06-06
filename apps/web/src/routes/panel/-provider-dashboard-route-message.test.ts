import { describe, expect, mock, test } from 'bun:test';
import * as RealReact from 'react';

const handleProviderDashboardMessage = mock(() => {});

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
  handleProviderDashboardMessage,
}));

const { useProviderDashboardRouteMessage } = await import(
  './-provider-dashboard-route-message'
);

describe('useProviderDashboardRouteMessage', () => {
  test('forwards message and navigation into the message handler', () => {
    useProviderDashboardRouteMessage('saved');

    expect(handleProviderDashboardMessage).toHaveBeenCalledTimes(1);
    expect(handleProviderDashboardMessage).toHaveBeenCalledWith({
      message: 'saved',
      navigate: expect.any(Function),
    });
  });
});
