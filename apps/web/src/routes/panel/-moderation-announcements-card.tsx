import { Button } from '@neighborhood-showcase/ui/components/button';
import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { AlertTriangle, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import type { ModerationAnnouncement } from './-moderation-announcements-types';

interface ModerationAnnouncementsCardProps {
  ad: ModerationAnnouncement;
  isSuspendingId: string | null;
  reinstatePending: boolean;
  suspensionReason: string;
  suspendPending: boolean;
  t: (key: string) => string;
  onCancelSuspend: () => void;
  onConfirmReinstate: (announcementId: string) => void;
  onConfirmSuspend: (announcementId: string) => void;
  onOpenSuspend: (announcementId: string) => void;
  onSuspensionReasonChange: (value: string) => void;
}

export function ModerationAnnouncementsCard({
  ad,
  isSuspendingId,
  reinstatePending,
  suspensionReason,
  suspendPending,
  t,
  onCancelSuspend,
  onConfirmReinstate,
  onConfirmSuspend,
  onOpenSuspend,
  onSuspensionReasonChange,
}: ModerationAnnouncementsCardProps) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-muted">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-full w-full object-cover opacity-85"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <span
            className={`rounded-full border px-2.5 py-1 font-semibold text-xs ${
              ad.status === 'ACTIVE'
                ? 'border-success/30 bg-success/20 text-success'
                : 'border-destructive/30 bg-destructive/20 text-destructive'
            }`}
          >
            {ad.status === 'ACTIVE'
              ? ad.flaggedForReview
                ? 'Ativo (Revisão Pendente)'
                : 'Ativo'
              : 'Suspenso'}
          </span>
          {ad.flaggedForReview && (
            <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning/20 px-2 py-0.5 font-semibold text-[9px] text-warning">
              <ShieldAlert className="h-3 w-3" />
              Alterado recentemente
            </span>
          )}
        </div>
        <div className="absolute right-0 bottom-0 left-0 p-4">
          <p className="font-medium text-primary text-xs uppercase tracking-wider">
            {ad.category}
          </p>
          <h4 className="line-clamp-1 font-bold text-foreground text-lg">
            {ad.title}
          </h4>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-5">
        <div>
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {ad.description}
          </p>
          <div className="mt-4 flex items-center justify-between border-border border-t pt-3 text-muted-foreground text-xs">
            <span>Provedor:</span>
            <span className="font-medium text-foreground">
              {ad.providerName}
            </span>
          </div>
        </div>

        {ad.status === 'SUSPENDED' && ad.suspensionReason && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs">
            <span className="mb-1 block font-bold text-destructive">
              Motivo da Suspensão:
            </span>
            <p className="text-destructive/80 italic">{ad.suspensionReason}</p>
          </div>
        )}

        {isSuspendingId === ad.id ? (
          <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div className="space-y-1">
              <Label
                htmlFor={`suspend-reason-${ad.id}`}
                className="text-destructive text-xs"
              >
                {t('moderation.select_reason')} *
              </Label>
              <select
                id={`suspend-reason-${ad.id}`}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground text-xs focus:border-ring focus:outline-none"
                value={suspensionReason}
                onChange={(e) => onSuspensionReasonChange(e.target.value)}
              >
                <option value="">-- {t('moderation.select_reason')} --</option>
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
                className="h-7 px-2 text-muted-foreground text-xs"
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
        ) : (
          <div className="flex pt-2">
            {ad.status === 'ACTIVE' ? (
              <Button
                variant="destructive"
                onClick={() => onOpenSuspend(ad.id)}
                className="w-full"
              >
                <AlertTriangle className="mr-1.5 h-4 w-4" />
                {t('moderation.suspend')}
              </Button>
            ) : (
              <Button
                disabled={reinstatePending}
                onClick={() => onConfirmReinstate(ad.id)}
                className="w-full bg-success text-success-foreground hover:bg-success/80"
              >
                {reinstatePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                    Reabilitar Anúncio
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
