import { createFileRoute, redirect } from '@tanstack/react-router';
import { requireDefaultProviderId } from './-resolve-active-provider';

export const Route = createFileRoute('/panel/provider/configuration')({
  beforeLoad: async () => {
    const providerId = await requireDefaultProviderId();
    throw redirect({
      to: '/panel/provider/$providerId/configuration',
      params: { providerId },
    });
  },
});
