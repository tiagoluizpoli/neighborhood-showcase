import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { Check } from 'lucide-react';
import { ModerationResidentsCard } from './-moderation-residents-card';
import type { ModerationPendingResident } from './-moderation-residents-types';

interface ModerationResidentsQueueProps {
  approvePending: boolean;
  isRejectingId: string | null;
  pendingResidents: ModerationPendingResident[];
  reason: string;
  rejectPending: boolean;
  t: (key: string) => string;
  onApprove: (residentId: string) => void;
  onCancelReject: () => void;
  onOpenProof: (proofUrl: string) => void;
  onReasonChange: (value: string) => void;
  onReject: (residentId: string) => void;
  onStartReject: (residentId: string) => void;
}

export function ModerationResidentsQueue({
  approvePending,
  isRejectingId,
  pendingResidents,
  reason,
  rejectPending,
  t,
  onApprove,
  onCancelReject,
  onOpenProof,
  onReasonChange,
  onReject,
  onStartReject,
}: ModerationResidentsQueueProps) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-foreground">
            Solicitações de Moradores
          </h2>
          <p className="mt-1 text-muted-foreground text-xs">
            Aprove ou rejeite novas solicitações de moradores para a sua
            comunidade
          </p>
        </div>
      </div>

      {pendingResidents.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">
              Tudo sob controle!
            </h3>
            <p className="mt-1 text-muted-foreground text-sm">
              Nenhuma solicitação de morador pendente para este condomínio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingResidents.map((resident) => (
            <ModerationResidentsCard
              key={resident.id}
              approvePending={approvePending}
              isRejectingId={isRejectingId}
              reason={reason}
              rejectPending={rejectPending}
              resident={resident}
              t={t}
              onApprove={onApprove}
              onCancelReject={onCancelReject}
              onOpenProof={onOpenProof}
              onReasonChange={onReasonChange}
              onReject={onReject}
              onStartReject={onStartReject}
            />
          ))}
        </div>
      )}
    </>
  );
}
