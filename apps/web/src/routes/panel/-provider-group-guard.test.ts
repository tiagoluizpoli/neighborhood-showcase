import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { trpc } from '@/utils/trpc';

// Real router (global test-setup stub spreads it, so `redirect` throws a real
// RedirectError → target at `err.to || err.options?.to`). Provider access flows
// through the trpc mock rather than partial-mocking `-user-access-profile`,
// because bun's process-global `mock.module` would otherwise drop named exports
// that other files in the run import.

let mockProviderEnabled = false;

const trpcMockModule = {
  trpcClient: {
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

type GuardBeforeLoad = (ctx: {
  context: { session: unknown };
}) => Promise<void>;

let beforeLoad: GuardBeforeLoad | undefined;
const session = { user: { role: 'USER' } };

describe('Provider route-group guard — beforeLoad', () => {
  beforeEach(async () => {
    mockProviderEnabled = false;
    const mod = await import('@/routes/panel.provider');
    beforeLoad = mod.Route.options.beforeLoad as unknown as GuardBeforeLoad;
  });

  test('provider-enabled user passes through without redirect', async () => {
    mockProviderEnabled = true;
    await expect(
      beforeLoad?.({ context: { session: { data: session } } }),
    ).resolves.toBeUndefined();
  });

  test('non-provider user is redirected', async () => {
    mockProviderEnabled = false;
    try {
      await beforeLoad?.({ context: { session: { data: session } } });
      expect.unreachable();
    } catch (err: unknown) {
      const redirectErr = err as RedirectError;
      expect(redirectErr.to || redirectErr.options?.to).toBe(
        '/panel/dashboard',
      );
    }
  });

  test('unauthenticated user is redirected to root', async () => {
    try {
      await beforeLoad?.({ context: { session: null } });
      expect.unreachable();
    } catch (err: unknown) {
      const redirectErr = err as RedirectError;
      expect(redirectErr.to || redirectErr.options?.to).toBe('/');
    }
  });
});
