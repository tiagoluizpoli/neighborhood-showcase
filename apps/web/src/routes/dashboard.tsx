import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { trpcClient } from '@/utils/trpc';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayoutComponent,
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: '/auth',
        throw: true,
      });
    }

    // Bypass check if already on condo-setup
    if (location.pathname === '/dashboard/condo-setup') {
      return { session };
    }

    try {
      const myCondo = await trpcClient.condominium.myCreated.query();
      if (!myCondo || myCondo.status !== 'APPROVED') {
        redirect({
          to: '/dashboard/condo-setup',
          throw: true,
        });
      }
    } catch (err) {
      // Rethrow Redirect objects thrown by TanStack Router
      if (
        err &&
        typeof err === 'object' &&
        ('to' in err || 'isRedirect' in err)
      ) {
        throw err;
      }
      // Otherwise, just log the error and allow fallback (or handle appropriately)
      console.error('Error fetching condo status in route guard:', err);
    }

    return { session };
  },
});

function DashboardLayoutComponent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Outlet />
    </div>
  );
}
