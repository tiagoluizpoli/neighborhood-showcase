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

export interface AdminPendingCondominium {
  cep: string;
  city: string;
  id: string;
  name: string;
  proofUrl?: string | null;
  state: string;
}

interface AdminPendingCondosCardProps {
  approvePending: boolean;
  condo: AdminPendingCondominium;
  isRejecting: boolean;
  reason: string;
  rejectPending: boolean;
  onApprove: (condominiumId: string) => void;
  onOpenPreview: (url: string) => void;
  onOpenReject: (condominiumId: string) => void;
  onReasonChange: (value: string) => void;
  onReject: (condominiumId: string, reason: string) => void;
  onRejectCancel: () => void;
}

export function AdminPendingCondosCard({
  approvePending,
  condo,
  isRejecting,
  reason,
  rejectPending,
  onApprove,
  onOpenPreview,
  onOpenReject,
  onReasonChange,
  onReject,
  onRejectCancel,
}: AdminPendingCondosCardProps) {
  const proofUrl = condo.proofUrl ?? null;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{condo.name}</CardTitle>
        <CardDescription>
          {condo.city} - {condo.state} | CEP: {condo.cep}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {proofUrl ? (
          <div className="rounded-lg border bg-muted/45 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center text-muted-foreground text-xs">
                <FileText className="mr-1.5 h-4 w-4 text-primary" />
                Convenção / Ata
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onOpenPreview(proofUrl)}
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
        ) : null}

        {isRejecting ? (
          <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div className="space-y-1">
              <Label
                htmlFor={`reason-${condo.id}`}
                className="text-destructive text-xs"
              >
                Motivo da Rejeição *
              </Label>
              <Input
                id={`reason-${condo.id}`}
                placeholder="Ex: Documento inválido ou ilegível"
                className="text-xs"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={onRejectCancel}
                className="h-7 px-2 text-muted-foreground text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={rejectPending || !reason.trim()}
                onClick={() => onReject(condo.id, reason)}
                className="h-7 px-2 text-xs"
              >
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2 pt-2">
            <Button
              disabled={approvePending}
              onClick={() => onApprove(condo.id)}
              className="flex-1"
            >
              {approvePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Aprovar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenReject(condo.id)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="mr-1.5 h-4 w-4" /> Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
