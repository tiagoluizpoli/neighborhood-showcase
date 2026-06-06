import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { ShieldAlert } from 'lucide-react';
import { ModerationReportsCard } from './-moderation-reports-card';
import { ModerationReportsDialog } from './-moderation-reports-dialog';
import type { ModerationReportedAnnouncement } from './-moderation-reports-types';

interface ModerationReportsQueueProps {
  banReason: string;
  dismissReportsPending: boolean;
  getReasonLabel: (reasonKey: string) => string;
  isBanningUserId: string | null;
  isSuspendingId: string | null;
  isSystemManager: boolean;
  reportedAnnouncements: ModerationReportedAnnouncement[];
  selectedAdForReports: ModerationReportedAnnouncement | undefined;
  suspensionReason: string;
  t: (key: string) => string;
  viewingReportsAdId: string | null;
  onBanReasonChange: (value: string) => void;
  onCancelBan: () => void;
  onCancelSuspend: () => void;
  onCloseDetails: () => void;
  onConfirmBan: (providerId: string) => void;
  onConfirmDismiss: (announcementId: string) => void;
  onConfirmSuspend: (announcementId: string) => void;
  onOpenDetails: (announcementId: string) => void;
  onOpenBan: (announcementId: string) => void;
  onOpenSuspend: (announcementId: string) => void;
  onSuspensionReasonChange: (value: string) => void;
  suspendPending: boolean;
  banPending: boolean;
}

export function ModerationReportsQueue({
  banPending,
  banReason,
  dismissReportsPending,
  getReasonLabel,
  isBanningUserId,
  isSuspendingId,
  isSystemManager,
  reportedAnnouncements,
  selectedAdForReports,
  suspensionReason,
  t,
  viewingReportsAdId,
  onBanReasonChange,
  onCancelBan,
  onCancelSuspend,
  onCloseDetails,
  onConfirmBan,
  onConfirmDismiss,
  onConfirmSuspend,
  onOpenBan,
  onOpenDetails,
  onOpenSuspend,
  onSuspensionReasonChange,
  suspendPending,
}: ModerationReportsQueueProps) {
  return (
    <>
      <div className="mb-6">
        <h2 className="font-bold text-2xl text-foreground">
          {t('moderation.reports_title')}
        </h2>
        <p className="mt-1 text-muted-foreground text-xs">
          {t('moderation.reports_subtitle')}
        </p>
      </div>

      {reportedAnnouncements.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">
              {t('moderation.reports_empty_title')}
            </h3>
            <p className="mt-1 text-muted-foreground text-sm">
              {t('moderation.reports_empty_desc')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportedAnnouncements.map((ad) => (
            <ModerationReportsCard
              key={ad.id}
              ad={ad}
              banPending={banPending}
              banReason={banReason}
              dismissReportsPending={dismissReportsPending}
              getReasonLabel={getReasonLabel}
              isBanningUserId={isBanningUserId}
              isSuspendingId={isSuspendingId}
              isSystemManager={isSystemManager}
              suspensionReason={suspensionReason}
              suspendPending={suspendPending}
              t={t}
              onBanReasonChange={onBanReasonChange}
              onCancelBan={onCancelBan}
              onCancelSuspend={onCancelSuspend}
              onConfirmBan={onConfirmBan}
              onConfirmDismiss={onConfirmDismiss}
              onConfirmSuspend={onConfirmSuspend}
              onOpenBan={onOpenBan}
              onOpenDetails={onOpenDetails}
              onOpenSuspend={onOpenSuspend}
              onSuspensionReasonChange={onSuspensionReasonChange}
            />
          ))}
        </div>
      )}

      {viewingReportsAdId && selectedAdForReports && (
        <ModerationReportsDialog
          getReasonLabel={getReasonLabel}
          selectedAdForReports={selectedAdForReports}
          t={t}
          onClose={onCloseDetails}
        />
      )}
    </>
  );
}
