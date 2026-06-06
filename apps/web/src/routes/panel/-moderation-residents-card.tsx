import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { Check, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import type { ModerationPendingResident } from './-moderation-residents-types';

interface ModerationResidentsCardProps {
  isRejectingId: string | null;
  reason: string;
  resident: ModerationPendingResident;
  approvePending: boolean;
  rejectPending: boolean;
  t: (key: string) => string;
  onApprove: (residentId: string) => void;
  onCancelReject: () => void;
  onOpenProof: (proofUrl: string) => void;
  onReasonChange: (value: string) => void;
  onReject: (residentId: string) => void;
  onStartReject: (residentId: string) => void;
}

export function ModerationResidentsCard({
  approvePending,
  isRejectingId,
  reason,
  rejectPending,
  resident,
  t,
  onApprove,
  onCancelReject,
  onOpenProof,
  onReasonChange,
  onReject,
  onStartReject,
}: ModerationResidentsCardProps) {
  const proofUrl = resident.proofOfResidency;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{resident.provider?.name || 'Morador Sem Nome'}</CardTitle>
        <CardDescription>
          Unidade: {resident.unitInfo || 'Não informada'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {proofUrl && (
          <div className="rounded-lg border bg-muted/45 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center text-muted-foreground text-xs">
                <FileText className="mr-1.5 h-4 w-4 text-primary" />
                Comprovante
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onOpenProof(proofUrl)}
                  className="cursor-pointer text-primary text-xs hover:underline"
                >
                  Visualizar
                </button>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center text-primary text-xs hover:underline"
                >
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {isRejectingId === resident.id ? (
          <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div className="space-y-1">
              <Label
                htmlFor={`reason-${resident.id}`}
                className="text-destructive text-xs"
              >
                Motivo da Rejeição *
              </Label>
              <Input
                id={`reason-${resident.id}`}
                placeholder="Ex: Nome inválido ou comprovante ilegível"
                className="text-xs"
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={onCancelReject}
                className="h-7 px-2 text-muted-foreground text-xs"
              >
                {t('moderation.cancel')}
              </Button>
              <Button
                variant="destructive"
                disabled={rejectPending || !reason.trim()}
                onClick={() => onReject(resident.id)}
                className="h-7 px-2 text-xs"
              >
                {t('moderation.confirm')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2 pt-2">
            <Button
              disabled={approvePending}
              onClick={() => onApprove(resident.id)}
              className="flex-1"
            >
              {approvePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Aprovar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onStartReject(resident.id)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="mr-1.5 h-4 w-4" />
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
