import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { z } from 'zod';
import { ProviderDashboardAnalyticsModal } from './panel/-provider-dashboard-analytics-modal';
import { ProviderDashboardAnnouncementList } from './panel/-provider-dashboard-announcement-list';
import { ProviderDashboardEditModal } from './panel/-provider-dashboard-edit-modal';
import {
  formatProviderDashboardDate,
  formatProviderDashboardPrice,
} from './panel/-provider-dashboard-formatters';
import { ProviderDashboardHeader } from './panel/-provider-dashboard-header';
import { handleProviderDashboardMessage } from './panel/-provider-dashboard-message-handler';
import { ProviderDashboardPerformanceOverview } from './panel/-provider-dashboard-performance-overview';
import { formatProviderDashboardPeriodLabel } from './panel/-provider-dashboard-period-label';
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

  useEffect(() => {
    handleProviderDashboardMessage({ message, navigate });
  }, [message, navigate]);

  const dashboardData = dashboardState.dashboardQuery.data;

  if (!dashboardData) {
    return null;
  }

  return (
    <ProviderDashboardShellBoundary
      dashboardQuery={dashboardState.dashboardQuery}
      renderContent={() => {
        const { stats, announcements } = dashboardData;

        return (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ProviderDashboardHeader displayName={session.data?.user.name} />

            <ProviderDashboardPerformanceOverview
              analytics={{
                chartData: dashboardState.analyticsQuery.data?.chartData,
                isError: dashboardState.analyticsQuery.isError,
                isLoading: dashboardState.analyticsQuery.isLoading,
              }}
              formatPeriodLabel={formatProviderDashboardPeriodLabel}
              onPeriodChange={dashboardState.setPeriod}
              period={dashboardState.period}
              stats={stats}
            />

            <ProviderDashboardAnnouncementList
              activeTab={dashboardState.activeTab}
              announcements={announcements}
              formatDate={formatProviderDashboardDate}
              formatPrice={formatProviderDashboardPrice}
              isRenewingAnnouncementId={
                dashboardState.renewMutation.variables?.announcementId
              }
              onActiveTabChange={dashboardState.setActiveTab}
              onEdit={dashboardState.setEditingAd}
              onPay={dashboardState.handlePay}
              onRenew={dashboardState.handleRenew}
              onViewAnalytics={dashboardState.setViewingAnalyticsAd}
            />

            {/* Edit Announcement Modal */}
            {dashboardState.editingAd && (
              <ProviderDashboardEditModal
                ad={dashboardState.editingAd}
                onClose={() => dashboardState.setEditingAd(null)}
                onSuccess={dashboardState.handleEditSuccess}
              />
            )}

            {/* Analytics Modal */}
            {dashboardState.viewingAnalyticsAd && (
              <ProviderDashboardAnalyticsModal
                ad={dashboardState.viewingAnalyticsAd}
                onClose={() => dashboardState.setViewingAnalyticsAd(null)}
              />
            )}
          </div>
        );
      }}
    />
  );
}
