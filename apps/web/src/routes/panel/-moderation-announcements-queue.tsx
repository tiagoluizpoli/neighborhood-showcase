import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { Megaphone } from 'lucide-react';
import { ModerationAnnouncementsCard } from './-moderation-announcements-card';
import type { ModerationAnnouncement } from './-moderation-announcements-types';

interface ModerationAnnouncementsQueueProps {
  announcements: ModerationAnnouncement[];
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

export function ModerationAnnouncementsQueue({
  announcements,
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
}: ModerationAnnouncementsQueueProps) {
  return (
    <>
      <div className="mb-6">
        <h2 className="font-bold text-2xl text-foreground">
          Anúncios da Comunidade
        </h2>
        <p className="mt-1 text-muted-foreground text-xs">
          Gerencie e suspenda anúncios que violam as regras do condomínio.
        </p>
      </div>

      {announcements.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Megaphone className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">
              Nenhum anúncio
            </h3>
            <p className="mt-1 text-muted-foreground text-sm">
              Não há anúncios ativos ou suspensos neste condomínio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((ad) => (
            <ModerationAnnouncementsCard
              key={ad.id}
              ad={ad}
              isSuspendingId={isSuspendingId}
              reinstatePending={reinstatePending}
              suspensionReason={suspensionReason}
              suspendPending={suspendPending}
              t={t}
              onCancelSuspend={onCancelSuspend}
              onConfirmReinstate={onConfirmReinstate}
              onConfirmSuspend={onConfirmSuspend}
              onOpenSuspend={onOpenSuspend}
              onSuspensionReasonChange={onSuspensionReasonChange}
            />
          ))}
        </div>
      )}
    </>
  );
}
