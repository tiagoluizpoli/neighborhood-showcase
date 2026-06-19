import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getUserAccessProfile } from './panel/-user-access-profile';

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
      throw redirect({ to: '/panel/admin' });
    }

    const accessProfile = await getUserAccessProfile();
    if (accessProfile.providerEnabled) {
      throw redirect({ to: '/panel/provider' });
    }

    // No active section scope — direct to setup onboarding.
    // Moderator-specific landing refinement is handled by T-14-03.
    throw redirect({ to: '/panel/dashboard/condo-setup' });
  },
  component: DashboardShimLayout,
});

function DashboardShimLayout() {
  return <Outlet />;
}
