import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/condo-setup')({
  beforeLoad: () => {
    throw redirect({
      to: '/panel/dashboard/condo-setup',
    });
  },
});
