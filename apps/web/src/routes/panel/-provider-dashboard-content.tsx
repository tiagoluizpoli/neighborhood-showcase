import { ProviderDashboardHeader } from './-provider-dashboard-header';
import { ProviderDashboardPerformanceOverview } from './-provider-dashboard-performance-overview';
import { formatProviderDashboardPeriodLabel } from './-provider-dashboard-period-label';
import type {
  ProviderDashboardDashboardData,
  ProviderDashboardState,
} from './-provider-dashboard-state';

interface ProviderDashboardContentProps {
  displayName: string | undefined;
  dashboardData: ProviderDashboardDashboardData;
  state: ProviderDashboardState;
}

export function ProviderDashboardContent({
  dashboardData,
  displayName,
  state,
}: ProviderDashboardContentProps) {
  const { stats, announcements } = dashboardData;

  return (
    <div className="w-full space-y-6">
      <ProviderDashboardHeader displayName={displayName} />

      <ProviderDashboardPerformanceOverview
        announcements={announcements}
        analytics={{
          chartData: state.analyticsQuery.data?.chartData,
          isError: state.analyticsQuery.isError,
          isLoading: state.analyticsQuery.isLoading,
        }}
        formatPeriodLabel={formatProviderDashboardPeriodLabel}
        onPeriodChange={state.setPeriod}
        period={state.period}
        stats={stats}
      />
    </div>
  );
}
