import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/anuncios/novo')({
  beforeLoad: () => {
    throw redirect({
      to: '/panel/dashboard/announcements/new',
    });
  },
});
