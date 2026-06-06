import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { createProviderDashboardRenewActions } from './-provider-dashboard-renew-actions';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';
import { trpc } from '@/utils/trpc';

type ProviderDashboardTab = 'active' | 'draft' | 'expired' | 'suspended';
type ProviderDashboardPeriod = '7d' | '30d' | '12m';

export interface ProviderDashboardAnnouncementsBuckets {
  active: ProviderDashboardAnnouncementItem[];
  draft: ProviderDashboardAnnouncementItem[];
  expired: ProviderDashboardAnnouncementItem[];
  suspended: ProviderDashboardAnnouncementItem[];
}

export interface ProviderDashboardDashboardData {
  announcements: ProviderDashboardAnnouncementsBuckets;
  stats: {
    conversionRate: number;
    totalImpressions: number;
    totalInteractions: number;
  };
}

export interface ProviderDashboardState {
  activeTab: ProviderDashboardTab;
  analyticsQuery: {
    data?: {
      chartData?: Array<{
        clicks: number;
        impressions: number;
        label: string;
      }>;
    };
    isError: boolean;
    isLoading: boolean;
  };
  dashboardQuery: {
    data?: ProviderDashboardDashboardData;
    isError: boolean;
    isLoading: boolean;
  };
  editingAd: ProviderDashboardAnnouncementItem | null;
  handleEditSuccess: () => void;
  handlePay: (ad: ProviderDashboardAnnouncementItem) => void;
  handleRenew: (ad: ProviderDashboardAnnouncementItem) => void;
  period: ProviderDashboardPeriod;
  renewMutation: {
    variables?: {
      announcementId: string;
    };
  };
  setActiveTab: (tab: ProviderDashboardTab) => void;
  setEditingAd: (ad: ProviderDashboardAnnouncementItem | null) => void;
  setPeriod: (period: ProviderDashboardPeriod) => void;
  setViewingAnalyticsAd: (ad: ProviderDashboardAnnouncementItem | null) => void;
  viewingAnalyticsAd: ProviderDashboardAnnouncementItem | null;
}

export function useProviderDashboardState() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProviderDashboardTab>('active');
  const [editingAd, setEditingAd] =
    useState<ProviderDashboardAnnouncementItem | null>(null);
  const [period, setPeriod] = useState<ProviderDashboardPeriod>('7d');
  const [viewingAnalyticsAd, setViewingAnalyticsAd] =
    useState<ProviderDashboardAnnouncementItem | null>(null);

  const dashboardQuery = useQuery(
    trpc.announcement.getDashboardData.queryOptions(),
  );
  const analyticsQuery = useQuery(
    trpc.announcement.getAnalytics.queryOptions({ period }),
  );

  const renewActions = createProviderDashboardRenewActions({ navigate });
  const renewMutation = useMutation(
    trpc.announcement.getPaymentDetails.mutationOptions({
      onSuccess: (data) => renewActions.onSuccess(data.announcementId),
      onError: (err) => renewActions.onError(err.message),
    }),
  );

  const handleEditSuccess = () => {
    setEditingAd(null);
    queryClient.invalidateQueries({
      queryKey: trpc.announcement.getDashboardData.queryKey(),
    });
  };

  const handlePay = (ad: ProviderDashboardAnnouncementItem) => {
    navigate({
      to: `/panel/dashboard/anuncios/${ad.id}/pagamento`,
    });
  };

  const handleRenew = (ad: ProviderDashboardAnnouncementItem) => {
    renewMutation.mutate({ announcementId: ad.id });
  };

  return {
    activeTab,
    analyticsQuery,
    dashboardQuery,
    editingAd,
    handleEditSuccess,
    handlePay,
    handleRenew,
    period,
    renewMutation,
    setActiveTab,
    setEditingAd,
    setPeriod,
    setViewingAnalyticsAd,
    viewingAnalyticsAd,
  } satisfies ProviderDashboardState;
}
