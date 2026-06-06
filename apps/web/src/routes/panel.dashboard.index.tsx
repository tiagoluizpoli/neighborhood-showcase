import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@neighborhood-showcase/ui/components/chart';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  Eye,
  Loader2,
  MousePointerClick,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { z } from 'zod';
import { ProviderDashboardAnalyticsModal } from './panel/-provider-dashboard-analytics-modal';
import { ProviderDashboardAnnouncementList } from './panel/-provider-dashboard-announcement-list';
import { ProviderDashboardEditModal } from './panel/-provider-dashboard-edit-modal';
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

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Impressions */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Visualizações
            </span>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Eye className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-3xl text-foreground">
              {stats.totalImpressions}
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Exibições na vitrine pública
            </p>
          </div>
        </div>

        {/* Interactions */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Interações
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <MousePointerClick className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-3xl text-foreground">
              {stats.totalInteractions}
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Cliques em WhatsApp/Instagram/Site
            </p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              Taxa de Conversão
            </span>
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className="font-bold text-3xl text-foreground">
                {stats.conversionRate}%
              </h3>
            </div>
            {/* Visual Progress Bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-foreground text-xl tracking-tight">
              Desempenho Geral
            </h2>
            <p className="text-muted-foreground text-xs">
              Histórico de visualizações e interações no período selecionado.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPeriod('7d')}
              className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                period === '7d'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('30d')}
              className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                period === '30d'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              30 Dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('12m')}
              className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                period === '12m'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              12 Meses
            </button>
          </div>
        </div>

        {analyticsQuery.isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-xs">
              Carregando dados de desempenho...
            </p>
          </div>
        ) : analyticsQuery.isError ? (
          <div className="flex h-[300px] flex-col items-center justify-center space-y-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground text-xs">
              Erro ao carregar dados de desempenho.
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ChartContainer
              config={{
                impressions: {
                  label: 'Visualizações',
                  color: 'var(--chart-1)',
                },
                clicks: {
                  label: 'Interações',
                  color: 'var(--chart-2)',
                },
              }}
              className="h-full w-full"
            >
              <BarChart data={analyticsQuery.data?.chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (period === '12m') {
                      const [year, month] = value.split('-');
                      const monthNames = [
                        'Jan',
                        'Fev',
                        'Mar',
                        'Abr',
                        'Mai',
                        'Jun',
                        'Jul',
                        'Ago',
                        'Set',
                        'Out',
                        'Nov',
                        'Dez',
                      ];
                      return `${monthNames[Number.parseInt(month, 10) - 1]}/${year.slice(2)}`;
                    }
                    const parts = value.split('-');
                    if (parts.length === 3) {
                      return `${parts[2]}/${parts[1]}`;
                    }
                    return value;
                  }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--muted)' }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="impressions"
                  name="Visualizações"
                  fill="var(--color-impressions)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="clicks"
                  name="Interações"
                  fill="var(--color-clicks)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>

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
