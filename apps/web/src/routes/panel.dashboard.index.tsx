import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ProviderDashboardAnalyticsModal } from './panel/-provider-dashboard-analytics-modal';
import { ProviderDashboardAnnouncementList } from './panel/-provider-dashboard-announcement-list';
import { ProviderDashboardEditModal } from './panel/-provider-dashboard-edit-modal';
import { ProviderDashboardPerformanceOverview } from './panel/-provider-dashboard-performance-overview';
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
    if (message) {
      toast.error(message);
      navigate({
        to: '/panel/dashboard',
        replace: true,
      });
    }
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

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">
          Carregando painel do provedor...
        </p>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="font-semibold text-foreground text-xl">
          Erro ao carregar dados
        </h2>
        <p className="max-w-md text-muted-foreground">
          Não foi possível carregar as informações do seu painel. Por favor,
          tente novamente mais tarde.
        </p>
      </div>
    );
  }

  if (!dashboardQuery.data) {
    return null;
  }

  const { stats, announcements } = dashboardQuery.data;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatPrice = (cents: number | null) => {
    if (cents === null || cents === undefined) return 'A combinar';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Painel do Provedor
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Bem-vindo de volta,{' '}
            <span className="font-medium text-foreground">
              {session.data?.user.name}
            </span>
            . Gerencie seus anúncios e analise suas conversões.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/panel/dashboard/anuncios/novo"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Criar Anúncio
          </Link>
        </div>
      </div>

      <ProviderDashboardPerformanceOverview
        analytics={{
          chartData: analyticsQuery.data?.chartData,
          isError: analyticsQuery.isError,
          isLoading: analyticsQuery.isLoading,
        }}
        formatPeriodLabel={(value) =>
          value === '7d' ? '7 Dias' : value === '30d' ? '30 Dias' : '12 Meses'
        }
        onPeriodChange={setPeriod}
        period={period}
        stats={stats}
      />

      <ProviderDashboardAnnouncementList
        activeTab={activeTab}
        announcements={announcements}
        formatDate={formatDate}
        formatPrice={formatPrice}
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
}
