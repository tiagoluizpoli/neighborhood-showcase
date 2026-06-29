import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { PanelContentContainer } from '../components/panel-content-container';
import { getUserAccessProfile } from './panel/-user-access-profile';

export const Route = createFileRoute('/panel/provider')({
  beforeLoad: async ({ context, location }) => {
    const session = context.session;
    if (!session?.data) {
      throw redirect({ to: '/' });
    }

    const bypassRoutes = [
      '/panel/provider/my-providers',
      '/panel/provider/condo-setup',
    ];
    const isBypass = bypassRoutes.some(
      (r) => location.pathname === r || location.pathname.startsWith(`${r}/`),
    );

    if (isBypass) {
      return;
    }

    const accessProfile = await getUserAccessProfile();
    if (!accessProfile.providerEnabled) {
      throw redirect({
        to: '/panel/dashboard',
      });
    }
  },
  component: ProviderGroupLayout,
});

function ProviderGroupLayout() {
  return (
    <PanelContentContainer>
      <Outlet />
    </PanelContentContainer>
  );
}
