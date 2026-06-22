import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { trpc } from '@/utils/trpc';

// Use the real @tanstack/react-router (the global test-setup stub spreads the
// real module, so `redirect` throws a real RedirectError whose target lives at
// `err.to || err.options?.to`). Only the trpc client is mocked, with its full
// export surface, because bun's `mock.module` is process-global and a partial
// mock that drops a named export poisons every other file in the run. Provider
// access + moderator assignments are driven through that trpc mock instead of
// partial-mocking `-user-access-profile`.

let mockProviderEnabled = false;
let mockAssignments: Array<{
  type: string;
  status: string;
  condominiumId: string | null;
}> = [];

const trpcMockModule = {
  trpcClient: {
    assignment: {
      getMyAssignments: { query: async () => mockAssignments },
    },
    user: {
      getAccessProfile: {
        query: async () => ({ providerEnabled: mockProviderEnabled }),
      },
    },
  },
  trpc,
};
mock.module('@/utils/trpc', () => trpcMockModule);
mock.module('../utils/trpc', () => trpcMockModule);

interface RedirectError {
  to?: string;
  options?: { to?: string };
}

const SHIM_PATH = '/panel/dashboard';

type ShimBeforeLoad = (ctx: {
  location: { pathname: string; search?: Record<string, string> };
  context: { session: unknown };
}) => Promise<void>;

let beforeLoad: ShimBeforeLoad | undefined;
let session: { user: { role: string } } | null;

describe('Dashboard shim — beforeLoad', () => {
  beforeEach(async () => {
    mockProviderEnabled = false;
    mockAssignments = [];
    session = { user: { role: 'USER' } };
    const mod = await import('@/routes/panel.dashboard');
    beforeLoad = mod.Route.options.beforeLoad as unknown as ShimBeforeLoad;
  });

  const expectRedirect = async (
    ctx: Parameters<ShimBeforeLoad>[0],
    dest: string,
  ) => {
    try {
      await beforeLoad?.(ctx);
      expect.unreachable();
    } catch (err: unknown) {
      const redirectErr = err as RedirectError;
      expect(redirectErr.to || redirectErr.options?.to).toBe(dest);
    }
  };

  test('unauthenticated user is redirected to root', async () => {
    await expectRedirect(
      {
        location: { pathname: SHIM_PATH, search: {} },
        context: { session: null },
      },
      '/',
    );
  });

  test('SYSTEM_MANAGER is redirected to /panel/admin', async () => {
    session = { user: { role: 'SYSTEM_MANAGER' } };
    await expectRedirect(
      {
        location: { pathname: SHIM_PATH, search: {} },
        context: { session: { data: session } },
      },
      '/panel/admin',
    );
  });

  test('ADMINISTRATOR is redirected to /panel/admin', async () => {
    session = { user: { role: 'ADMINISTRATOR' } };
    await expectRedirect(
      {
        location: { pathname: SHIM_PATH, search: {} },
        context: { session: { data: session } },
      },
      '/panel/admin',
    );
  });

  test('moderator user is redirected to /panel/moderation', async () => {
    mockAssignments = [
      { type: 'MODERATOR', status: 'APPROVED', condominiumId: 'condo-123' },
    ];
    await expectRedirect(
      {
        location: { pathname: SHIM_PATH, search: {} },
        context: { session: { data: session } },
      },
      '/panel/moderation',
    );
  });

  test('provider-enabled user is redirected to /panel/provider', async () => {
    mockProviderEnabled = true;
    await expectRedirect(
      {
        location: { pathname: SHIM_PATH, search: {} },
        context: { session: { data: session } },
      },
      '/panel/provider',
    );
  });

  test('non-provider USER is redirected to condo-setup onboarding', async () => {
    mockProviderEnabled = false;
    await expectRedirect(
      {
        location: { pathname: SHIM_PATH, search: {} },
        context: { session: { data: session } },
      },
      '/panel/dashboard/condo-setup',
    );
  });

  test('condo-setup path is allowed through without redirect', async () => {
    await expect(
      beforeLoad?.({
        location: { pathname: '/panel/dashboard/condo-setup', search: {} },
        context: { session: { data: session } },
      }),
    ).resolves.toBeUndefined();
  });
});
