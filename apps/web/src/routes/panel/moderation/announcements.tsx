import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ModerationAnnouncementsQueue } from '../-moderation-announcements-queue';
import { useModerationCondo } from '@/lib/moderation-condo-context';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/moderation/announcements')({
  component: ModerationAnnouncementsPage,
});

function ModerationAnnouncementsPage() {
  const { t } = useTranslation();
  const { selectedId } = useModerationCondo();

  const [isSuspendingId, setIsSuspendingId] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  const announcementsQuery = useQuery(
    trpc.announcement.listForModeration.queryOptions(
      { condominiumId: selectedId ?? '' },
      { enabled: !!selectedId },
    ),
  );

  const suspendMutation = useMutation(
    trpc.announcement.suspend.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.suspend_success'));
        setIsSuspendingId(null);
        setSuspensionReason('');
        announcementsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || t('moderation.suspend_error'));
      },
    }),
  );

  const reinstateMutation = useMutation(
    trpc.announcement.reinstate.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.reinstate_success'));
        announcementsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || t('moderation.reinstate_error'));
      },
    }),
  );

  if (!selectedId) {
    return (
      <div className="text-muted-foreground text-sm">
        {t('moderation.no_condo_selected')}
      </div>
    );
  }

  if (announcementsQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const announcements = announcementsQuery.data || [];

  return (
    <ModerationAnnouncementsQueue
      announcements={announcements}
      isSuspendingId={isSuspendingId}
      reinstatePending={reinstateMutation.isPending}
      suspensionReason={suspensionReason}
      suspendPending={suspendMutation.isPending}
      t={t}
      onCancelSuspend={() => setIsSuspendingId(null)}
      onConfirmReinstate={(announcementId) =>
        reinstateMutation.mutate({ id: announcementId })
      }
      onConfirmSuspend={(announcementId) =>
        suspendMutation.mutate({ id: announcementId, reason: suspensionReason })
      }
      onOpenSuspend={(announcementId) => {
        setIsSuspendingId(announcementId);
        setSuspensionReason('');
      }}
      onSuspensionReasonChange={setSuspensionReason}
    />
  );
}
