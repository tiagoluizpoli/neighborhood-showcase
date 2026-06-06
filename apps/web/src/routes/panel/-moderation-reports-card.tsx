import { Badge } from '@neighborhood-showcase/ui/components/badge';
import { Button } from '@neighborhood-showcase/ui/components/button';
import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { Label } from '@neighborhood-showcase/ui/components/label';
import {
  AlertTriangle,
  Check,
  History,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type { ModerationReportedAnnouncement } from './-moderation-reports-types';

interface ModerationReportsCardProps {
  ad: ModerationReportedAnnouncement;
  banPending: boolean;
  banReason: string;
  dismissReportsPending: boolean;
  getReasonLabel: (reasonKey: string) => string;
  isBanningUserId: string | null;
  isSuspendingId: string | null;
  isSystemManager: boolean;
  suspensionReason: string;
  t: (key: string) => string;
  onBanReasonChange: (value: string) => void;
  onCancelBan: () => void;
  onCancelSuspend: () => void;
  onConfirmBan: (providerId: string) => void;
  onConfirmDismiss: (announcementId: string) => void;
  onConfirmSuspend: (announcementId: string) => void;
  onOpenBan: (announcementId: string) => void;
  onOpenDetails: (announcementId: string) => void;
  onOpenSuspend: (announcementId: string) => void;
  onSuspensionReasonChange: (value: string) => void;
  suspendPending: boolean;
}

export function ModerationReportsCard({
  ad,
  banPending,
  banReason,
  dismissReportsPending,
  getReasonLabel,
  isBanningUserId,
  isSuspendingId,
  isSystemManager,
  suspensionReason,
  t,
  onBanReasonChange,
  onCancelBan,
  onCancelSuspend,
  onConfirmBan,
  onConfirmDismiss,
  onConfirmSuspend,
  onOpenBan,
  onOpenDetails,
  onOpenSuspend,
  onSuspensionReasonChange,
  suspendPending,
}: ModerationReportsCardProps) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
      <div className="relative aspect-[4/3] w-full bg-muted">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <span className="rounded-full border border-destructive/30 bg-destructive px-2.5 py-1 font-bold text-destructive-foreground text-xs">
            {ad.totalReports} {ad.totalReports === 1 ? 'Denúncia' : 'Denúncias'}
          </span>
        </div>
        <div className="absolute right-0 bottom-0 left-0 p-4">
          <p className="font-medium text-destructive text-xs uppercase tracking-wider">
            {ad.status === 'SUSPENDED'
              ? t('common.suspended')
              : t('common.active')}
          </p>
          <h4 className="line-clamp-1 font-bold text-foreground text-lg">
            {ad.title}
          </h4>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-5">
        <div className="space-y-3">
          <div className="border-border border-b pb-2">
            <span className="text-muted-foreground text-xs">Prestador:</span>
            <p className="font-semibold text-foreground text-sm">
              {ad.providerName}
            </p>
            <p className="text-muted-foreground text-xs">{ad.providerEmail}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(ad.reasonBreakdown).map(([reasonKey, count]) =>
              count === 0 ? null : (
                <Badge
                  key={reasonKey}
                  variant="outline"
                  className="border-destructive/30 bg-background text-[10px] text-destructive"
                >
                  {getReasonLabel(reasonKey)}: {count}
                </Badge>
              ),
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenDetails(ad.id)}
            className="h-8 w-full border border-border bg-background text-foreground text-xs hover:bg-muted"
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            {t('moderation.details_title')}
          </Button>
        </div>

        <div className="space-y-2 pt-4">
          {isSuspendingId === ad.id ? (
            <div className="space-y-3 rounded-lg border border-destructive/20 bg-card p-3">
              <div className="space-y-1">
                <Label
                  htmlFor={`report-suspend-${ad.id}`}
                  className="font-semibold text-foreground text-xs"
                >
                  {t('moderation.select_reason')} *
                </Label>
                <select
                  id={`report-suspend-${ad.id}`}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground text-xs focus:border-ring focus:outline-none"
                  value={suspensionReason}
                  onChange={(e) => onSuspensionReasonChange(e.target.value)}
                >
                  <option value="">
                    -- {t('moderation.select_reason')} --
                  </option>
                  <option value={t('moderation.suspend_reason_inadequado')}>
                    {t('moderation.suspend_reason_inadequado')}
                  </option>
                  <option value={t('moderation.suspend_reason_fraude')}>
                    {t('moderation.suspend_reason_fraude')}
                  </option>
                  <option value={t('moderation.suspend_reason_contato')}>
                    {t('moderation.suspend_reason_contato')}
                  </option>
                  <option value={t('moderation.suspend_reason_spam')}>
                    {t('moderation.suspend_reason_spam')}
                  </option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={onCancelSuspend}
                  className="h-7 px-2 text-xs"
                >
                  {t('moderation.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  disabled={suspendPending || !suspensionReason}
                  onClick={() => onConfirmSuspend(ad.id)}
                  className="h-7 px-2 text-xs"
                >
                  {t('moderation.confirm')}
                </Button>
              </div>
            </div>
          ) : isBanningUserId === ad.id ? (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-card p-3">
              <div className="space-y-1">
                <p className="font-bold text-destructive text-xs">
                  {t('moderation.ban_desc')}
                </p>
                <Label
                  htmlFor={`report-ban-${ad.id}`}
                  className="font-semibold text-foreground text-xs"
                >
                  {t('moderation.select_reason')} *
                </Label>
                <select
                  id={`report-ban-${ad.id}`}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground text-xs focus:border-ring focus:outline-none"
                  value={banReason}
                  onChange={(e) => onBanReasonChange(e.target.value)}
                >
                  <option value="">
                    -- {t('moderation.select_reason')} --
                  </option>
                  <option value={t('moderation.ban_reason_repetidas')}>
                    {t('moderation.ban_reason_repetidas')}
                  </option>
                  <option value={t('moderation.ban_reason_fraude')}>
                    {t('moderation.ban_reason_fraude')}
                  </option>
                  <option value={t('moderation.ban_reason_termos')}>
                    {t('moderation.ban_reason_termos')}
                  </option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={onCancelBan}
                  className="h-7 px-2 text-xs"
                >
                  {t('moderation.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  disabled={banPending || !banReason}
                  onClick={() => onConfirmBan(ad.providerId)}
                  className="h-7 px-2 text-xs"
                >
                  {t('moderation.confirm')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onConfirmDismiss(ad.id)}
                  disabled={dismissReportsPending}
                  className="flex-1 border-border bg-background text-foreground text-xs"
                >
                  {dismissReportsPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      {t('moderation.dismiss')}
                    </>
                  )}
                </Button>

                {ad.status !== 'SUSPENDED' && (
                  <Button
                    variant="destructive"
                    onClick={() => onOpenSuspend(ad.id)}
                    className="flex-1 text-xs"
                  >
                    <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                    {t('moderation.suspend')}
                  </Button>
                )}
              </div>

              {isSystemManager && (
                <Button
                  variant="destructive"
                  onClick={() => onOpenBan(ad.id)}
                  className="w-full font-semibold text-xs"
                >
                  <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                  {t('moderation.ban')}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
