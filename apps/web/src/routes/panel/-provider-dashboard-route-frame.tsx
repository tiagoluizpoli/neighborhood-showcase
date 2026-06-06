import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ProviderDashboardContent } from './-provider-dashboard-content';
import { handleProviderDashboardMessage } from './-provider-dashboard-message-handler';
import { ProviderDashboardShellBoundary } from './-provider-dashboard-shell-boundary';
import { useProviderDashboardState } from './-provider-dashboard-state';

interface ProviderDashboardRouteFrameProps {
  displayName: string | undefined;
  message: string | undefined;
}

export function ProviderDashboardRouteFrame({
  displayName,
  message,
}: ProviderDashboardRouteFrameProps) {
  const navigate = useNavigate();
  const dashboardState = useProviderDashboardState();
  const dashboardData = dashboardState.dashboardQuery.data;

  useEffect(() => {
    handleProviderDashboardMessage({ message, navigate });
  }, [message, navigate]);

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
