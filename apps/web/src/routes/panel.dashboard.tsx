import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { trpcClient } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard')({
  beforeLoad: async ({ location, context }) => {
    const session = context.session;
    if (!session?.data) {
      throw redirect({
        to: '/',
      });
    }

    // Bypass check if already on condo-setup
    if (location.pathname === '/panel/dashboard/condo-setup') {
      return;
    }

    try {
      if (session.data.user.role === 'SYSTEM_MANAGER') {
        return;
      }

      // Check if they created an approved condo
      const myCondo = await trpcClient.condominium.myCreated.query();
      if (myCondo && myCondo.status === 'APPROVED') {
        return;
      }

      // Check if they have an approved assignment
      const assignments = await trpcClient.assignment.getMyAssignments.query();
      const hasApprovedAssignment = assignments.some(
        (a) => a.status === 'APPROVED',
      );

      if (!hasApprovedAssignment) {
        throw redirect({
          to: '/panel/dashboard/condo-setup',
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
      console.error('Error fetching condo status in route guard:', err);
      throw redirect({
        to: '/panel/dashboard/condo-setup',
      });
    }
  },
  component: DashboardLayoutComponent,
});

function DashboardLayoutComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Outlet />
    </div>
  );
}
