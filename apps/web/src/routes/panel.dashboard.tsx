import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { resolvePanelLanding } from './panel/-landing-resolver';
import { getUserAccessProfile } from './panel/-user-access-profile';

const LEGACY_PROVIDER_CONFIGURATION_PATH = '/panel/dashboard/configuration';

export const Route = createFileRoute('/panel/dashboard')({
  beforeLoad: async ({ location, context }) => {
    if (location.pathname === LEGACY_PROVIDER_CONFIGURATION_PATH) {
      const accessProfile = await getUserAccessProfile();

      if (accessProfile.providerEnabled) {
        throw redirect({
          to: '/panel/provider/configuration',
          search: location.search,
        });
      }
    }

    const dest = await resolvePanelLanding({
      session: context.session,
      location,
    });

    if (dest) {
      throw redirect({ to: dest, search: location.search });
    }
  },
  component: DashboardShimLayout,
});

function DashboardShimLayout() {
  return <Outlet />;
}
