import { ProviderDashboardRouteSurface } from './-provider-dashboard-route-surface';

interface ProviderDashboardRouteFrameProps {
  displayName: string | undefined;
  message: string | undefined;
}

export function ProviderDashboardRouteFrame({
  displayName,
  message,
}: ProviderDashboardRouteFrameProps) {
  return (
    <ProviderDashboardRouteSurface
      displayName={displayName}
      message={message}
    />
  );
}
