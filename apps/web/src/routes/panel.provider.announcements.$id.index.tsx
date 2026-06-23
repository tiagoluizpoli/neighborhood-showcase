import { Badge } from '@neighborhood-showcase/ui/components/badge';
import { Button } from '@neighborhood-showcase/ui/components/button';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Loader2, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ProviderDashboardAnalyticsPanel } from './panel/-provider-dashboard-analytics-panel';
import type { ProviderDashboardAnnouncementItem } from './panel/-provider-dashboard-types';
import {
  hasBaseline,
  type ProviderContactDefaultsView,
} from './panel/provider/-announcement-contact-section';
import { PanelContentContainer } from '@/components/panel-content-container';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/provider/announcements/$id/')({
  component: ProviderAnnouncementDetailPage,
});

type AnalyticsPeriod = '7d' | '30d' | '12m';

export function ProviderAnnouncementDetailPage() {
  const { id } = Route.useParams();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const dashboardQuery = useQuery(
    trpc.announcement.getDashboardData.queryOptions(),
  );
  const providerProfileQuery = useQuery(
    trpc.providerProfile.get.queryOptions(),
  );

  const announcement = useMemo(
    () =>
      flattenAnnouncements(dashboardQuery.data?.announcements).find(
        (item) => item.id === id,
      ) ?? null,
    [dashboardQuery.data, id],
  );

  const providerDefaults = toProviderContactDefaults(
    providerProfileQuery.data?.contactDefaults,
  );

  useEffect(() => {
    if (!dashboardQuery.isLoading && dashboardQuery.data && !announcement) {
      toast.error(t('meus_anuncios.detail.not_found_toast'));
      void navigate({ to: '/panel/provider/announcements' });
    }
  }, [
    announcement,
    dashboardQuery.data,
    dashboardQuery.isLoading,
    navigate,
    t,
  ]);

  if (dashboardQuery.isLoading) {
    return (
      <CenteredState message={t('meus_anuncios.detail.loading')} spinning />
    );
  }

  if (!announcement) {
    return null;
  }

  const locale = i18n.language === 'en' ? 'en-US' : 'pt-BR';

  return (
    <PanelContentContainer variant="default">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/panel/provider/announcements"
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 font-medium text-foreground text-xs transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('meus_anuncios.detail.back')}
          </Link>

          <Button
            type="button"
            onClick={() =>
              navigate({
                to: '/panel/provider/announcements/$id/edit',
                params: { id },
              })
            }
          >
            {t('meus_anuncios.detail.edit')}
          </Button>
        </div>

        {/* Primary block: title + key facts + contact | constrained image */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {t(statusKeyForAnnouncement(announcement))}
                </Badge>
                {announcement.showVerifiedBadge && (
                  <Badge className="gap-1" variant="secondary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t('meus_anuncios.detail.verified_badge')}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="font-semibold text-3xl">{announcement.title}</h1>
                {announcement.subtitle && (
                  <p className="text-base text-muted-foreground">
                    {announcement.subtitle}
                  </p>
                )}
              </div>
            </div>

            <DetailList
              items={[
                [
                  t('meus_anuncios.detail.fields.category'),
                  announcement.category,
                ],
                [
                  t('meus_anuncios.detail.fields.price'),
                  formatPrice(announcement.priceCents, locale, t),
                ],
                [
                  t('meus_anuncios.detail.fields.condo'),
                  announcement.condoName,
                ],
                [
                  t('meus_anuncios.detail.fields.created_at'),
                  formatDate(announcement.createdAt, locale),
                ],
                [
                  t('meus_anuncios.detail.fields.paid_at'),
                  formatDate(announcement.paidAt, locale),
                ],
                [
                  t('meus_anuncios.detail.fields.expires_at'),
                  formatDate(announcement.expiresAt, locale),
                ],
              ]}
            />

            <AnnouncementContactCard
              announcement={announcement}
              providerDefaults={providerDefaults}
            />
          </div>

          {/* Constrained 4:3 cover (~300px on desktop) */}
          <div className="w-full shrink-0 overflow-hidden rounded-2xl border lg:w-[300px]">
            <div className="aspect-[4/3] w-full">
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Secondary: description, tags, suspension reason */}
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-semibold text-foreground text-lg">
              {t('meus_anuncios.detail.description_title')}
            </h2>
            <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-6">
              {announcement.description}
            </p>
          </div>
          {announcement.tags.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-foreground text-lg">
                {t('meus_anuncios.detail.tags_title')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {announcement.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {announcement.suspensionReason && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <h2 className="font-semibold text-destructive">
                {t('meus_anuncios.detail.suspension_title')}
              </h2>
              <p className="mt-2 text-destructive/90 text-sm">
                {announcement.suspensionReason}
              </p>
            </div>
          )}
        </div>

        <ProviderDashboardAnalyticsPanel
          announcementId={announcement.id}
          period={period}
          title={announcement.title}
          onPeriodChange={setPeriod}
        />
      </div>
    </PanelContentContainer>
  );
}

function flattenAnnouncements(announcements?: {
  active: ProviderDashboardAnnouncementItem[];
  draft: ProviderDashboardAnnouncementItem[];
  expired: ProviderDashboardAnnouncementItem[];
  suspended: ProviderDashboardAnnouncementItem[];
}) {
  if (!announcements) return [];
  return [
    ...announcements.active,
    ...announcements.draft,
    ...announcements.expired,
    ...announcements.suspended,
  ];
}

function CenteredState({
  message,
  spinning = false,
}: {
  message: string;
  spinning?: boolean;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3">
      {spinning && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

function DetailList({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border bg-background px-4 py-3">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 font-medium text-foreground text-sm">{value}</p>
        </div>
      ))}
    </div>
  );
}

function AnnouncementContactCard({
  announcement,
  providerDefaults,
}: {
  announcement: ProviderDashboardAnnouncementItem;
  providerDefaults: ProviderContactDefaultsView | null;
}) {
  const { t } = useTranslation();
  const isInherited = announcement.contact.mode === 'inherit';
  const effectivePhone = isInherited
    ? hasBaseline(providerDefaults)
      ? providerDefaults.primaryPhone
      : announcement.contactLinks.whatsapp
    : announcement.contact.custom?.primaryPhone;
  const callEnabled = isInherited
    ? hasBaseline(providerDefaults)
      ? providerDefaults.callEnabled
      : false
    : (announcement.contact.custom?.callEnabled ?? false);

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-foreground text-lg">
        {t('meus_anuncios.detail.contact_title')}
      </h2>
      <div className="space-y-3 rounded-2xl border bg-background px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isInherited ? 'secondary' : 'outline'}
            className="gap-1"
          >
            {isInherited && <Sparkles className="h-3 w-3" />}
            {t(
              isInherited
                ? 'new_announcement.contact_card.mode_inherit_badge'
                : 'new_announcement.contact_card.mode_custom_badge',
            )}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {t(
            isInherited
              ? 'new_announcement.contact_card.inherit_description'
              : 'new_announcement.contact_card.custom_description',
          )}
        </p>
        {effectivePhone ? (
          <div className="rounded-xl border bg-muted/20 px-4 py-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {t('meus_anuncios.detail.contact_labels.whatsapp')}
            </p>
            <div className="mt-1 flex items-center gap-2 font-medium text-foreground text-sm">
              <Phone className="h-4 w-4 text-primary" />
              {effectivePhone}
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              {t(
                callEnabled
                  ? 'new_announcement.contact_card.calls_on'
                  : 'new_announcement.contact_card.calls_off',
              )}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            {t('new_announcement.contact_card.no_baseline_warning')}
          </div>
        )}
      </div>
    </div>
  );
}

function toProviderContactDefaults(
  defaults:
    | {
        primaryPhone?: string | null;
        callEnabled?: boolean | null;
      }
    | undefined,
): ProviderContactDefaultsView | null {
  if (!defaults) {
    return null;
  }

  return {
    primaryPhone: defaults.primaryPhone ?? '',
    callEnabled: defaults.callEnabled ?? false,
  };
}

function statusKeyForAnnouncement(
  announcement: ProviderDashboardAnnouncementItem,
) {
  if (announcement.status === 'ACTIVE' && announcement.flaggedForReview) {
    return 'meus_anuncios.detail.status.active_review';
  }

  return `meus_anuncios.detail.status.${announcement.status.toLowerCase()}`;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatPrice(
  value: number | null,
  locale: string,
  t: (key: string) => string,
) {
  if (value === null || value === undefined) {
    return t('meus_anuncios.detail.price_on_request');
  }

  return new Intl.NumberFormat(locale, {
    currency: 'BRL',
    style: 'currency',
  }).format(value / 100);
}
