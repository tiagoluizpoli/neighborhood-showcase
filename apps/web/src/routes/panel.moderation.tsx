import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Loader2, Megaphone, ShieldAlert, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ModerationAnnouncementsQueue } from './panel/-moderation-announcements-queue';
import { ModerationReportsQueue } from './panel/-moderation-reports-queue';
import { ModerationResidentsQueue } from './panel/-moderation-residents-queue';
import { authClient } from '@/lib/auth-client';
import { trpc, trpcClient } from '@/utils/trpc';

export const Route = createFileRoute('/panel/moderation')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/',
      });
    }

    // Call tRPC client directly to verify moderator role
    const assignments = await trpcClient.assignment.getMyAssignments.query();
    const moderatorAssignments = assignments.filter(
      (a): a is typeof a & { condominiumId: string } =>
        a.type === 'MODERATOR' &&
        a.status === 'APPROVED' &&
        a.condominiumId !== null,
    );

    // Bypass redirect for SYSTEM_MANAGER and ADMINISTRATOR
    if (
      session.data.user.role !== 'SYSTEM_MANAGER' &&
      session.data.user.role !== 'ADMINISTRATOR' &&
      moderatorAssignments.length === 0
    ) {
      throw redirect({
        to: '/panel/dashboard',
      });
    }

    return { session, moderatorAssignments };
  },
  component: ModerationDashboard,
});

function ModerationDashboard() {
  const { session, moderatorAssignments } = Route.useRouteContext();
  const { t } = useTranslation();

  const isSystemManager =
    session.data?.user?.role === 'SYSTEM_MANAGER' ||
    session.data?.user?.role === 'ADMINISTRATOR';

  // Selected condo context state
  const [selectedCondoId, setSelectedCondoId] = useState<string>(
    moderatorAssignments[0]?.condominiumId || '',
  );

  const [activeSubTab, setActiveSubTab] = useState<
    'residents' | 'announcements' | 'reports'
  >(moderatorAssignments.length === 0 ? 'reports' : 'residents');

  // Queries & Mutations (Residents)
  const pendingResidentsQuery = useQuery(
    trpc.assignment.listPending.queryOptions(
      { condominiumId: selectedCondoId },
      { enabled: !!selectedCondoId && activeSubTab === 'residents' },
    ),
  );

  const approveMutation = useMutation(
    trpc.assignment.approve.mutationOptions({
      onSuccess: () => {
        toast.success(
          t('moderation.approve_success', {
            defaultValue: 'Morador aprovado com sucesso!',
          }),
        );
        pendingResidentsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao aprovar morador.');
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.assignment.reject.mutationOptions({
      onSuccess: () => {
        toast.success(
          t('moderation.reject_success', {
            defaultValue: 'Morador rejeitado com sucesso!',
          }),
        );
        setIsRejectingId(null);
        setReason('');
        pendingResidentsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao rejeitar morador.');
      },
    }),
  );

  // Queries & Mutations (Announcements)
  const announcementsQuery = useQuery(
    trpc.announcement.listForModeration.queryOptions(
      { condominiumId: selectedCondoId },
      { enabled: !!selectedCondoId && activeSubTab === 'announcements' },
    ),
  );

  // Queries & Mutations (Reports)
  const reportedQuery = useQuery(
    trpc.announcement.listReported.queryOptions(
      {},
      { enabled: activeSubTab === 'reports' },
    ),
  );

  const dismissReportsMutation = useMutation(
    trpc.announcement.dismissReports.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.dismiss_success'));
        reportedQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao arquivar denúncias.');
      },
    }),
  );

  const suspendMutation = useMutation(
    trpc.announcement.suspend.mutationOptions({
      onSuccess: () => {
        toast.success(t('moderation.suspend_success'));
        setIsSuspendingId(null);
        setSuspensionReason('');
        announcementsQuery.refetch();
        reportedQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao suspender anúncio.');
      },
    }),
  );

  const reinstateMutation = useMutation(
    trpc.announcement.reinstate.mutationOptions({
      onSuccess: () => {
        toast.success('Anúncio reabilitado com sucesso!');
        announcementsQuery.refetch();
        reportedQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao reabilitar anúncio.');
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
        announcementsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao banir prestador.');
      },
    }),
  );

  // UI States
  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isSuspendingId, setIsSuspendingId] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  const [isBanningUserId, setIsBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  const [viewingReportsAdId, setViewingReportsAdId] = useState<string | null>(
    null,
  );

  const currentCondo = moderatorAssignments.find(
    (a) => a.condominiumId === selectedCondoId,
  )?.condominium;

  const pendingResidents = pendingResidentsQuery.data || [];
  const announcements = announcementsQuery.data || [];
  const reportedAnnouncements = reportedQuery.data || [];

  const selectedAdForReports = reportedAnnouncements.find(
    (a) => a.id === viewingReportsAdId,
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-bold text-3xl text-foreground tracking-tight">
              {t('moderation.title')}
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {currentCondo?.name || t('moderation.subtitle')}
            </p>
          </div>
          {moderatorAssignments.length > 1 && activeSubTab !== 'reports' && (
            <select
              value={selectedCondoId}
              onChange={(e) => {
                setSelectedCondoId(e.target.value);
                setIsRejectingId(null);
                setReason('');
                setIsSuspendingId(null);
                setSuspensionReason('');
              }}
              className="rounded-lg border border-input bg-background px-3 py-1.5 font-medium text-foreground text-sm focus:border-ring focus:outline-none"
            >
              {moderatorAssignments.map((a) => (
                <option key={a.condominiumId} value={a.condominiumId}>
                  {a.condominium?.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Toggle Sub-Tabs */}
        <div className="mb-8 flex space-x-8 border-border border-b">
          {moderatorAssignments.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setActiveSubTab('residents')}
                className={`relative pb-4 font-semibold text-sm transition-all ${
                  activeSubTab === 'residents'
                    ? 'border-primary border-b-2 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('moderation.tab_residents')} ({pendingResidents.length})
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('announcements')}
                className={`relative pb-4 font-semibold text-sm transition-all ${
                  activeSubTab === 'announcements'
                    ? 'border-primary border-b-2 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  {t('moderation.tab_announcements')} ({announcements.length})
                </div>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setActiveSubTab('reports')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeSubTab === 'reports'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              {t('moderation.tab_reports')} ({reportedAnnouncements.length})
            </div>
          </button>
        </div>

        {/* Residents View */}
        {activeSubTab === 'residents' &&
          (pendingResidentsQuery.isPending ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ModerationResidentsQueue
              approvePending={approveMutation.isPending}
              isRejectingId={isRejectingId}
              pendingResidents={pendingResidents}
              reason={reason}
              rejectPending={rejectMutation.isPending}
              t={t}
              onApprove={(residentId) =>
                approveMutation.mutate({ id: residentId })
              }
              onCancelReject={() => setIsRejectingId(null)}
              onOpenProof={(proofUrl) => setPreviewUrl(proofUrl)}
              onReasonChange={setReason}
              onReject={(residentId) =>
                rejectMutation.mutate({
                  id: residentId,
                  reason: reason.trim(),
                })
              }
              onStartReject={(residentId) => {
                setIsRejectingId(residentId);
                setReason('');
              }}
            />
          ))}

        {/* Announcements View */}
        {activeSubTab === 'announcements' &&
          (announcementsQuery.isPending ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
                suspendMutation.mutate({
                  id: announcementId,
                  reason: suspensionReason,
                })
              }
              onOpenSuspend={(announcementId) => {
                setIsSuspendingId(announcementId);
                setSuspensionReason('');
              }}
              onSuspensionReasonChange={setSuspensionReason}
            />
          ))}

        {/* Reports Queue View */}
        {activeSubTab === 'reports' &&
          (reportedQuery.isPending ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
                banProviderMutation.mutate({
                  id: providerId,
                  reason: banReason,
                })
              }
              onConfirmDismiss={(announcementId) =>
                dismissReportsMutation.mutate({ announcementId })
              }
              onConfirmSuspend={(announcementId) =>
                suspendMutation.mutate({
                  id: announcementId,
                  reason: suspensionReason,
                })
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
          ))}
      </main>

      {/* Document Preview Modal */}
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
    </div>
  );
}
