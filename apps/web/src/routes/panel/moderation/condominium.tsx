import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Building2, Globe, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { trpc, trpcClient } from '@/utils/trpc';

const STORAGE_KEY = 'mod_ctx__cndo';

async function getModeratorAssignments() {
  const session = await authClient.getSession();
  if (!session.data) return [];
  const assignments = await trpcClient.assignment.getMyAssignments.query();
  return assignments.filter(
    (a): a is (typeof assignments)[number] & { condominiumId: string } =>
      a.type === 'MODERATOR' &&
      a.status === 'APPROVED' &&
      a.condominiumId !== null,
  );
}

function getSelectedCondoId(assignments: { condominiumId: string }[]): string {
  if (assignments.length === 0) return '';
  const stored = localStorage.getItem(STORAGE_KEY);
  const valid =
    stored != null && assignments.some((a) => a.condominiumId === stored);
  if (!valid) {
    const id = assignments[0].condominiumId;
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  }
  return stored;
}

export const Route = createFileRoute('/panel/moderation/condominium')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw new Response(null, { status: 401 });
    }
  },
  component: CondominiumInfoPage,
});

function CondominiumInfoPage() {
  const { t } = useTranslation();

  // Get assignments and resolve the selected condo ID
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignment:getMyAssignments'],
    queryFn: getModeratorAssignments,
  });

  const selectedCondoId =
    !assignmentsLoading && assignments ? getSelectedCondoId(assignments) : null;

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
        {t('moderation.no_condo_selected', {
          defaultValue: 'Nenhum condomínio selecionado.',
        })}
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
          label={t('moderation.condo.city_state_cep', {
            defaultValue: 'Cidade / Estado / CEP',
          })}
          value={`${condo.city}–${condo.state} · ${condo.cep}`}
        />

        {/* Status */}
        <InfoCard
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          label={t('moderation.condo.status', { defaultValue: 'Status' })}
          value={condo.status}
        />

        {/* Email */}
        {condo.contactInfo?.email && (
          <InfoCard
            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            label={t('moderation.condo.email', { defaultValue: 'E-mail' })}
            value={condo.contactInfo.email}
          />
        )}

        {/* Phone */}
        {condo.contactInfo?.phone && (
          <InfoCard
            icon={<Phone className="h-4 w-4 text-muted-foreground" />}
            label={t('moderation.condo.phone', { defaultValue: 'Telefone' })}
            value={condo.contactInfo.phone}
          />
        )}

        {/* Website */}
        {condo.contactInfo?.website && (
          <InfoCard
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            label={t('moderation.condo.website', { defaultValue: 'Website' })}
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
