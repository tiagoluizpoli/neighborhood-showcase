import { beforeEach, describe, expect, mock, test } from 'bun:test';

// Mutable state read by mocks
let mockProviderEnabled = false;
let mockSessionData: { user: { role: string } } | null = null;

const mockRedirect = (opts: {
  to: string;
  search?: Record<string, string>;
}) => {
  const err = Object.assign(new Error('REDIRECT'), {
    isRedirect: true,
    ...opts,
  });
  throw err;
};

mock.module('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (config: unknown) => config,
  Outlet: () => null,
  redirect: mockRedirect,
}));

mock.module('@/routes/panel/-user-access-profile', () => ({
  getUserAccessProfile: async () => ({ providerEnabled: mockProviderEnabled }),
}));

// Import route after mocks
let routeConfig: {
  beforeLoad?: (ctx: { context: { session: unknown } }) => Promise<void>;
};

describe('Provider route-group guard — beforeLoad', () => {
  beforeEach(async () => {
    mockProviderEnabled = false;
    mockSessionData = { user: { role: 'USER' } };
    const mod = await import('@/routes/panel.provider');
    routeConfig = mod.Route as typeof routeConfig;
  });

  test('provider-enabled user passes through without redirect', async () => {
    mockProviderEnabled = true;
    const context = { session: { data: mockSessionData } };
    await expect(
      routeConfig.beforeLoad?.({ context }),
    ).resolves.toBeUndefined();
  });

  test('non-provider user is redirected', async () => {
    mockProviderEnabled = false;
    const context = { session: { data: mockSessionData } };
    await expect(routeConfig.beforeLoad?.({ context })).rejects.toMatchObject({
      isRedirect: true,
      to: '/panel/dashboard',
    });
  });

  test('unauthenticated user is redirected to root', async () => {
    const context = { session: null };
    await expect(routeConfig.beforeLoad?.({ context })).rejects.toMatchObject({
      isRedirect: true,
      to: '/',
    });
  });
});
