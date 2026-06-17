import { ProviderDashboardAnnouncementList } from './-provider-dashboard-announcement-list';
import {
  formatProviderDashboardDate,
  formatProviderDashboardPrice,
} from './-provider-dashboard-formatters';
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProviderDashboardHeader displayName={displayName} />

      <ProviderDashboardPerformanceOverview
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

      <ProviderDashboardAnnouncementList
        activeTab={state.activeTab}
        announcements={announcements}
        formatDate={formatProviderDashboardDate}
        formatPrice={formatProviderDashboardPrice}
        isRenewingAnnouncementId={state.renewMutation.variables?.announcementId}
        onActiveTabChange={state.setActiveTab}
        onEdit={state.setEditingAd}
        onPay={state.handlePay}
        onRenew={state.handleRenew}
        onViewAnalytics={state.setViewingAnalyticsAd}
      />
    </div>
  );
}
