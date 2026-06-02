import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { trpcClient } from '@/utils/trpc';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayoutComponent,
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: '/',
        throw: true,
      });
      throw new Error('Not authenticated');
    }

    // Bypass check if already on condo-setup
    if (location.pathname === '/dashboard/condo-setup') {
      return { session };
    }

    try {
      if (session.data.user.role === 'SYSTEM_MANAGER') {
        return { session };
      }

      // Check if they created an approved condo
      const myCondo = await trpcClient.condominium.myCreated.query();
      if (myCondo && myCondo.status === 'APPROVED') {
        return { session };
      }

      // Check if they have an approved assignment
      const assignments = await trpcClient.assignment.getMyAssignments.query();
      const hasApprovedAssignment = assignments.some(
        (a) => a.status === 'APPROVED',
      );

      if (!hasApprovedAssignment) {
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
      // Otherwise, redirect to condo-setup on error to be safe
      console.error('Error fetching condo status in route guard:', err);
      redirect({
        to: '/dashboard/condo-setup',
        throw: true,
      });
    }

    return { session };
  },
});

function DashboardLayoutComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Outlet />
    </div>
  );
}
