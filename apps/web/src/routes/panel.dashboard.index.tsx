import { env } from '@neighborhood-showcase/env/web';
import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@neighborhood-showcase/ui/components/chart';
import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@neighborhood-showcase/ui/components/tooltip';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Edit,
  Eye,
  Loader2,
  MousePointerClick,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { z } from 'zod';
import { getCroppedImg } from '@/utils/crop-image';
import { trpc } from '@/utils/trpc';

const dashboardSearchSchema = z.object({
  message: z.string().optional(),
});

export const Route = createFileRoute('/panel/dashboard/')({
  validateSearch: (search) => dashboardSearchSchema.parse(search),
  component: DashboardIndexComponent,
});

const CATEGORIES = [
  'Alimentação',
  'Serviços Gerais',
  'Aulas & Consultoria',
  'Artesanato & Moda',
  'Beleza & Estética',
  'Outros',
];

interface DashboardAnnouncementItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  category: string;
  tags: string[];
  contactLinks: {
    whatsapp?: string;
    instagram?: string;
    website?: string;
  };
  showVerifiedBadge: boolean;
  flaggedForReview: boolean;
  status: 'DRAFT' | 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  suspensionReason: string | null;
  condoName: string;
  providerLocationId: string | null;
}

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
  const [editingAd, setEditingAd] = useState<DashboardAnnouncementItem | null>(
    null,
  );
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('7d');
  const [viewingAnalyticsAd, setViewingAnalyticsAd] =
    useState<DashboardAnnouncementItem | null>(null);

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

      {/* Tabs list Navigation */}
      <div className="mb-6 border-border border-b">
        <div className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'active'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ativos ({announcements.active.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'draft'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rascunhos & Pendentes ({announcements.draft.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expired')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'expired'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Expirados ({announcements.expired.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suspended')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'suspended'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Suspensos ({announcements.suspended.length})
          </button>
        </div>
      </div>

      {/* Announcements List Container */}
      <div>
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {announcements.active.length === 0 ? (
              <EmptyState
                text="Nenhum anúncio ativo no momento."
                link="/panel/dashboard/anuncios/novo"
                buttonText="Criar Anúncio"
              />
            ) : (
              announcements.active.map((ad) => (
                <AnnouncementCard
                  key={ad.id}
                  ad={ad}
                  onEdit={() => setEditingAd(ad)}
                  formatDate={formatDate}
                  formatPrice={formatPrice}
                  onViewAnalytics={setViewingAnalyticsAd}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'draft' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {announcements.draft.length === 0 ? (
              <EmptyState
                text="Nenhum rascunho ou pagamento pendente."
                link="/panel/dashboard/anuncios/novo"
                buttonText="Criar Anúncio"
              />
            ) : (
              announcements.draft.map((ad) => (
                <AnnouncementCard
                  key={ad.id}
                  ad={ad}
                  onEdit={() => setEditingAd(ad)}
                  formatDate={formatDate}
                  formatPrice={formatPrice}
                  onPay={() =>
                    navigate({
                      to: `/panel/dashboard/anuncios/${ad.id}/pagamento`,
                    })
                  }
                  onViewAnalytics={setViewingAnalyticsAd}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'expired' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {announcements.expired.length === 0 ? (
              <EmptyState text="Nenhum anúncio expirado." hideButton />
            ) : (
              announcements.expired.map((ad) => (
                <AnnouncementCard
                  key={ad.id}
                  ad={ad}
                  onEdit={() => setEditingAd(ad)}
                  formatDate={formatDate}
                  formatPrice={formatPrice}
                  onRenew={() =>
                    renewMutation.mutate({ announcementId: ad.id })
                  }
                  isRenewing={
                    renewMutation.isPending &&
                    renewMutation.variables?.announcementId === ad.id
                  }
                  onViewAnalytics={setViewingAnalyticsAd}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'suspended' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {announcements.suspended.length === 0 ? (
              <EmptyState text="Nenhum anúncio suspenso." hideButton />
            ) : (
              announcements.suspended.map((ad) => (
                <AnnouncementCard
                  key={ad.id}
                  ad={ad}
                  onEdit={() => setEditingAd(ad)}
                  formatDate={formatDate}
                  formatPrice={formatPrice}
                  onViewAnalytics={setViewingAnalyticsAd}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Announcement Modal */}
      {editingAd && (
        <EditAnnouncementModal
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
        <AnnouncementAnalyticsModal
          ad={viewingAnalyticsAd}
          onClose={() => setViewingAnalyticsAd(null)}
        />
      )}
    </div>
  );
}

// Subcomponents
function EmptyState({
  text,
  link,
  buttonText,
  hideButton = false,
}: {
  text: string;
  link?: string;
  buttonText?: string;
  hideButton?: boolean;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-border border-dashed p-12 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-4 font-medium text-muted-foreground text-sm">{text}</p>
      {!hideButton && link && buttonText && (
        <Link
          to={link}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}

function AnnouncementCard({
  ad,
  onEdit,
  formatDate,
  formatPrice,
  onPay,
  onRenew,
  isRenewing = false,
  onViewAnalytics,
}: {
  ad: DashboardAnnouncementItem;
  onEdit: () => void;
  formatDate: (str: string | null) => string;
  formatPrice: (val: number | null) => string;
  onPay?: () => void;
  onRenew?: () => void;
  isRenewing?: boolean;
  onViewAnalytics?: (ad: DashboardAnnouncementItem) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {/* Status Badge */}
          <span
            className={`rounded-full px-2.5 py-1 font-semibold text-xs ${
              ad.status === 'ACTIVE'
                ? 'border border-success/30 bg-success/20 text-success'
                : ad.status === 'PENDING_PAYMENT'
                  ? 'border border-warning/30 bg-warning/20 text-warning'
                  : ad.status === 'DRAFT'
                    ? 'border bg-secondary text-secondary-foreground'
                    : ad.status === 'EXPIRED'
                      ? 'border border-destructive/30 bg-destructive/20 text-destructive'
                      : 'border border-destructive/40 bg-destructive/30 text-destructive'
            }`}
          >
            {ad.status === 'ACTIVE'
              ? ad.flaggedForReview
                ? 'Ativo (Em revisão)'
                : 'Ativo'
              : ad.status === 'PENDING_PAYMENT'
                ? 'Aguardando Pagamento'
                : ad.status === 'DRAFT'
                  ? 'Rascunho'
                  : ad.status === 'EXPIRED'
                    ? 'Expirado'
                    : 'Suspenso'}
          </span>
          {/* Verified Badge */}
          {ad.showVerifiedBadge && (
            <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/20 px-2 py-0.5 font-semibold text-[10px] text-primary">
              <ShieldCheck className="h-3 w-3" /> Morador Verificado
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3">
          <p className="font-semibold text-primary text-xs uppercase tracking-wider">
            {ad.category}
          </p>
          <h4 className="line-clamp-1 font-bold text-foreground text-lg">
            {ad.title}
          </h4>
        </div>

        <p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
          {ad.description}
        </p>

        {/* Meta Info */}
        <div className="mt-auto space-y-2 border-t pt-4">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Preço:</span>
            <span className="font-bold text-foreground text-sm">
              {formatPrice(ad.priceCents)}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Condomínio:</span>
            <span className="text-foreground">{ad.condoName}</span>
          </div>

          {ad.status === 'ACTIVE' && ad.expiresAt && (
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Expira em:
              </span>
              <span className="font-medium text-foreground">
                {formatDate(ad.expiresAt)}
              </span>
            </div>
          )}
        </div>

        {/* Suspended Reason Banner */}
        {ad.status === 'SUSPENDED' && ad.suspensionReason && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs">
            <span className="mb-1 block font-bold text-destructive">
              Motivo da Suspensão:
            </span>
            <p className="text-destructive italic">{ad.suspensionReason}</p>
          </div>
        )}

        {/* Buttons / Actions */}
        <div className="mt-5 flex flex-col gap-2">
          {ad.status === 'DRAFT' && onPay && (
            <button
              type="button"
              onClick={onPay}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success py-2.5 font-semibold text-sm text-success-foreground transition-colors hover:bg-success/80"
            >
              Publicar Anúncio
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {ad.status === 'PENDING_PAYMENT' && onPay && (
            <button
              type="button"
              onClick={onPay}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-warning py-2.5 font-semibold text-sm text-warning-foreground transition-colors hover:bg-warning/80"
            >
              Pagar Pix
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {ad.status === 'EXPIRED' && onRenew && (
            <button
              type="button"
              onClick={onRenew}
              disabled={isRenewing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isRenewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Renovar Anúncio (R$ 2,00)
            </button>
          )}

          {/* Actions Row */}
          <div className="flex w-full gap-2">
            {ad.status === 'ACTIVE' && (
              <Link
                to="/anuncios/$id"
                params={{ id: ad.id }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border bg-background py-2 font-medium text-foreground text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                title="Visualizar Anúncio Público"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver Detalhes
              </Link>
            )}

            {(ad.status === 'ACTIVE' ||
              ad.status === 'EXPIRED' ||
              ad.status === 'SUSPENDED') && (
              <button
                type="button"
                onClick={() => onViewAnalytics?.(ad)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border bg-background py-2 font-medium text-foreground text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                title="Ver Métricas de Desempenho"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Ver Métricas
              </button>
            )}

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border bg-background py-2 font-medium text-foreground text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              title="Editar Anúncio"
            >
              <Edit className="h-3.5 w-3.5" />
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Modal Component
function EditAnnouncementModal({
  ad,
  onClose,
  onSuccess,
}: {
  ad: DashboardAnnouncementItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const assignmentsQuery = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );
  const assignments = assignmentsQuery.data;

  const selectedAssignment = assignments?.find(
    (a) => a.id === ad.providerLocationId,
  );
  const canVerify =
    selectedAssignment?.type === 'RESIDENT' &&
    selectedAssignment?.status === 'APPROVED';

  const [title, setTitle] = useState(ad.title);
  const [subtitle, setSubtitle] = useState(ad.subtitle || '');
  const [description, setDescription] = useState(ad.description);
  const [price, setPrice] = useState<number | ''>(
    ad.priceCents ? ad.priceCents / 100 : '',
  );
  const [category, setCategory] = useState(ad.category);
  const [whatsapp, setWhatsapp] = useState(ad.contactLinks.whatsapp || '');
  const [instagram, setInstagram] = useState(ad.contactLinks.instagram || '');
  const [website, setWebsite] = useState(ad.contactLinks.website || '');
  const [showVerifiedBadge, setShowVerifiedBadge] = useState(
    ad.showVerifiedBadge,
  );
  const [imageUrl, setImageUrl] = useState(ad.imageUrl);
  const [isUploading, setIsUploading] = useState(false);

  // Crop states
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCroppingOpen, setIsCroppingOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation(
    trpc.announcement.update.mutationOptions({
      onSuccess: () => {
        toast.success('Anúncio atualizado com sucesso!');
        onSuccess();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao atualizar anúncio.');
      },
    }),
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setIsCroppingOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!selectedImageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(
        selectedImageSrc,
        croppedAreaPixels,
      );

      const formData = new FormData();
      formData.append('file', croppedBlob, 'cover-image.webp');
      formData.append('type', 'image');

      const response = await fetch(`${env.VITE_SERVER_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha no upload da imagem recortada.');
      }

      const data = await response.json();
      setImageUrl(data.url);
      toast.success('Imagem recortada e enviada com sucesso!');
      setIsCroppingOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      toast.error('O título do anúncio deve ter pelo menos 3 caracteres.');
      return;
    }

    if (description.trim().length < 10) {
      toast.error('A descrição do anúncio deve ter pelo menos 10 caracteres.');
      return;
    }

    if (!whatsapp.trim() && !instagram.trim() && !website.trim()) {
      toast.error(
        'Forneça pelo menos um meio de contato (WhatsApp, Instagram ou Site).',
      );
      return;
    }

    updateMutation.mutate({
      id: ad.id,
      title,
      subtitle: subtitle || null,
      description,
      priceCents: price ? Math.round(Number(price) * 100) : null,
      imageUrl,
      category,
      tags: ad.tags,
      contactLinks: {
        whatsapp: whatsapp || undefined,
        instagram: instagram || undefined,
        website: website || undefined,
      },
      showVerifiedBadge: showVerifiedBadge && canVerify,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-border border-b p-5">
          <div>
            <h3 className="font-bold text-foreground text-xl">
              Editar Anúncio
            </h3>
            <p className="mt-0.5 text-muted-foreground text-xs">
              As alterações serão salvas e enviadas para revisão.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={handleSave}
          className="flex-1 space-y-5 overflow-y-auto p-6"
        >
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <span className="block font-medium text-foreground text-sm">
              Imagem de Capa (4:3)
            </span>
            <div className="flex items-center gap-4">
              <div className="relative aspect-[4/3] w-32 overflow-hidden rounded-lg border border-border bg-muted">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/75">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                >
                  Alterar Imagem
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <p className="text-muted-foreground text-xs">
                  Imagens na proporção 4:3 são preferíveis.
                </p>
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block font-medium text-foreground text-sm">
                Título *
              </span>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Marmitas Saudáveis"
              />
            </div>
            <div className="space-y-1.5">
              <span className="block font-medium text-foreground text-sm">
                Subtítulo (Opcional)
              </span>
              <Input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Feitas com amor e ingredientes locais"
              />
            </div>
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block font-medium text-foreground text-sm">
                Categoria *
              </span>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <span className="block font-medium text-foreground text-sm">
                Preço (R$, opcional)
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Ex: 25.00 (deixe em branco para combinar)"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="block font-medium text-foreground text-sm">
              Descrição Detalhada *
            </span>
            <Textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que você oferece, horários, prazos..."
              className="resize-none"
            />
          </div>

          {/* Contacts */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm">
              Meios de Contato (Forneça ao menos um)
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <span className="block text-muted-foreground text-xs">
                  WhatsApp (DDD + Número)
                </span>
                <Input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 47999999999"
                />
              </div>
              <div className="space-y-1.5">
                <span className="block text-muted-foreground text-xs">
                  Instagram (Username)
                </span>
                <Input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Ex: @seuusername"
                />
              </div>
              <div className="space-y-1.5">
                <span className="block text-muted-foreground text-xs">
                  Site / Portfólio (URL)
                </span>
                <Input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Ex: https://meusite.com"
                />
              </div>
            </div>
          </div>

          {/* Toggle Badge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
              <div className="space-y-0.5">
                <span className="block font-semibold text-foreground text-sm">
                  Exibir Selo de Morador Verificado
                </span>
                <span className="text-muted-foreground text-xs">
                  Exiba que você é um morador aprovado neste condomínio.
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="inline-block">
                        <Checkbox
                          disabled={!canVerify}
                          checked={showVerifiedBadge && canVerify}
                          onCheckedChange={(checked) =>
                            setShowVerifiedBadge(checked === true)
                          }
                        />
                      </span>
                    }
                  />
                  {!canVerify && (
                    <TooltipContent
                      side="top"
                      align="center"
                      className="max-w-xs p-2 text-center"
                    >
                      O selo de morador verificado está disponível apenas para
                      moradores de condomínio aprovados. Acesse a página "Minha
                      Conta" para verificar sua residência.
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
            {!canVerify && (
              <p className="px-1 text-[10px] text-warning">
                Indisponível: O selo de morador verificado está disponível
                apenas para moradores de condomínio aprovados. Acesse a página
                "Minha Conta" para verificar sua residência.
              </p>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-border border-t p-5">
          <Button type="button" onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || isUploading}
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Cropper Modal inside the edit modal */}
      {isCroppingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4">
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-border border-b p-5">
              <div>
                <h4 className="font-bold text-foreground text-lg">
                  Ajustar Imagem
                </h4>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Arraste para ajustar o enquadramento de 4:3.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCroppingOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="min-h-[300px] flex-1 space-y-4 p-6">
              <div className="relative aspect-[4/3] min-h-[220px] w-full overflow-hidden rounded-lg border bg-background">
                <Cropper
                  image={selectedImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={4 / 3}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) =>
                    setCroppedAreaPixels(croppedPixels)
                  }
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span className="font-medium text-foreground text-sm">
                    Zoom
                  </span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-border border-t bg-muted/50 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCroppingOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCropConfirm}
                disabled={isUploading}
              >
                {isUploading ? 'Salvando...' : 'Recortar e Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementAnalyticsModal({
  ad,
  onClose,
}: {
  ad: DashboardAnnouncementItem;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('7d');
  const analyticsQuery = useQuery(
    trpc.announcement.getAnalytics.queryOptions({
      announcementId: ad.id,
      period,
    }),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="relative w-full max-w-3xl rounded-xl border bg-card p-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h3 className="font-bold text-foreground text-xl">
            Métricas: {ad.title}
          </h3>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Analise a conversão e visualizações do seu anúncio no período
            selecionado.
          </p>
        </div>

        {/* Period Selector & Stats */}
        <div className="mb-6 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div>
              <p className="font-semibold text-[10px] text-muted-foreground uppercase">
                Visualizações
              </p>
              <p className="font-bold text-foreground text-xl">
                {analyticsQuery.data?.summary.totalImpressions ?? 0}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[10px] text-muted-foreground uppercase">
                Interações
              </p>
              <p className="font-bold text-foreground text-xl">
                {analyticsQuery.data?.summary.totalClicks ?? 0}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[10px] text-muted-foreground uppercase">
                Conversão
              </p>
              <p className="font-bold text-foreground text-xl">
                {analyticsQuery.data?.summary.conversionRate ?? 0}%
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {(['7d', '30d', '12m'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-2.5 py-1 font-medium text-xs transition-all ${
                  period === p
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : '12 Meses'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {analyticsQuery.isLoading ? (
          <div className="flex h-[260px] flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-xs">
              Carregando métricas...
            </p>
          </div>
        ) : analyticsQuery.isError ? (
          <div className="flex h-[260px] flex-col items-center justify-center space-y-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground text-xs">
              Erro ao carregar métricas.
            </p>
          </div>
        ) : (
          <div className="h-[260px] w-full">
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
    </div>
  );
}
