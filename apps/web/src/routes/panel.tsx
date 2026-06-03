import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/panel')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/',
      });
    }
    return { session };
  },
  component: PanelLayout,
});

function PanelLayout() {
  return (
    <div
      data-theme="panel"
      className="min-h-screen bg-background text-foreground"
    >
      <Outlet />
    </div>
  );
}
