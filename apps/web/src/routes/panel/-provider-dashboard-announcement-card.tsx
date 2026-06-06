import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Edit,
  Eye,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';

interface ProviderDashboardAnnouncementCardProps {
  ad: ProviderDashboardAnnouncementItem;
  formatDate: (str: string | null) => string;
  formatPrice: (val: number | null) => string;
  isRenewing?: boolean;
  onEdit: () => void;
  onPay?: () => void;
  onRenew?: () => void;
  onViewAnalytics?: (ad: ProviderDashboardAnnouncementItem) => void;
}

export function ProviderDashboardAnnouncementCard({
  ad,
  formatDate,
  formatPrice,
  isRenewing = false,
  onEdit,
  onPay,
  onRenew,
  onViewAnalytics,
}: ProviderDashboardAnnouncementCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
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
          {ad.showVerifiedBadge && (
            <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/20 px-2 py-0.5 font-semibold text-[10px] text-primary">
              <ShieldCheck className="h-3 w-3" /> Morador Verificado
            </span>
          )}
        </div>
      </div>

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

        {ad.status === 'SUSPENDED' && ad.suspensionReason && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs">
            <span className="mb-1 block font-bold text-destructive">
              Motivo da Suspensão:
            </span>
            <p className="text-destructive italic">{ad.suspensionReason}</p>
          </div>
        )}

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

interface ProviderDashboardAnnouncementEmptyStateProps {
  buttonText?: string;
  hideButton?: boolean;
  link?: string;
  text: string;
}

export function ProviderDashboardAnnouncementEmptyState({
  buttonText,
  hideButton = false,
  link,
  text,
}: ProviderDashboardAnnouncementEmptyStateProps) {
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
