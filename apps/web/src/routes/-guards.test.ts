import { describe, expect, mock, test } from 'bun:test';

// Set up mocks before importing the routes
const mockGetSession = mock(() => Promise.resolve({ data: null }));
mock.module('../lib/auth-client', () => ({
  authClient: {
    getSession: mockGetSession,
    useSession: () => ({ data: null, isPending: false }),
  },
}));

import { trpc } from '../utils/trpc';

const mockGetMyAssignments = mock(() => Promise.resolve([]));
const mockMyCreatedCondo = mock(() => Promise.resolve(null));
mock.module('../utils/trpc', () => ({
  trpcClient: {
    assignment: {
      getMyAssignments: {
        query: mockGetMyAssignments,
      },
    },
    condominium: {
      myCreated: {
        query: mockMyCreatedCondo,
      },
    },
  },
  trpc,
}));

import { Route as PanelRoute } from './panel';
import { Route as AdminRoute } from './panel.admin';
// Import routes after the mock definition
import { Route as DashboardRoute } from './panel.dashboard';
import { Route as ModerationRoute } from './panel.moderation';

interface RedirectError {
  to?: string;
  search?: Record<string, unknown>;
  options?: {
    to?: string;
    search?: Record<string, unknown>;
  };
}

describe('Route Guards Redirection & Security', () => {
  describe('/panel Route Guard', () => {
    test('redirects unauthenticated users to home (/)', async () => {
      mockGetSession.mockImplementation(() => Promise.resolve({ data: null }));

      try {
        await PanelRoute.options.beforeLoad?.({
          location: { pathname: '/panel' },
          params: {},
          search: {},
        } as unknown as Parameters<
          NonNullable<typeof PanelRoute.options.beforeLoad>
        >[0]);
        expect().unreachable(); // Should not reach here
      } catch (err: unknown) {
        expect(err).toBeDefined();
        const redirectErr = err as RedirectError;
        const dest = redirectErr.to || redirectErr.options?.to;
        expect(dest).toBe('/');
      }
    });

    test('allows authenticated users access to panel layout route', async () => {
      mockGetSession.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: '1', role: 'USER' },
            session: {},
          },
        } as unknown as {
          data: {
            user: { id: string; role: string };
            session: Record<string, unknown>;
          } | null;
        }),
      );

      const ctx = await PanelRoute.options.beforeLoad?.({
        location: { pathname: '/panel' },
        params: {},
        search: {},
      } as unknown as Parameters<
        NonNullable<typeof PanelRoute.options.beforeLoad>
      >[0]);

      expect(ctx).toBeDefined();
      const resolvedCtx = ctx as {
        session: { data: { user: { id: string } } };
      };
      expect(resolvedCtx.session.data.user.id).toBe('1');
    });
  });

  describe('/panel/dashboard Route Guard', () => {
    test('redirects authenticated users without approved assignments/condo to condo-setup', async () => {
      mockGetSession.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: '1', role: 'USER' },
            session: {},
          },
        } as unknown as {
          data: {
            user: { id: string; role: string };
            session: Record<string, unknown>;
          } | null;
        }),
      );
      mockMyCreatedCondo.mockImplementation(() => Promise.resolve(null));
      mockGetMyAssignments.mockImplementation(() => Promise.resolve([]));

      try {
        await DashboardRoute.options.beforeLoad?.({
          location: { pathname: '/panel/dashboard' },
          params: {},
          search: {},
          context: {
            session: {
              data: {
                user: { id: '1', role: 'USER' },
                session: {},
              },
            },
          },
        } as unknown as Parameters<
          NonNullable<typeof DashboardRoute.options.beforeLoad>
        >[0]);
        expect().unreachable();
      } catch (err: unknown) {
        expect(err).toBeDefined();
        const redirectErr = err as RedirectError;
        const dest = redirectErr.to || redirectErr.options?.to;
        expect(dest).toBe('/panel/dashboard/condo-setup');
      }
    });

    test('allows access to condo-setup even without assignments/condo to prevent infinite loops', async () => {
      mockGetSession.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: '1', role: 'USER' },
            session: {},
          },
        } as unknown as {
          data: {
            user: { id: string; role: string };
            session: Record<string, unknown>;
          } | null;
        }),
      );

      const ctx = await DashboardRoute.options.beforeLoad?.({
        location: { pathname: '/panel/dashboard/condo-setup' },
        params: {},
        search: {},
        context: {
          session: {
            data: {
              user: { id: '1', role: 'USER' },
              session: {},
            },
          },
        },
      } as unknown as Parameters<
        NonNullable<typeof DashboardRoute.options.beforeLoad>
      >[0]);

      expect(ctx).toBeUndefined(); // Returns undefined or void on bypass
    });
  });

  describe('/panel/moderation Route Guard', () => {
    test('redirects unauthenticated users to home (/)', async () => {
      mockGetSession.mockImplementation(() => Promise.resolve({ data: null }));

      try {
        await ModerationRoute.options.beforeLoad?.({
          location: { pathname: '/panel/moderation' },
          params: {},
          search: {},
        } as unknown as Parameters<
          NonNullable<typeof ModerationRoute.options.beforeLoad>
        >[0]);
        expect().unreachable();
      } catch (err: unknown) {
        expect(err).toBeDefined();
        const redirectErr = err as RedirectError;
        const dest = redirectErr.to || redirectErr.options?.to;
        expect(dest).toBe('/');
      }
    });

    test('redirects authenticated users without moderator assignment to /panel/dashboard with Página não encontrada message', async () => {
      mockGetSession.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: '1', role: 'USER' },
            session: {},
          },
        } as unknown as {
          data: {
            user: { id: string; role: string };
            session: Record<string, unknown>;
          } | null;
        }),
      );
      mockGetMyAssignments.mockImplementation(() =>
        Promise.resolve([
          { type: 'RESIDENT', status: 'APPROVED', condominiumId: 'condo-1' },
        ] as unknown as {
          type: string;
          status: string;
          condominiumId: string | null;
        }[]),
      );

      try {
        await ModerationRoute.options.beforeLoad?.({
          location: { pathname: '/panel/moderation' },
          params: {},
          search: {},
        } as unknown as Parameters<
          NonNullable<typeof ModerationRoute.options.beforeLoad>
        >[0]);
        expect().unreachable();
      } catch (err: unknown) {
        expect(err).toBeDefined();
        const redirectErr = err as RedirectError;
        const dest = redirectErr.to || redirectErr.options?.to;
        const search = redirectErr.search || redirectErr.options?.search;
        expect(dest).toBe('/panel/dashboard');
        expect(search).toEqual({ message: 'Página não encontrada' });
      }
    });

    test('allows moderator with approved assignment access to moderation page', async () => {
      mockGetSession.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: '1', role: 'USER' },
            session: {},
          },
        } as unknown as {
          data: {
            user: { id: string; role: string };
            session: Record<string, unknown>;
          } | null;
        }),
      );
      mockGetMyAssignments.mockImplementation(() =>
        Promise.resolve([
          { type: 'MODERATOR', status: 'APPROVED', condominiumId: 'condo-1' },
        ] as unknown as {
          type: string;
          status: string;
          condominiumId: string | null;
        }[]),
      );

      const ctx = await ModerationRoute.options.beforeLoad?.({
        location: { pathname: '/panel/moderation' },
        params: {},
        search: {},
      } as unknown as Parameters<
        NonNullable<typeof ModerationRoute.options.beforeLoad>
      >[0]);
      expect(ctx).toBeDefined();
      const resolvedCtx = ctx as { moderatorAssignments: unknown[] };
      expect(resolvedCtx.moderatorAssignments.length).toBe(1);
    });
  });

  describe('/panel/admin Route Guard', () => {
    test('redirects unauthenticated users to home (/)', async () => {
      mockGetSession.mockImplementation(() => Promise.resolve({ data: null }));

      try {
        await AdminRoute.options.beforeLoad?.({
          location: { pathname: '/panel/admin' },
          params: {},
          search: {},
        } as unknown as Parameters<
          NonNullable<typeof AdminRoute.options.beforeLoad>
        >[0]);
        expect().unreachable();
      } catch (err: unknown) {
        expect(err).toBeDefined();
        const redirectErr = err as RedirectError;
        const dest = redirectErr.to || redirectErr.options?.to;
        expect(dest).toBe('/');
      }
    });

    test('redirects authenticated users without SYSTEM_MANAGER role to /panel/dashboard with Página não encontrada message', async () => {
      mockGetSession.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: '1', role: 'USER' },
            session: {},
          },
        } as unknown as {
          data: {
            user: { id: string; role: string };
            session: Record<string, unknown>;
          } | null;
        }),
      );

      try {
        await AdminRoute.options.beforeLoad?.({
          location: { pathname: '/panel/admin' },
          params: {},
          search: {},
        } as unknown as Parameters<
          NonNullable<typeof AdminRoute.options.beforeLoad>
        >[0]);
        expect().unreachable();
      } catch (err: unknown) {
        expect(err).toBeDefined();
        const redirectErr = err as RedirectError;
        const dest = redirectErr.to || redirectErr.options?.to;
        const search = redirectErr.search || redirectErr.options?.search;
        expect(dest).toBe('/panel/dashboard');
        expect(search).toEqual({ message: 'Página não encontrada' });
      }
    });

    test('allows SYSTEM_MANAGER role access to admin page', async () => {
      mockGetSession.mockImplementation(() =>
        Promise.resolve({
          data: {
            user: { id: '1', role: 'SYSTEM_MANAGER' },
            session: {},
          },
        } as unknown as {
          data: {
            user: { id: string; role: string };
            session: Record<string, unknown>;
          } | null;
        }),
      );

      const ctx = await AdminRoute.options.beforeLoad?.({
        location: { pathname: '/panel/admin' },
        params: {},
        search: {},
      } as unknown as Parameters<
        NonNullable<typeof AdminRoute.options.beforeLoad>
      >[0]);
      expect(ctx).toBeDefined();
      const resolvedCtx = ctx as {
        session: { data: { user: { role: string } } };
      };
      expect(resolvedCtx.session.data.user.role).toBe('SYSTEM_MANAGER');
    });
  });
});
