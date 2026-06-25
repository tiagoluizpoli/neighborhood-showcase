import { createFileRoute, redirect } from '@tanstack/react-router';
import { requireDefaultProviderId } from './panel/provider/-resolve-active-provider';

export const Route = createFileRoute('/panel/provider/announcements/new')({
  beforeLoad: async () => {
    const providerId = await requireDefaultProviderId();
    throw redirect({
      to: '/panel/provider/$providerId/announcements/new',
      params: { providerId },
    });
  },
});
