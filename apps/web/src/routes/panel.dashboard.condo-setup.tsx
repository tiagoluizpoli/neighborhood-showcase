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
import { useTranslation } from 'react-i18next';
import { ProviderDashboardCondoSetupResidentFlow } from './panel/-provider-dashboard-condo-setup-resident-flow';
import { ProviderDashboardCondoSetupSindicoFlow } from './panel/-provider-dashboard-condo-setup-sindico-flow';
import { ProviderDashboardCondoSetupStatusPanels } from './panel/-provider-dashboard-condo-setup-status-panels';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard/condo-setup')({
  component: CondoSetupComponent,
});

function CondoSetupComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [flow, setFlow] = useState<'select' | 'sindico' | 'resident'>('select');

  // Query my created condo status
  const myCondoQuery = useQuery(trpc.condominium.myCreated.queryOptions());

  // Query assignments status
  const myAssignmentsQuery = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );

  const myCondo = myCondoQuery.data;
  const myAssignments = myAssignmentsQuery.data;

  const statusPanels = ProviderDashboardCondoSetupStatusPanels({
    myCondo,
    myAssignments,
    onNavigateDashboard: () => navigate({ to: '/panel/dashboard' }),
    onRefetchAssignments: () => myAssignmentsQuery.refetch(),
    onRefetchCondo: () => myCondoQuery.refetch(),
  });

  if (statusPanels) {
    return statusPanels;
  }

  // Selection Screen
  if (flow === 'select') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-5xl p-6">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
              <Home className="h-8 w-8" />
            </div>
            <CardTitle>
              <h1 className="font-semibold text-foreground text-xl">
                {t('provider_activation.page_title')}
              </h1>
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl self-center text-sm">
              {t('provider_activation.page_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border bg-muted/50 p-4 text-left">
              <h2 className="font-semibold text-base text-foreground">
                {t('provider_activation.guidance_title')}
              </h2>
              <p className="mt-2 text-muted-foreground text-sm">
                {t('provider_activation.guidance_description')}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6 transition-all hover:border">
                <div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {t('provider_activation.create_condo_title')}
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {t('provider_activation.create_condo_description')}
                  </p>
                </div>
                <Button
                  onClick={() => setFlow('sindico')}
                  className="mt-6 w-full cursor-pointer"
                >
                  {t('provider_activation.create_condo_cta')}
                </Button>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6 transition-all hover:border">
                <div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {t('provider_activation.join_condo_title')}
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {t('provider_activation.join_condo_description')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setFlow('resident')}
                  className="mt-6 w-full"
                >
                  {t('provider_activation.join_condo_cta')}
                </Button>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6">
                <div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-foreground text-lg">
                      {t('provider_activation.external_title')}
                    </h3>
                    <span className="rounded-full border border-border px-2.5 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
                      {t('provider_activation.external_badge')}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {t('provider_activation.external_description')}
                  </p>
                </div>
                <Button variant="outline" disabled className="mt-6 w-full">
                  {t('provider_activation.external_cta')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Resident sub-flow (Issue 03)
  if (flow === 'resident') {
    return (
      <ProviderDashboardCondoSetupResidentFlow
        onBack={() => setFlow('select')}
        onRequestSuccess={() => myAssignmentsQuery.refetch()}
      />
    );
  }

  // Síndico Path Form
  return (
    <ProviderDashboardCondoSetupSindicoFlow
      onBack={() => setFlow('select')}
      onSuccess={() => myCondoQuery.refetch()}
    />
  );
}
