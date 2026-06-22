import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/dashboard/anuncios/novo')({
  beforeLoad: () => {
    throw redirect({
      to: '/panel/provider/announcements/new',
    });
  },
});
