import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { z } from 'zod';
import { ProviderDashboardContent } from './panel/-provider-dashboard-content';
import { handleProviderDashboardMessage } from './panel/-provider-dashboard-message-handler';
import { ProviderDashboardShellBoundary } from './panel/-provider-dashboard-shell-boundary';
import { useProviderDashboardState } from './panel/-provider-dashboard-state';

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
  const navigate = useNavigate();
  const dashboardState = useProviderDashboardState();
  const dashboardData = dashboardState.dashboardQuery.data;

  useEffect(() => {
    handleProviderDashboardMessage({ message, navigate });
  }, [message, navigate]);

  if (!dashboardData) {
    return null;
  }

  return (
    <ProviderDashboardShellBoundary
      dashboardQuery={dashboardState.dashboardQuery}
      renderContent={() => (
        <ProviderDashboardContent
          dashboardData={dashboardData}
          displayName={session.data?.user.name}
          state={dashboardState}
        />
      )}
    />
  );
}
