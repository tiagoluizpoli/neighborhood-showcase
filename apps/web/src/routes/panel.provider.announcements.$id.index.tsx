import { createFileRoute, redirect } from '@tanstack/react-router';
import { requireDefaultProviderId } from './panel/provider/-resolve-active-provider';

export const Route = createFileRoute('/panel/provider/announcements/$id/')({
  beforeLoad: async ({ params }) => {
    const providerId = await requireDefaultProviderId();
    throw redirect({
      to: '/panel/provider/$providerId/announcements/$id',
      params: { providerId, id: params.id },
    });
  },
});
