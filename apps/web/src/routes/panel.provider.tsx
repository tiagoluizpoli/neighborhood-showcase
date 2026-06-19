import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getUserAccessProfile } from './panel/-user-access-profile';

export const Route = createFileRoute('/panel/provider')({
  beforeLoad: async ({ context }) => {
    const session = context.session;
    if (!session?.data) {
      throw redirect({ to: '/' });
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
  return <Outlet />;
}
