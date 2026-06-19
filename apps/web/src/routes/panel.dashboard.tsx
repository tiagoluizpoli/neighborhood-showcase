import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getUserAccessProfile } from './panel/-user-access-profile';
import { trpcClient } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard')({
  beforeLoad: async ({ location, context }) => {
    const session = context.session;
    if (!session?.data) {
      throw redirect({ to: '/' });
    }

    // Legacy condo-setup path is allowed through — it serves as the non-Provider
    // onboarding surface until T-14-05 moves it outside the Provider namespace.
    if (location.pathname === '/panel/dashboard/condo-setup') {
      return;
    }

    const role = session.data.user.role;

    if (role === 'SYSTEM_MANAGER' || role === 'ADMINISTRATOR') {
      throw redirect({ to: '/panel/admin', search: location.search });
    }

    const assignments = await trpcClient.assignment.getMyAssignments.query();
    const hasModeratorAssignment = assignments.some(
      (a) =>
        a.type === 'MODERATOR' &&
        a.status === 'APPROVED' &&
        a.condominiumId !== null,
    );

    if (hasModeratorAssignment) {
      throw redirect({ to: '/panel/moderation', search: location.search });
    }

    const accessProfile = await getUserAccessProfile();
    if (accessProfile.providerEnabled) {
      throw redirect({ to: '/panel/provider', search: location.search });
    }

    // No active section scope — direct to setup onboarding.
    throw redirect({
      to: '/panel/dashboard/condo-setup',
      search: location.search,
    });
  },
  component: DashboardShimLayout,
});

function DashboardShimLayout() {
  return <Outlet />;
}
