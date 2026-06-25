import { createFileRoute, redirect } from '@tanstack/react-router';
import { requireDefaultProviderId } from './panel/provider/-resolve-active-provider';

export const Route = createFileRoute('/panel/provider/anuncios/$id/pagamento')({
  beforeLoad: async ({ params }) => {
    const providerId = await requireDefaultProviderId();
    throw redirect({
      to: '/panel/provider/$providerId/anuncios/$id/pagamento',
      params: { providerId, id: params.id },
    });
  },
});
