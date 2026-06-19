import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/dashboard/')({
  beforeLoad: () => {
    throw redirect({ to: '/panel/dashboard' });
  },
});
