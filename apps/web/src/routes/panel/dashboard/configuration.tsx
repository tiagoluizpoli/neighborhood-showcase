import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { getUserAccessProfile } from '@/routes/panel/-user-access-profile';

export const Route = createFileRoute('/panel/dashboard/configuration')({
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (!session.data) {
      throw redirect({ to: '/' });
    }

    const accessProfile = await getUserAccessProfile();

    throw redirect({
      to: accessProfile.providerEnabled
        ? '/panel/provider/configuration'
        : '/panel/dashboard/condo-setup',
    });
  },
});
