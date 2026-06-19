import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { resolvePanelLanding } from './panel/-landing-resolver';

export const Route = createFileRoute('/panel/dashboard')({
  beforeLoad: async ({ location, context }) => {
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
