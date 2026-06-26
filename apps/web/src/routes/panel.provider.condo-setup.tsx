import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Home, MapPin, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { ProviderDashboardCondoSetupExternalFlow } from './panel/-provider-dashboard-condo-setup-external-flow';
import { ProviderDashboardCondoSetupResidentFlow } from './panel/-provider-dashboard-condo-setup-resident-flow';
import { ProviderDashboardCondoSetupSindicoFlow } from './panel/-provider-dashboard-condo-setup-sindico-flow';
import { ProviderDashboardCondoSetupStatusPanels } from './panel/-provider-dashboard-condo-setup-status-panels';
import { PanelContentContainer } from '@/components/panel-content-container';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/provider/condo-setup')({
  component: CondoSetupComponent,
});

function CondoSetupComponent() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<
    'select' | 'sindico' | 'resident' | 'external'
  >('select');

  const myCondoQuery = useQuery(trpc.condominium.myCreated.queryOptions());
  const myAssignmentsQuery = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );
  const ownedProvidersQuery = useQuery(
    trpc.providerProfile.listMine.queryOptions(),
  );

  const myCondo = myCondoQuery.data;
  const myAssignments = myAssignmentsQuery.data;
  // Repeatable create flow (T-20-05/ST-04): a caller who already owns a provider
  // always gets the create selector. The legacy per-user status panels only
  // serve the genuine first-time, pre-provider state (e.g. a pending sindico
  // condo request, which does not mint a provider). Per-provider status now
  // lives on the My Providers page + each provider's `$providerId` dashboard.
  const ownsProviders = (ownedProvidersQuery.data?.length ?? 0) > 0;

  const goToProvider = (providerId: string) =>
    navigate({ to: '/panel/provider/$providerId', params: { providerId } });

  const statusPanels = ProviderDashboardCondoSetupStatusPanels({
    myCondo,
    myAssignments,
    onNavigateDashboard: () => navigate({ to: '/panel/provider' }),
    onRefetchAssignments: () => myAssignmentsQuery.refetch(),
    onRefetchCondo: () => myCondoQuery.refetch(),
  });

  let content: React.ReactNode = null;

  if (statusPanels && !ownsProviders) {
    content = statusPanels;
  } else if (flow === 'select') {
    content = (
      <Card className="w-full p-6">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
            <Home className="h-8 w-8" />
          </div>
          <CardTitle>Configuração do Provedor</CardTitle>
          <CardDescription className="mt-2">
            Você ainda não possui uma localização cadastrada. Escolha uma das
            opções abaixo para começar a anunciar seus serviços.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6 transition-all hover:border">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">
                Criar Novo Condomínio
              </h3>
              <p className="mt-2 text-muted-foreground text-sm">
                Cadastre um novo condomínio como{' '}
                <strong>Síndico/Administrador</strong> para gerenciar moradores
                e anúncios no local.
              </p>
            </div>
            <Button
              onClick={() => setFlow('sindico')}
              className="mt-6 w-full cursor-pointer"
            >
              Começar
            </Button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6 transition-all hover:border">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">
                Morador de Condomínio
              </h3>
              <p className="mt-2 text-muted-foreground text-sm">
                Solicite associação a um condomínio existente informando sua
                unidade e comprovante de residência.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setFlow('resident')}
              className="mt-6 w-full"
            >
              Solicitar Acesso
            </Button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6 transition-all hover:border">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">
                Prestador Autônomo
              </h3>
              <p className="mt-2 text-muted-foreground text-sm">
                Trabalha fora de condomínios? Registre o endereço de seu
                estabelecimento comercial ou residência para divulgar anúncios
                na região.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setFlow('external')}
              className="mt-6 w-full"
            >
              Cadastrar Endereço
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  } else if (flow === 'resident') {
    content = (
      <ProviderDashboardCondoSetupResidentFlow
        onBack={() => setFlow('select')}
        onProviderCreated={goToProvider}
      />
    );
  } else if (flow === 'external') {
    content = (
      <ProviderDashboardCondoSetupExternalFlow
        onBack={() => setFlow('select')}
        onProviderCreated={goToProvider}
      />
    );
  } else {
    content = (
      <ProviderDashboardCondoSetupSindicoFlow
        onBack={() => setFlow('select')}
        onSuccess={() => myCondoQuery.refetch()}
      />
    );
  }

  return (
    <PanelContentContainer variant="default">{content}</PanelContentContainer>
  );
}
