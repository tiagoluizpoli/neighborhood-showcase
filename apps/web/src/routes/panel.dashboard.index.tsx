import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import type { ProviderDashboardAnnouncementItem } from './panel/-provider-dashboard-types';
import { trpc } from '@/utils/trpc';

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    handleProviderDashboardMessage({ message, navigate });
  }, [message, navigate]);

  const [activeTab, setActiveTab] = useState<
    'active' | 'draft' | 'expired' | 'suspended'
  >('active');
  const [editingAd, setEditingAd] =
    useState<ProviderDashboardAnnouncementItem | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('7d');
  const [viewingAnalyticsAd, setViewingAnalyticsAd] =
    useState<ProviderDashboardAnnouncementItem | null>(null);

  // Fetch dashboard data
  const dashboardQuery = useQuery(
    trpc.announcement.getDashboardData.queryOptions(),
  );

  // Fetch aggregate analytics data (omits announcementId)
  const analyticsQuery = useQuery(
    trpc.announcement.getAnalytics.queryOptions({
      period,
    }),
  );
  const dashboardData = dashboardQuery.data;

  // Renew payment intent mutation
  const renewMutation = useMutation(
    trpc.announcement.getPaymentDetails.mutationOptions({
      onSuccess: (data) => {
        toast.success('Intenção de pagamento gerada. Redirecionando...');
        navigate({
          to: `/panel/dashboard/anuncios/${data.announcementId}/pagamento`,
        });
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao gerar intenção de pagamento.');
      },
    }),
  );

  if (!dashboardData) {
    return null;
  }

  return (
    <ProviderDashboardShellBoundary
      dashboardQuery={dashboardQuery}
      renderContent={() => {
        const { stats, announcements } = dashboardData;

        return (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ProviderDashboardHeader displayName={session.data?.user.name} />

            <ProviderDashboardPerformanceOverview
              analytics={{
                chartData: analyticsQuery.data?.chartData,
                isError: analyticsQuery.isError,
                isLoading: analyticsQuery.isLoading,
              }}
              formatPeriodLabel={formatProviderDashboardPeriodLabel}
              onPeriodChange={setPeriod}
              period={period}
              stats={stats}
            />

            <ProviderDashboardAnnouncementList
              activeTab={activeTab}
              announcements={announcements}
              formatDate={formatProviderDashboardDate}
              formatPrice={formatProviderDashboardPrice}
              isRenewingAnnouncementId={renewMutation.variables?.announcementId}
              onActiveTabChange={setActiveTab}
              onEdit={setEditingAd}
              onPay={(ad) =>
                navigate({
                  to: `/panel/dashboard/anuncios/${ad.id}/pagamento`,
                })
              }
              onRenew={(ad) => renewMutation.mutate({ announcementId: ad.id })}
              onViewAnalytics={setViewingAnalyticsAd}
            />

            {/* Edit Announcement Modal */}
            {editingAd && (
              <ProviderDashboardEditModal
                ad={editingAd}
                onClose={() => setEditingAd(null)}
                onSuccess={() => {
                  setEditingAd(null);
                  queryClient.invalidateQueries({
                    queryKey: trpc.announcement.getDashboardData.queryKey(),
                  });
                }}
              />
            )}

            {/* Analytics Modal */}
            {viewingAnalyticsAd && (
              <ProviderDashboardAnalyticsModal
                ad={viewingAnalyticsAd}
                onClose={() => setViewingAnalyticsAd(null)}
              />
            )}
          </div>
        );
      }}
    />
  );
}
