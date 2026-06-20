import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Building2, Globe, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModerationCondo } from '@/lib/moderation-condo-context';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/moderation/condominium')({
  component: CondominiumInfoPage,
});

function CondominiumInfoPage() {
  const { t } = useTranslation();

  // Resolve the selected condo from the shared reactive store.
  const { selectedId: selectedCondoId, isPending: assignmentsLoading } =
    useModerationCondo();

  const {
    data: condo,
    isPending,
    isError,
    error,
  } = useQuery(
    trpc.condominium.getCondominiumInfo.queryOptions(
      { condominiumId: selectedCondoId ?? '' },
      { enabled: !!selectedCondoId },
    ),
  );

  if (assignmentsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedCondoId) {
    return (
      <div className="text-muted-foreground text-sm">
        {t('moderation.no_condo_selected')}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
        {error.message}
      </div>
    );
  }

  if (isPending || !condo) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="font-bold text-2xl tracking-tight">{condo.name}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* City / State / CEP */}
        <InfoCard
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          label={t('moderation.condo.city_state_cep')}
          value={`${condo.city}–${condo.state} · ${condo.cep}`}
        />

        {/* Status */}
        <InfoCard
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          label={t('moderation.condo.status')}
          value={condo.status}
        />

        {/* Email */}
        {condo.contactInfo?.email && (
          <InfoCard
            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            label={t('moderation.condo.email')}
            value={condo.contactInfo.email}
          />
        )}

        {/* Phone */}
        {condo.contactInfo?.phone && (
          <InfoCard
            icon={<Phone className="h-4 w-4 text-muted-foreground" />}
            label={t('moderation.condo.phone')}
            value={condo.contactInfo.phone}
          />
        )}

        {/* Website */}
        {condo.contactInfo?.website && (
          <InfoCard
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            label={t('moderation.condo.website')}
            value={condo.contactInfo.website}
          />
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-4">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {label}
        </p>
        <p className="mt-1 truncate font-semibold text-foreground text-sm">
          {value}
        </p>
      </div>
    </div>
  );
}
