import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ProviderDashboardRouteFrame } from './panel/-provider-dashboard-route-frame';

const dashboardSearchSchema = z.object({
  message: z.string().optional(),
});

export const Route = createFileRoute('/panel/dashboard/')({
  validateSearch: (search) => dashboardSearchSchema.parse(search),
  component: DashboardIndexComponent,
});

function DashboardIndexComponent() {
  const { session } = Route.useRouteContext();
  const { message } = Route.useSearch();

  return (
    <ProviderDashboardRouteFrame
      displayName={session.data?.user.name}
      message={message}
    />
  );
}
