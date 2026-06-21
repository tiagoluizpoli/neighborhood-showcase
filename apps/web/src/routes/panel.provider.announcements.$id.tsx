import { Badge } from '@neighborhood-showcase/ui/components/badge';
import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Loader2, Phone, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ProviderDashboardAnalyticsPanel } from './panel/-provider-dashboard-analytics-panel';
import { ProviderDashboardEditFormFields } from './panel/-provider-dashboard-edit-form-fields';
import type { ProviderDashboardAnnouncementItem } from './panel/-provider-dashboard-types';
import {
  type AnnouncementContactMode,
  hasBaseline,
  type ProviderContactDefaultsView,
} from './panel/provider/-announcement-contact-section';
import {
  type AnnouncementCtaView,
  ctaHasIncompleteTarget,
  withCtaIds,
} from './panel/provider/-announcement-cta-section';
import { AnnouncementPresentationPrimitive } from '@/components/announcement-presentation-primitive';
import { PanelContentContainer } from '@/components/panel-content-container';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/provider/announcements/$id')({
  component: ProviderAnnouncementDetailPage,
});

type AnalyticsPeriod = '7d' | '30d' | '12m';

export function ProviderAnnouncementDetailPage() {
  const { id } = Route.useParams();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [form, setForm] = useState<ProviderAnnouncementFormState | null>(null);
  const dashboardQuery = useQuery(
    trpc.announcement.getDashboardData.queryOptions(),
  );
  const categoriesQuery = useQuery(
    trpc.announcement.listCategories.queryOptions(),
  );
  const providerProfileQuery = useQuery(
    trpc.providerProfile.get.queryOptions(),
  );
  const assignmentsQuery = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );

  const announcement = useMemo(
    () =>
      flattenAnnouncements(dashboardQuery.data?.announcements).find(
        (item) => item.id === id,
      ) ?? null,
    [dashboardQuery.data, id],
  );

  const selectedAssignment = assignmentsQuery.data?.find(
    (assignment) => assignment.id === announcement?.providerAssignmentId,
  );
  const canVerify =
    selectedAssignment?.type === 'RESIDENT' &&
    selectedAssignment?.status === 'APPROVED';
  const providerDefaults = toProviderContactDefaults(
    providerProfileQuery.data?.contactDefaults,
  );

  useEffect(() => {
    if (announcement) {
      setForm(createInitialFormState(announcement));
    }
  }, [announcement]);

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

  const updateMutation = useMutation(
    trpc.announcement.update.mutationOptions({
      onError: (error) => {
        toast.error(error.message || t('meus_anuncios.detail.update_error'));
      },
      onSuccess: () => {
        toast.success(t('meus_anuncios.detail.update_success'));
        setIsEditing(false);
        void queryClient.invalidateQueries({
          queryKey: trpc.announcement.getDashboardData.queryKey(),
        });
      },
    }),
  );

  if (assignmentsQuery.isLoading || dashboardQuery.isLoading || !form) {
    return (
      <CenteredState message={t('meus_anuncios.detail.loading')} spinning />
    );
  }

  if (!announcement) {
    return null;
  }

  const handleSave = () => {
    if (form.title.trim().length < 3) {
      toast.error(t('meus_anuncios.detail.validation.title'));
      return;
    }

    if (form.description.trim().length < 10) {
      toast.error(t('meus_anuncios.detail.validation.description'));
      return;
    }

    if (form.contactMode === 'inherit' && !hasBaseline(providerDefaults)) {
      toast.error(t('new_announcement.toast.inherit_no_baseline'));
      return;
    }

    if (
      form.contactMode === 'custom' &&
      form.customPhone.replace(/\D/g, '').length < 10
    ) {
      toast.error(t('new_announcement.toast.custom_phone_invalid'));
      return;
    }

    if (ctaHasIncompleteTarget(form.cta)) {
      toast.error(t('new_announcement.toast.cta_incomplete'));
      return;
    }

    updateMutation.mutate({
      categoryId: form.categoryId,
      contact:
        form.contactMode === 'inherit'
          ? { mode: 'inherit', custom: null }
          : {
              mode: 'custom',
              custom: {
                primaryPhone: form.customPhone,
                callEnabled: form.customCallEnabled,
              },
            },
      cta: form.cta,
      description: form.description,
      id: announcement.id,
      imageUrl: form.imageUrl,
      priceCents:
        form.price === '' ? null : Math.round(Number(form.price) * 100),
      showVerifiedBadge: form.showVerifiedBadge && canVerify,
      subtitle: form.subtitle || null,
      tags: announcement.tags,
      title: form.title,
    });
  };

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

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setForm(createInitialFormState(announcement));
                    setIsEditing(false);
                  }}
                >
                  {t('meus_anuncios.detail.cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t('meus_anuncios.detail.save')}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                {t('meus_anuncios.detail.edit')}
              </Button>
            )}
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <div className="flex flex-col gap-6">
            <AnnouncementPresentationPrimitive
              variant="detail-header"
              announcement={{
                flaggedForReview: announcement.flaggedForReview,
                imageUrl: isEditing ? form.imageUrl : announcement.imageUrl,
                showVerifiedBadge: announcement.showVerifiedBadge,
                status: announcement.status,
                subtitle: announcement.subtitle,
                title: announcement.title,
              }}
            />
            <Card>
              <CardContent className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
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
                  <div className="space-y-2">
                    <h2 className="font-semibold text-foreground text-lg">
                      {t('meus_anuncios.detail.description_title')}
                    </h2>
                    <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-6">
                      {announcement.description}
                    </p>
                  </div>
                  <AnnouncementContactCard
                    announcement={announcement}
                    providerDefaults={providerDefaults}
                  />
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

                <Card className="h-fit border-dashed bg-muted/10">
                  <CardHeader>
                    <CardTitle>
                      {t('meus_anuncios.detail.summary_title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <SummaryRow
                      label={t('meus_anuncios.detail.summary.status')}
                      value={t(statusKeyForAnnouncement(announcement))}
                    />
                    <SummaryRow
                      label={t('meus_anuncios.detail.summary.contact_channels')}
                      value={String(
                        countContactLinks(announcement.contactLinks),
                      )}
                    />
                    <SummaryRow
                      label={t('meus_anuncios.detail.summary.tags')}
                      value={String(announcement.tags.length)}
                    />
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('meus_anuncios.detail.edit_panel_title')}
                </CardTitle>
                <CardDescription>
                  {t('meus_anuncios.detail.edit_panel_subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ProviderDashboardEditFormFields
                  backendCategories={categoriesQuery.data}
                  canVerify={canVerify}
                  categoryId={form.categoryId}
                  contactMode={form.contactMode}
                  cta={form.cta}
                  customCallEnabled={form.customCallEnabled}
                  customPhone={form.customPhone}
                  description={form.description}
                  imageUrl={form.imageUrl}
                  isLoadingProviderDefaults={providerProfileQuery.isLoading}
                  isUploading={false}
                  price={form.price}
                  providerDefaults={providerDefaults}
                  showVerifiedBadge={form.showVerifiedBadge}
                  subtitle={form.subtitle}
                  title={form.title}
                  onCategoryIdChange={(value: string) =>
                    setForm({ ...form, categoryId: value })
                  }
                  onConfigureContact={() =>
                    void navigate({ to: '/panel/provider/configuration' })
                  }
                  onContactModeChange={(value: AnnouncementContactMode) =>
                    setForm({ ...form, contactMode: value })
                  }
                  onCtaChange={(value: AnnouncementCtaView) =>
                    setForm({ ...form, cta: value })
                  }
                  onCustomCallEnabledChange={(value: boolean) =>
                    setForm({ ...form, customCallEnabled: value })
                  }
                  onCustomPhoneChange={(value: string) =>
                    setForm({ ...form, customPhone: value })
                  }
                  onDescriptionChange={(value: string) =>
                    setForm({ ...form, description: value })
                  }
                  onImageUrlChange={(value: string) =>
                    setForm({ ...form, imageUrl: value })
                  }
                  onPriceChange={(value: number | '') =>
                    setForm({ ...form, price: value })
                  }
                  onShowVerifiedBadgeChange={(value: boolean) =>
                    setForm({ ...form, showVerifiedBadge: value })
                  }
                  onSubtitleChange={(value: string) =>
                    setForm({ ...form, subtitle: value })
                  }
                  onTitleChange={(value: string) =>
                    setForm({ ...form, title: value })
                  }
                  onUploadingChange={() => {}}
                />
              </CardContent>
            </Card>
          ) : (
            <ProviderDashboardAnalyticsPanel
              announcementId={announcement.id}
              period={period}
              title={announcement.title}
              onPeriodChange={setPeriod}
            />
          )}
        </section>
      </div>
    </PanelContentContainer>
  );
}

interface ProviderAnnouncementFormState {
  categoryId: string;
  contactMode: AnnouncementContactMode;
  cta: AnnouncementCtaView;
  customCallEnabled: boolean;
  customPhone: string;
  description: string;
  imageUrl: string;
  price: number | '';
  showVerifiedBadge: boolean;
  subtitle: string;
  title: string;
}

function createInitialFormState(
  announcement: ProviderDashboardAnnouncementItem,
): ProviderAnnouncementFormState {
  return {
    categoryId: announcement.categoryId,
    contactMode: announcement.contact.mode,
    cta: withCtaIds(announcement.cta),
    customCallEnabled: announcement.contact.custom?.callEnabled ?? false,
    customPhone: announcement.contact.custom?.primaryPhone ?? '',
    description: announcement.description,
    imageUrl: announcement.imageUrl,
    price: announcement.priceCents ? announcement.priceCents / 100 : '',
    showVerifiedBadge: announcement.showVerifiedBadge,
    subtitle: announcement.subtitle || '',
    title: announcement.title,
  };
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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

function countContactLinks(
  links: ProviderDashboardAnnouncementItem['contactLinks'],
) {
  return Object.values(links).filter(Boolean).length;
}
