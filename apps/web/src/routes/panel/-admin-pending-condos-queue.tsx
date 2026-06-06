import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { Check, Loader2 } from 'lucide-react';
import {
  type AdminPendingCondominium,
  AdminPendingCondosCard,
} from './-admin-pending-condos-card';

interface AdminPendingCondosQueueProps {
  approvePending: boolean;
  isPending: boolean;
  isRejectingId: string | null;
  pendingCondos: AdminPendingCondominium[];
  reason: string;
  rejectPending: boolean;
  onApprove: (condominiumId: string) => void;
  onOpenPreview: (url: string) => void;
  onOpenReject: (condominiumId: string) => void;
  onReasonChange: (value: string) => void;
  onReject: (condominiumId: string, reason: string) => void;
  onRejectCancel: () => void;
}

export function AdminPendingCondosQueue({
  approvePending,
  isPending,
  isRejectingId,
  pendingCondos,
  reason,
  rejectPending,
  onApprove,
  onOpenPreview,
  onOpenReject,
  onReasonChange,
  onReject,
  onRejectCancel,
}: AdminPendingCondosQueueProps) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-bold text-2xl text-foreground">
          Aprovações Pendentes
        </h2>
      </div>

      {isPending ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pendingCondos.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">
              Tudo limpo!
            </h3>
            <p className="mt-1 text-muted-foreground text-sm">
              Não há nenhuma solicitação de condomínio pendente de aprovação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingCondos.map((condo) => (
            <AdminPendingCondosCard
              key={condo.id}
              approvePending={approvePending}
              condo={condo}
              isRejecting={isRejectingId === condo.id}
              reason={reason}
              rejectPending={rejectPending}
              onApprove={onApprove}
              onOpenPreview={onOpenPreview}
              onOpenReject={onOpenReject}
              onReasonChange={onReasonChange}
              onReject={onReject}
              onRejectCancel={onRejectCancel}
            />
          ))}
        </div>
      )}
    </>
  );
}
