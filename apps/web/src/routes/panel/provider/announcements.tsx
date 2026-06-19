import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/provider/announcements')({
  component: ProviderAnnouncementsLayout,
});

function ProviderAnnouncementsLayout() {
  return <Outlet />;
}
