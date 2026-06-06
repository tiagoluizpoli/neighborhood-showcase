import { ProviderDashboardContent } from './-provider-dashboard-content';
import { useProviderDashboardRouteMessage } from './-provider-dashboard-route-message';
import { ProviderDashboardShellBoundary } from './-provider-dashboard-shell-boundary';
import { useProviderDashboardState } from './-provider-dashboard-state';

interface ProviderDashboardRouteSurfaceProps {
  displayName: string | undefined;
  message: string | undefined;
}

export function ProviderDashboardRouteSurface({
  displayName,
  message,
}: ProviderDashboardRouteSurfaceProps) {
  const dashboardState = useProviderDashboardState();
  const dashboardData = dashboardState.dashboardQuery.data;

  useProviderDashboardRouteMessage(message);

  return (
    <ProviderDashboardShellBoundary
      dashboardQuery={dashboardState.dashboardQuery}
      renderContent={() =>
        dashboardData ? (
          <ProviderDashboardContent
            dashboardData={dashboardData}
            displayName={displayName}
            state={dashboardState}
          />
        ) : null
      }
    />
  );
}
