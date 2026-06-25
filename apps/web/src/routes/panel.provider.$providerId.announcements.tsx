import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/panel/provider/$providerId/announcements',
)({
  component: ProviderAnnouncementsLayout,
});

function ProviderAnnouncementsLayout() {
  return <Outlet />;
}
