import { beforeEach, describe, expect, mock, test } from 'bun:test';

let mockProviderEnabled = false;
let mockSessionData: { user: { role: string } } | null = null;
let mockAssignments: Array<{
  type: string;
  status: string;
  condominiumId: string | null;
}> = [];

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

mock.module('@/utils/trpc', () => ({
  trpcClient: {
    assignment: {
      getMyAssignments: {
        query: async () => mockAssignments,
      },
    },
  },
}));

type ShimBeforeLoad = (ctx: {
  location: { pathname: string; search?: Record<string, string> };
  context: { session: unknown };
}) => Promise<void>;

let routeConfig: {
  beforeLoad?: ShimBeforeLoad;
  options?: { beforeLoad?: ShimBeforeLoad };
};

const SHIM_PATH = '/panel/dashboard';

describe('Dashboard shim — beforeLoad', () => {
  beforeEach(async () => {
    mockProviderEnabled = false;
    mockAssignments = [];
    mockSessionData = { user: { role: 'USER' } };
    const mod = await import('@/routes/panel.dashboard');
    routeConfig = mod.Route as typeof routeConfig;
  });

  test('unauthenticated user is redirected to root', async () => {
    const context = { session: null };
    const beforeLoad =
      routeConfig.beforeLoad || routeConfig.options?.beforeLoad;
    await expect(
      beforeLoad?.({
        location: { pathname: SHIM_PATH, search: {} },
        context,
      }),
    ).rejects.toMatchObject({ isRedirect: true, to: '/' });
  });

  test('SYSTEM_MANAGER is redirected to /panel/admin', async () => {
    mockSessionData = { user: { role: 'SYSTEM_MANAGER' } };
    const context = { session: { data: mockSessionData } };
    const beforeLoad =
      routeConfig.beforeLoad || routeConfig.options?.beforeLoad;
    await expect(
      beforeLoad?.({
        location: { pathname: SHIM_PATH, search: {} },
        context,
      }),
    ).rejects.toMatchObject({ isRedirect: true, to: '/panel/admin' });
  });

  test('ADMINISTRATOR is redirected to /panel/admin', async () => {
    mockSessionData = { user: { role: 'ADMINISTRATOR' } };
    const context = { session: { data: mockSessionData } };
    const beforeLoad =
      routeConfig.beforeLoad || routeConfig.options?.beforeLoad;
    await expect(
      beforeLoad?.({
        location: { pathname: SHIM_PATH, search: {} },
        context,
      }),
    ).rejects.toMatchObject({ isRedirect: true, to: '/panel/admin' });
  });

  test('moderator user is redirected to /panel/moderation', async () => {
    mockAssignments = [
      { type: 'MODERATOR', status: 'APPROVED', condominiumId: 'condo-123' },
    ];
    const context = { session: { data: mockSessionData } };
    const beforeLoad =
      routeConfig.beforeLoad || routeConfig.options?.beforeLoad;
    await expect(
      beforeLoad?.({
        location: { pathname: SHIM_PATH, search: {} },
        context,
      }),
    ).rejects.toMatchObject({ isRedirect: true, to: '/panel/moderation' });
  });

  test('provider-enabled user is redirected to /panel/provider', async () => {
    mockProviderEnabled = true;
    const context = { session: { data: mockSessionData } };
    const beforeLoad =
      routeConfig.beforeLoad || routeConfig.options?.beforeLoad;
    await expect(
      beforeLoad?.({
        location: { pathname: SHIM_PATH, search: {} },
        context,
      }),
    ).rejects.toMatchObject({ isRedirect: true, to: '/panel/provider' });
  });

  test('non-provider USER is redirected to condo-setup onboarding', async () => {
    mockProviderEnabled = false;
    const context = { session: { data: mockSessionData } };
    const beforeLoad =
      routeConfig.beforeLoad || routeConfig.options?.beforeLoad;
    await expect(
      beforeLoad?.({
        location: { pathname: SHIM_PATH, search: {} },
        context,
      }),
    ).rejects.toMatchObject({
      isRedirect: true,
      to: '/panel/dashboard/condo-setup',
    });
  });

  test('condo-setup path is allowed through without redirect', async () => {
    const context = { session: { data: mockSessionData } };
    const beforeLoad =
      routeConfig.beforeLoad || routeConfig.options?.beforeLoad;
    await expect(
      beforeLoad?.({
        location: { pathname: '/panel/dashboard/condo-setup', search: {} },
        context,
      }),
    ).resolves.toBeUndefined();
  });
});
