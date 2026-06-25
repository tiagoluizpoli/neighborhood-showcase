import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ProviderDashboardRouteFrame } from './panel/-provider-dashboard-route-frame';

const providerIndexSearchSchema = z.object({
  message: z.string().optional(),
});

export const Route = createFileRoute('/panel/provider/$providerId/')({
  validateSearch: (search) => providerIndexSearchSchema.parse(search),
  component: ProviderIndexComponent,
});

function ProviderIndexComponent() {
  const { session } = Route.useRouteContext();
  const { message } = Route.useSearch();

  return (
    <ProviderDashboardRouteFrame
      displayName={session.data?.user.name}
      message={message}
    />
  );
}
