import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ModerationReportsQueue } from '../-moderation-reports-queue';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/moderation/reports')({
  component: ModerationReportsPage,
});

function ModerationReportsPage() {
  const { isSystemManager } = Route.useRouteContext();
  const { t } = useTranslation();

  const [isSuspendingId, setIsSuspendingId] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isBanningUserId, setIsBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [viewingReportsAdId, setViewingReportsAdId] = useState<string | null>(
    null,
  );

  const reportedQuery = useQuery(
    trpc.announcement.listReported.queryOptions({}),
  );

  const dismissReportsMutation = useMutation(
    trpc.announcement.dismissReports.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.dismiss_success'));
        reportedQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || t('moderation.dismiss_error'));
      },
    }),
  );

  const suspendMutation = useMutation(
    trpc.announcement.suspend.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.suspend_success'));
        setIsSuspendingId(null);
        setSuspensionReason('');
        reportedQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || t('moderation.suspend_error'));
      },
    }),
  );

  const banProviderMutation = useMutation(
    trpc.admin.banProvider.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.ban_success'));
        setIsBanningUserId(null);
        setBanReason('');
        reportedQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || t('moderation.ban_error'));
      },
    }),
  );

  const getReasonLabel = (reasonKey: string) => {
    switch (reasonKey) {
      case 'FRAUDE_GOLPE':
        return t('moderation.reason_fraude');
      case 'ASSEDIO_OFENSIVO':
        return t('moderation.reason_assedio');
      case 'SPAM':
        return t('moderation.reason_spam');
      case 'SERVICO_ILEGAL':
        return t('moderation.reason_servico_ilegal');
      default:
        return t('moderation.reason_outros');
    }
  };

  if (reportedQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const reportedAnnouncements = reportedQuery.data || [];
  const selectedAdForReports = reportedAnnouncements.find(
    (a) => a.id === viewingReportsAdId,
  );

  return (
    <ModerationReportsQueue
      banPending={banProviderMutation.isPending}
      banReason={banReason}
      dismissReportsPending={dismissReportsMutation.isPending}
      getReasonLabel={getReasonLabel}
      isBanningUserId={isBanningUserId}
      isSuspendingId={isSuspendingId}
      isSystemManager={isSystemManager}
      reportedAnnouncements={reportedAnnouncements}
      selectedAdForReports={selectedAdForReports}
      suspensionReason={suspensionReason}
      suspendPending={suspendMutation.isPending}
      t={t}
      viewingReportsAdId={viewingReportsAdId}
      onBanReasonChange={setBanReason}
      onCancelBan={() => setIsBanningUserId(null)}
      onCancelSuspend={() => setIsSuspendingId(null)}
      onCloseDetails={() => setViewingReportsAdId(null)}
      onConfirmBan={(providerId) =>
        banProviderMutation.mutate({ id: providerId, reason: banReason })
      }
      onConfirmDismiss={(announcementId) =>
        dismissReportsMutation.mutate({ announcementId })
      }
      onConfirmSuspend={(announcementId) =>
        suspendMutation.mutate({ id: announcementId, reason: suspensionReason })
      }
      onOpenBan={(announcementId) => {
        setIsBanningUserId(announcementId);
        setBanReason('');
      }}
      onOpenDetails={setViewingReportsAdId}
      onOpenSuspend={(announcementId) => {
        setIsSuspendingId(announcementId);
        setSuspensionReason('');
      }}
      onSuspensionReasonChange={setSuspensionReason}
    />
  );
}
