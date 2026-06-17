import { Badge } from '@neighborhood-showcase/ui/components/badge';
import { buttonVariants } from '@neighborhood-showcase/ui/components/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@neighborhood-showcase/ui/components/tabs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ProviderDashboardAnnouncementCard } from './panel/-provider-dashboard-announcement-card';
import {
  formatProviderDashboardDate,
  formatProviderDashboardPrice,
} from './panel/-provider-dashboard-formatters';
import type { ProviderDashboardAnnouncementItem } from './panel/-provider-dashboard-types';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard/announcements/')({
  component: ProviderAnnouncementsListPage,
});

type AnnouncementTabKey = 'active' | 'draft' | 'expired' | 'suspended';

interface AnnouncementTabConfig {
  emptyMessageKey: string;
  id: AnnouncementTabKey;
  labelKey: string;
}

interface AnnouncementBuckets {
  active: ProviderDashboardAnnouncementItem[];
  draft: ProviderDashboardAnnouncementItem[];
  expired: ProviderDashboardAnnouncementItem[];
  suspended: ProviderDashboardAnnouncementItem[];
}

const CREATE_ROUTE = '/panel/dashboard/announcements/new';

const TAB_CONFIGS: AnnouncementTabConfig[] = [
  {
    id: 'active',
    labelKey: 'meus_anuncios.tabs.active',
    emptyMessageKey: 'meus_anuncios.empty.active',
  },
  {
    id: 'draft',
    labelKey: 'meus_anuncios.tabs.draft',
    emptyMessageKey: 'meus_anuncios.empty.draft',
  },
  {
    id: 'expired',
    labelKey: 'meus_anuncios.tabs.expired',
    emptyMessageKey: 'meus_anuncios.empty.expired',
  },
  {
    id: 'suspended',
    labelKey: 'meus_anuncios.tabs.suspended',
    emptyMessageKey: 'meus_anuncios.empty.suspended',
  },
];

function ProviderAnnouncementsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<AnnouncementTabKey>('active');
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );
  const dashboardQuery = useQuery(
    trpc.announcement.getDashboardData.queryOptions(),
  );
  const renewMutation = useMutation(
    trpc.announcement.getPaymentDetails.mutationOptions({
      onSuccess: (data) => {
        navigate({
          to: '/panel/dashboard/anuncios/$id/pagamento',
          params: { id: data.announcementId },
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const hasProviderAssignment = assignments?.some(
    (assignment) =>
      assignment.type === 'RESIDENT' && assignment.status === 'APPROVED',
  );

  useEffect(() => {
    if (!isLoadingAssignments && assignments && !hasProviderAssignment) {
      toast.error(t('meus_anuncios.toast_error_no_provider_account'));
      navigate({ to: '/panel/account' });
    }
  }, [assignments, hasProviderAssignment, isLoadingAssignments, navigate, t]);

  if (!session || isLoadingAssignments || dashboardQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="space-y-2 px-6 py-8">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          {t('meus_anuncios.page_title')}
        </h1>
        <p className="text-destructive text-sm">
          {t('meus_anuncios.load_error')}
        </p>
      </div>
    );
  }

  const announcements: AnnouncementBuckets = dashboardQuery.data.announcements;
  const renewingAnnouncementId =
    renewMutation.variables?.announcementId ?? null;

  return (
    <div className="w-full space-y-8 px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            {t('meus_anuncios.page_title')}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {t('meus_anuncios.page_subtitle')}
          </p>
        </div>

        <Link to={CREATE_ROUTE} className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          {t('meus_anuncios.create_button')}
        </Link>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AnnouncementTabKey)}
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-transparent p-0">
          {TAB_CONFIGS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              data-testid={`meus-anuncios-tab-${tab.id}`}
              className="gap-2 rounded-xl border border-border bg-background px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <span>{t(tab.labelKey)}</span>
              <Badge
                variant="secondary"
                data-testid={`meus-anuncios-count-${tab.id}`}
                aria-label={t('meus_anuncios.count_badge_label', {
                  count: announcements[tab.id].length,
                })}
              >
                {announcements[tab.id].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIGS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <AnnouncementGrid
              activeTab={tab.id}
              emptyMessage={t(tab.emptyMessageKey)}
              items={announcements[tab.id]}
              isRenewingAnnouncementId={renewingAnnouncementId}
              onEdit={(announcement) => {
                navigate({
                  to: '/panel/dashboard/announcements/$id',
                  params: { id: announcement.id },
                });
              }}
              onPay={(announcement) => {
                navigate({
                  to: '/panel/dashboard/anuncios/$id/pagamento',
                  params: { id: announcement.id },
                });
              }}
              onRenew={(announcement) => {
                renewMutation.mutate({ announcementId: announcement.id });
              }}
              onViewAnalytics={(announcement) => {
                navigate({
                  to: '/panel/dashboard/announcements/$id',
                  params: { id: announcement.id },
                });
              }}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface AnnouncementGridProps {
  activeTab: AnnouncementTabKey;
  emptyMessage: string;
  isRenewingAnnouncementId: string | null;
  items: ProviderDashboardAnnouncementItem[];
  onEdit: (announcement: ProviderDashboardAnnouncementItem) => void;
  onPay: (announcement: ProviderDashboardAnnouncementItem) => void;
  onRenew: (announcement: ProviderDashboardAnnouncementItem) => void;
  onViewAnalytics: (announcement: ProviderDashboardAnnouncementItem) => void;
}

function AnnouncementGrid({
  activeTab,
  emptyMessage,
  isRenewingAnnouncementId,
  items,
  onEdit,
  onPay,
  onRenew,
  onViewAnalytics,
}: AnnouncementGridProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-border border-dashed px-6 py-12 text-center">
        <p className="font-medium text-muted-foreground text-sm">
          {emptyMessage}
        </p>
        <Link
          to={CREATE_ROUTE}
          className={buttonVariants({ className: 'mt-5' })}
        >
          {t('meus_anuncios.create_button')}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((announcement) => (
        <div
          key={announcement.id}
          className="relative"
          data-testid={`meus-anuncios-card-${activeTab}-${announcement.id}`}
        >
          <Link
            to="/panel/dashboard/announcements/$id"
            params={{ id: announcement.id }}
            aria-label={t('meus_anuncios.open_details', {
              title: announcement.title,
            })}
            className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <ProviderDashboardAnnouncementCard
            ad={announcement}
            formatDate={formatProviderDashboardDate}
            formatPrice={formatProviderDashboardPrice}
            isRenewing={isRenewingAnnouncementId === announcement.id}
            onEdit={() => onEdit(announcement)}
            onPay={
              announcement.status === 'DRAFT' ||
              announcement.status === 'PENDING_PAYMENT'
                ? () => onPay(announcement)
                : undefined
            }
            onRenew={
              announcement.status === 'EXPIRED'
                ? () => onRenew(announcement)
                : undefined
            }
            onViewAnalytics={() => onViewAnalytics(announcement)}
          />
        </div>
      ))}
    </div>
  );
}
