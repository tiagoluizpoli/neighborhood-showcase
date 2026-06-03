import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/anuncios/$id/pagamento')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/panel/dashboard/anuncios/$id/pagamento',
      params: { id: params.id },
    });
  },
});
