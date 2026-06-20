import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ModerationResidentsQueue } from '../-moderation-residents-queue';
import { useModerationCondo } from '@/lib/moderation-condo-context';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/moderation/residents')({
  component: ModerationResidentsPage,
});

function ModerationResidentsPage() {
  const { t } = useTranslation();
  const { selectedId } = useModerationCondo();

  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pendingResidentsQuery = useQuery(
    trpc.assignment.listPending.queryOptions(
      { condominiumId: selectedId ?? '' },
      { enabled: !!selectedId },
    ),
  );

  const approveMutation = useMutation(
    trpc.assignment.approve.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.approve_success'));
        pendingResidentsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || t('moderation.approve_error'));
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.assignment.reject.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.reject_success'));
        setIsRejectingId(null);
        setReason('');
        pendingResidentsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || t('moderation.reject_error'));
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

  if (pendingResidentsQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingResidents = pendingResidentsQuery.data || [];

  return (
    <>
      <ModerationResidentsQueue
        approvePending={approveMutation.isPending}
        isRejectingId={isRejectingId}
        pendingResidents={pendingResidents}
        reason={reason}
        rejectPending={rejectMutation.isPending}
        t={t}
        onApprove={(residentId) => approveMutation.mutate({ id: residentId })}
        onCancelReject={() => setIsRejectingId(null)}
        onOpenProof={(proofUrl) => setPreviewUrl(proofUrl)}
        onReasonChange={setReason}
        onReject={(residentId) =>
          rejectMutation.mutate({ id: residentId, reason: reason.trim() })
        }
        onStartReject={(residentId) => {
          setIsRejectingId(residentId);
          setReason('');
        }}
      />

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border bg-card">
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex-1 overflow-hidden p-6 pt-12">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  title="Document Preview"
                  src={previewUrl}
                  className="h-full w-full rounded-lg bg-background"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center overflow-auto">
                  <img
                    src={previewUrl}
                    alt="Document Proof"
                    className="max-h-full max-w-full rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
