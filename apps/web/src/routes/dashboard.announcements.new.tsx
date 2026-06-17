import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/announcements/new')({
  beforeLoad: () => {
    throw redirect({
      to: '/panel/dashboard/announcements/new',
    });
  },
});
