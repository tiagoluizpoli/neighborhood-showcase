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
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ProviderDashboardAnalyticsPanel } from './panel/-provider-dashboard-analytics-panel';
import { ProviderDashboardEditFormFields } from './panel/-provider-dashboard-edit-form-fields';
import type { ProviderDashboardAnnouncementItem } from './panel/-provider-dashboard-types';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard/announcements/$id')({
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

  const { data: session } = authClient.useSession();

  const hasProviderAssignment = assignmentsQuery.data?.some(
    (a) => a.type === 'RESIDENT' && a.status === 'APPROVED',
  );

  useEffect(() => {
    if (announcement) {
      setForm(createInitialFormState(announcement));
    }
  }, [announcement]);

  useEffect(() => {
    if (
      !assignmentsQuery.isLoading &&
      assignmentsQuery.data &&
      !hasProviderAssignment
    ) {
      void navigate({ to: '/panel/account' });
    }
  }, [
    assignmentsQuery.isLoading,
    assignmentsQuery.data,
    hasProviderAssignment,
    navigate,
  ]);

  useEffect(() => {
    if (!dashboardQuery.isLoading && dashboardQuery.data && !announcement) {
      toast.error(t('meus_anuncios.detail.not_found_toast'));
      void navigate({ to: '/panel/dashboard/announcements' });
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

  if (
    !session ||
    assignmentsQuery.isLoading ||
    dashboardQuery.isLoading ||
    !form
  ) {
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

    if (
      !form.whatsapp.trim() &&
      !form.instagram.trim() &&
      !form.website.trim()
    ) {
      toast.error(t('meus_anuncios.detail.validation.contact'));
      return;
    }

    updateMutation.mutate({
      categoryId: form.categoryId,
      contactLinks: {
        instagram: form.instagram || undefined,
        website: form.website || undefined,
        whatsapp: form.whatsapp || undefined,
      },
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/panel/dashboard/announcements"
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
        <Card className="overflow-hidden">
          <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
            <img
              src={isEditing ? form.imageUrl : announcement.imageUrl}
              alt={announcement.title}
              className="h-full w-full object-cover"
            />
          </div>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge announcement={announcement} t={t} />
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
                <CardDescription className="text-base">
                  {announcement.subtitle}
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
              <ContactLinks links={announcement.contactLinks} />
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
                <CardTitle>{t('meus_anuncios.detail.summary_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <SummaryRow
                  label={t('meus_anuncios.detail.summary.status')}
                  value={t(statusKeyForAnnouncement(announcement))}
                />
                <SummaryRow
                  label={t('meus_anuncios.detail.summary.contact_channels')}
                  value={String(countContactLinks(announcement.contactLinks))}
                />
                <SummaryRow
                  label={t('meus_anuncios.detail.summary.tags')}
                  value={String(announcement.tags.length)}
                />
              </CardContent>
            </Card>
          </CardContent>
        </Card>

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
                description={form.description}
                imageUrl={form.imageUrl}
                instagram={form.instagram}
                isUploading={false}
                price={form.price}
                showVerifiedBadge={form.showVerifiedBadge}
                subtitle={form.subtitle}
                title={form.title}
                website={form.website}
                whatsapp={form.whatsapp}
                onCategoryIdChange={(value) =>
                  setForm({ ...form, categoryId: value })
                }
                onDescriptionChange={(value) =>
                  setForm({ ...form, description: value })
                }
                onImageUrlChange={(value) =>
                  setForm({ ...form, imageUrl: value })
                }
                onInstagramChange={(value) =>
                  setForm({ ...form, instagram: value })
                }
                onPriceChange={(value) => setForm({ ...form, price: value })}
                onShowVerifiedBadgeChange={(value) =>
                  setForm({ ...form, showVerifiedBadge: value })
                }
                onSubtitleChange={(value) =>
                  setForm({ ...form, subtitle: value })
                }
                onTitleChange={(value) => setForm({ ...form, title: value })}
                onUploadingChange={() => {}}
                onWebsiteChange={(value) =>
                  setForm({ ...form, website: value })
                }
                onWhatsappChange={(value) =>
                  setForm({ ...form, whatsapp: value })
                }
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
  );
}

interface ProviderAnnouncementFormState {
  categoryId: string;
  description: string;
  imageUrl: string;
  instagram: string;
  price: number | '';
  showVerifiedBadge: boolean;
  subtitle: string;
  title: string;
  website: string;
  whatsapp: string;
}

function createInitialFormState(
  announcement: ProviderDashboardAnnouncementItem,
): ProviderAnnouncementFormState {
  return {
    categoryId: announcement.categoryId,
    description: announcement.description,
    imageUrl: announcement.imageUrl,
    instagram: announcement.contactLinks.instagram || '',
    price: announcement.priceCents ? announcement.priceCents / 100 : '',
    showVerifiedBadge: announcement.showVerifiedBadge,
    subtitle: announcement.subtitle || '',
    title: announcement.title,
    website: announcement.contactLinks.website || '',
    whatsapp: announcement.contactLinks.whatsapp || '',
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

function ContactLinks({
  links,
}: {
  links: ProviderDashboardAnnouncementItem['contactLinks'];
}) {
  const { t } = useTranslation();
  const entries = Object.entries(links).filter(([, value]) => Boolean(value));

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-foreground text-lg">
        {t('meus_anuncios.detail.contact_title')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-2xl border bg-background px-4 py-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {t(`meus_anuncios.detail.contact_labels.${key}`)}
            </p>
            <p className="mt-1 font-medium text-foreground text-sm">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({
  announcement,
  t,
}: {
  announcement: ProviderDashboardAnnouncementItem;
  t: (key: string) => string;
}) {
  return (
    <Badge variant="outline">{t(statusKeyForAnnouncement(announcement))}</Badge>
  );
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
