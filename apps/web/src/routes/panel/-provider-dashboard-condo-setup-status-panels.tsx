import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Check, Clock, FileText } from 'lucide-react';

type CondoSetupAssignment = {
  status: string;
  condominium?: {
    name?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
  unitInfo?: string | null;
  proofOfResidency?: string | null;
};

type CondoSetupCondo = {
  status?: string;
  name: string;
  city: string;
  state: string;
  cep: string;
  proofUrl?: string | null;
};

type ProviderDashboardCondoSetupStatusPanelsProps = {
  myCondo: CondoSetupCondo | null | undefined;
  myAssignments: readonly CondoSetupAssignment[] | null | undefined;
  onNavigateDashboard: () => void;
  onRefetchAssignments: () => void;
  onRefetchCondo: () => void;
};

export function ProviderDashboardCondoSetupStatusPanels({
  myCondo,
  myAssignments,
  onNavigateDashboard,
  onRefetchAssignments,
  onRefetchCondo,
}: ProviderDashboardCondoSetupStatusPanelsProps) {
  const approvedAssignment = myAssignments?.find(
    (assignment) => assignment.status === 'APPROVED',
  );
  if (approvedAssignment) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-6 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
              <Check className="h-8 w-8" />
            </div>
            <CardTitle>Associação Aprovada!</CardTitle>
            <CardDescription className="mt-2">
              Sua associação ao condomínio{' '}
              <strong>{approvedAssignment.condominium?.name}</strong> foi
              aprovada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onNavigateDashboard} className="w-full">
              Ir para o Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingAssignment = myAssignments?.find(
    (assignment) => assignment.status === 'PENDING',
  );
  if (pendingAssignment) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg p-6 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
              <Clock className="h-8 w-8" />
            </div>
            <CardTitle>Solicitação Pendente</CardTitle>
            <CardDescription className="mt-2">
              Sua solicitação de acesso para o condomínio{' '}
              <strong>{pendingAssignment.condominium?.name}</strong> está em
              análise.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground text-sm">
              O moderador do condomínio está verificando as suas informações.
              Você terá acesso assim que a solicitação for aprovada.
            </p>
            <div className="space-y-2 rounded-lg border border bg-muted/50 p-4 text-left text-muted-foreground text-xs">
              <div>
                <strong>Condomínio:</strong>{' '}
                {pendingAssignment.condominium?.name} (
                {pendingAssignment.condominium?.city} -{' '}
                {pendingAssignment.condominium?.state})
              </div>
              <div>
                <strong>Unidade:</strong> {pendingAssignment.unitInfo}
              </div>
              {pendingAssignment.proofOfResidency && (
                <div className="flex items-center space-x-1">
                  <strong>Comprovante:</strong>
                  <a
                    href={pendingAssignment.proofOfResidency}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    Ver arquivo <FileText className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={onRefetchAssignments}
              className="mt-4"
            >
              Atualizar Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myCondo && myCondo.status === 'PENDING_APPROVAL') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg p-6 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
              <Clock className="h-8 w-8" />
            </div>
            <CardTitle>Cadastro em Análise</CardTitle>
            <CardDescription className="mt-2">
              O condomínio <strong>{myCondo.name}</strong> foi enviado para
              aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground text-sm">
              Nossos administradores estão verificando os documentos anexados.
              Você receberá acesso como <strong>Síndico/Moderador</strong> assim
              que for aprovado.
            </p>
            <div className="space-y-2 rounded-lg border border bg-muted/50 p-4 text-left text-muted-foreground text-xs">
              <div>
                <strong>Cidade/UF:</strong> {myCondo.city} - {myCondo.state}
              </div>
              <div>
                <strong>CEP:</strong> {myCondo.cep}
              </div>
              {myCondo.proofUrl && (
                <div className="flex items-center space-x-1">
                  <strong>Comprovante:</strong>
                  <a
                    href={myCondo.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    Ver arquivo <FileText className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={onRefetchCondo} className="mt-4">
              Atualizar Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myCondo && myCondo.status === 'APPROVED') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-6 text-center">
          <CardHeader>
            <CardTitle>Condomínio Aprovado!</CardTitle>
            <CardDescription className="mt-2">
              Seu acesso como moderador foi ativado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onNavigateDashboard} className="w-full">
              Ir para o Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
