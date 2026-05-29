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
  UserX,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/dashboard/')({
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
}

function DashboardIndexComponent() {
  const { session } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'active' | 'draft' | 'expired' | 'suspended'
  >('active');
  const [editingAd, setEditingAd] = useState<DashboardAnnouncementItem | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch dashboard data
  const dashboardQuery = useQuery(
    trpc.announcement.getDashboardData.queryOptions(),
  );

  // Delete account mutation
  const deleteAccountMutation = useMutation(
    trpc.user.deleteAccount.mutationOptions({
      onSuccess: async () => {
        toast.success('Sua conta foi excluída permanentemente. Até logo!');
        await authClient.signOut();
        navigate({ to: '/' });
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao excluir conta.');
      },
    }),
  );

  // Renew payment intent mutation
  const renewMutation = useMutation(
    trpc.announcement.getPaymentDetails.mutationOptions({
      onSuccess: (data) => {
        toast.success('Intenção de pagamento gerada. Redirecionando...');
        navigate({
          to: `/dashboard/anuncios/${data.announcementId}/pagamento`,
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
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-slate-400">Carregando painel do provedor...</p>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="font-semibold text-slate-100 text-xl">
          Erro ao carregar dados
        </h2>
        <p className="max-w-md text-slate-400">
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
          <h1 className="font-bold text-3xl text-slate-100 tracking-tight">
            Painel do Provedor
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Bem-vindo de volta,{' '}
            <span className="font-medium text-slate-200">
              {session.data?.user.name}
            </span>
            . Gerencie seus anúncios e analise suas conversões.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard/anuncios/novo"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 font-medium text-sm text-white transition-all hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Criar Anúncio
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 font-medium text-rose-500 text-sm transition-all hover:bg-rose-500/10 hover:text-rose-400 active:scale-95"
          >
            <UserX className="h-4 w-4" />
            Excluir Conta
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Impressions */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-400 text-sm">
              Visualizações
            </span>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Eye className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-3xl text-slate-100">
              {stats.totalImpressions}
            </h3>
            <p className="mt-1 text-slate-500 text-xs">
              Exibições na vitrine pública
            </p>
          </div>
        </div>

        {/* Interactions */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-400 text-sm">
              Interações
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <MousePointerClick className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-3xl text-slate-100">
              {stats.totalInteractions}
            </h3>
            <p className="mt-1 text-slate-500 text-xs">
              Cliques em WhatsApp/Instagram/Site
            </p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-400 text-sm">
              Taxa de Conversão
            </span>
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className="font-bold text-3xl text-slate-100">
                {stats.conversionRate}%
              </h3>
            </div>
            {/* Visual Progress Bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list Navigation */}
      <div className="mb-6 border-slate-800 border-b">
        <div className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'active'
                ? 'border-indigo-400 border-b-2 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ativos ({announcements.active.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'draft'
                ? 'border-indigo-400 border-b-2 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rascunhos & Pendentes ({announcements.draft.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expired')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'expired'
                ? 'border-indigo-400 border-b-2 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expirados ({announcements.expired.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suspended')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'suspended'
                ? 'border-indigo-400 border-b-2 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
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
                link="/dashboard/anuncios/novo"
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
                link="/dashboard/anuncios/novo"
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
                    navigate({ to: `/dashboard/anuncios/${ad.id}/pagamento` })
                  }
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

      {/* Soft Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => deleteAccountMutation.mutate()}
          isPending={deleteAccountMutation.isPending}
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
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-slate-800 border-dashed p-12 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-slate-500" />
      <p className="mt-4 font-medium text-slate-400 text-sm">{text}</p>
      {!hideButton && link && buttonText && (
        <Link
          to={link}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-medium text-slate-200 text-sm transition-colors hover:bg-slate-800"
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
}: {
  ad: DashboardAnnouncementItem;
  onEdit: () => void;
  formatDate: (str: string | null) => string;
  formatPrice: (val: number | null) => string;
  onPay?: () => void;
  onRenew?: () => void;
  isRenewing?: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 transition-all duration-300 hover:border-slate-700/60">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {/* Status Badge */}
          <span
            className={`rounded-full px-2.5 py-1 font-semibold text-xs shadow-md backdrop-blur-md ${
              ad.status === 'ACTIVE'
                ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                : ad.status === 'PENDING_PAYMENT'
                  ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
                  : ad.status === 'DRAFT'
                    ? 'border border-slate-500/30 bg-slate-500/20 text-slate-300'
                    : ad.status === 'EXPIRED'
                      ? 'border border-rose-500/30 bg-rose-500/20 text-rose-300'
                      : 'border border-rose-600/40 bg-rose-600/30 text-rose-200'
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
            <span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 font-semibold text-[10px] text-indigo-300 backdrop-blur-md">
              <ShieldCheck className="h-3 w-3" /> Morador Verificado
            </span>
          )}
        </div>
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4">
          <p className="font-semibold text-indigo-300 text-xs uppercase tracking-wider">
            {ad.category}
          </p>
          <h4 className="line-clamp-1 font-bold text-lg text-slate-100">
            {ad.title}
          </h4>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-4 line-clamp-2 text-slate-400 text-sm">
          {ad.description}
        </p>

        {/* Meta Info */}
        <div className="mt-auto space-y-2 border-slate-800/80 border-t pt-4">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Preço:</span>
            <span className="font-bold text-slate-200 text-sm">
              {formatPrice(ad.priceCents)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Condomínio:</span>
            <span className="text-slate-300">{ad.condoName}</span>
          </div>

          {ad.status === 'ACTIVE' && ad.expiresAt && (
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Expira em:
              </span>
              <span className="font-medium text-slate-300">
                {formatDate(ad.expiresAt)}
              </span>
            </div>
          )}
        </div>

        {/* Suspended Reason Banner */}
        {ad.status === 'SUSPENDED' && ad.suspensionReason && (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs">
            <span className="mb-1 block font-bold text-rose-400">
              Motivo da Suspensão:
            </span>
            <p className="text-rose-300/90 italic">{ad.suspensionReason}</p>
          </div>
        )}

        {/* Buttons / Actions */}
        <div className="mt-5 flex gap-2">
          {ad.status === 'PENDING_PAYMENT' && onPay && (
            <button
              type="button"
              onClick={onPay}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 font-semibold text-slate-950 text-sm transition-colors hover:bg-amber-400"
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {isRenewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Renovar Anúncio (R$ 2,00)
            </button>
          )}

          <button
            type="button"
            onClick={onEdit}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 font-medium text-slate-300 text-sm transition-colors hover:bg-slate-800 hover:text-white ${
              ad.status === 'PENDING_PAYMENT' || ad.status === 'EXPIRED'
                ? 'px-3'
                : 'flex-1'
            }`}
            title="Editar Anúncio"
          >
            <Edit className="h-4 w-4" />
            {ad.status !== 'PENDING_PAYMENT' &&
              ad.status !== 'EXPIRED' &&
              'Editar'}
          </button>
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload da imagem.');
      }

      const data = await response.json();
      setImageUrl(data.url);
      toast.success('Imagem enviada com sucesso!');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro no upload da imagem.');
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
      showVerifiedBadge,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="fade-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-slate-800 border-b p-5">
          <div>
            <h3 className="font-bold text-slate-100 text-xl">Editar Anúncio</h3>
            <p className="mt-0.5 text-slate-400 text-xs">
              As alterações serão salvas e enviadas para revisão.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
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
            <span className="block font-medium text-slate-300 text-sm">
              Imagem de Capa (4:3)
            </span>
            <div className="flex items-center gap-4">
              <div className="relative aspect-[4/3] w-32 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 font-semibold text-slate-200 text-sm transition-colors hover:bg-slate-800"
                >
                  Alterar Imagem
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <p className="text-slate-500 text-xs">
                  Imagens na proporção 4:3 são preferíveis.
                </p>
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block font-medium text-slate-300 text-sm">
                Título *
              </span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Marmitas Saudáveis"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <span className="block font-medium text-slate-300 text-sm">
                Subtítulo (Opcional)
              </span>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Feitas com amor e ingredientes locais"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block font-medium text-slate-300 text-sm">
                Categoria *
              </span>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <span className="block font-medium text-slate-300 text-sm">
                Preço (R$, opcional)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Ex: 25.00 (deixe em branco para combinar)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="block font-medium text-slate-300 text-sm">
              Descrição Detalhada *
            </span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que você oferece, horários, prazos..."
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Contacts */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-300 text-sm">
              Meios de Contato (Forneça ao menos um)
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <span className="block text-slate-400 text-xs">
                  WhatsApp (DDD + Número)
                </span>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 47999999999"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <span className="block text-slate-400 text-xs">
                  Instagram (Username)
                </span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Ex: @seuusername"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <span className="block text-slate-400 text-xs">
                  Site / Portfólio (URL)
                </span>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Ex: https://meusite.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Toggle Badge */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="space-y-0.5">
              <span className="block font-semibold text-slate-200 text-sm">
                Exibir Selo de Morador Verificado
              </span>
              <span className="text-slate-500 text-xs">
                Exiba que você é um morador aprovado neste condomínio.
              </span>
            </div>
            <input
              type="checkbox"
              checked={showVerifiedBadge}
              onChange={(e) => setShowVerifiedBadge(e.target.checked)}
              className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/20"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-slate-800 border-t p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-2.5 font-semibold text-slate-300 text-sm transition-colors hover:bg-slate-800 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 font-semibold text-sm text-white transition-colors hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Account Modal Component
function DeleteAccountModal({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-slate-100 text-xl">
          Excluir Conta Permanentemente?
        </h3>
        <p className="mt-3 text-slate-400 text-sm leading-relaxed">
          Esta ação é <strong>irreversível</strong> e em conformidade com a{' '}
          <strong>LGPD</strong>.
        </p>
        <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-slate-400 text-xs leading-relaxed">
          Seus dados pessoais (nome, e-mail, telefone e CPF) serão apagados
          permanentemente. Seus anúncios serão removidos da vitrine pública.
          Registros financeiros de transações serão mantidos de forma totalmente
          anônima.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 font-semibold text-slate-300 text-sm transition-colors hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}
