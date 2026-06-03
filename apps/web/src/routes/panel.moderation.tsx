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
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { trpc, trpcClient } from '@/utils/trpc';

export const Route = createFileRoute('/panel/moderation')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/',
      });
    }

    // Call tRPC client directly to verify moderator role
    const assignments = await trpcClient.assignment.getMyAssignments.query();
    const moderatorAssignments = assignments.filter(
      (a): a is typeof a & { condominiumId: string } =>
        a.type === 'MODERATOR' &&
        a.status === 'APPROVED' &&
        a.condominiumId !== null,
    );

    if (moderatorAssignments.length === 0) {
      throw redirect({
        to: '/panel/dashboard',
        search: {
          message: 'Página não encontrada',
        },
      });
    }

    return { session, moderatorAssignments };
  },
  component: ModerationDashboard,
});

function ModerationDashboard() {
  const { moderatorAssignments } = Route.useRouteContext();

  // Selected condo context state
  const [selectedCondoId, setSelectedCondoId] = useState<string>(
    moderatorAssignments[0]?.condominiumId || '',
  );

  const [activeSubTab, setActiveSubTab] = useState<
    'residents' | 'announcements'
  >('residents');

  // Queries & Mutations (Residents)
  const pendingResidentsQuery = useQuery(
    trpc.assignment.listPending.queryOptions(
      { condominiumId: selectedCondoId },
      { enabled: !!selectedCondoId && activeSubTab === 'residents' },
    ),
  );

  const approveMutation = useMutation(
    trpc.assignment.approve.mutationOptions({
      onSuccess: () => {
        toast.success('Morador aprovado com sucesso!');
        pendingResidentsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao aprovar morador.');
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.assignment.reject.mutationOptions({
      onSuccess: () => {
        toast.success('Morador rejeitado com sucesso!');
        setIsRejectingId(null);
        setReason('');
        pendingResidentsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao rejeitar morador.');
      },
    }),
  );

  // Queries & Mutations (Announcements)
  const announcementsQuery = useQuery(
    trpc.announcement.listForModeration.queryOptions(
      { condominiumId: selectedCondoId },
      { enabled: !!selectedCondoId && activeSubTab === 'announcements' },
    ),
  );

  const suspendMutation = useMutation(
    trpc.announcement.suspend.mutationOptions({
      onSuccess: () => {
        toast.success('Anúncio suspenso com sucesso!');
        setIsSuspendingId(null);
        setSuspensionReason('');
        announcementsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao suspender anúncio.');
      },
    }),
  );

  const reinstateMutation = useMutation(
    trpc.announcement.reinstate.mutationOptions({
      onSuccess: () => {
        toast.success('Anúncio reabilitado com sucesso!');
        announcementsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao reabilitar anúncio.');
      },
    }),
  );

  // UI States
  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isSuspendingId, setIsSuspendingId] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  const currentCondo = moderatorAssignments.find(
    (a) => a.condominiumId === selectedCondoId,
  )?.condominium;

  const pendingResidents = pendingResidentsQuery.data || [];
  const announcements = announcementsQuery.data || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-bold text-3xl text-foreground tracking-tight">
              Painel de Moderação
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {currentCondo?.name || 'Carregando condomínio...'}
            </p>
          </div>
          {moderatorAssignments.length > 1 && (
            <select
              value={selectedCondoId}
              onChange={(e) => {
                setSelectedCondoId(e.target.value);
                setIsRejectingId(null);
                setReason('');
                setIsSuspendingId(null);
                setSuspensionReason('');
              }}
              className="rounded-lg border border-input bg-background px-3 py-1.5 font-medium text-foreground text-sm focus:border-ring focus:outline-none"
            >
              {moderatorAssignments.map((a) => (
                <option key={a.condominiumId} value={a.condominiumId}>
                  {a.condominium?.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Toggle Sub-Tabs */}
        <div className="mb-8 flex space-x-8 border-border border-b">
          <button
            type="button"
            onClick={() => setActiveSubTab('residents')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeSubTab === 'residents'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Moradores Pendentes ({pendingResidents.length})
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('announcements')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeSubTab === 'announcements'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Anúncios do Condomínio ({announcements.length})
            </div>
          </button>
        </div>

        {/* Residents View */}
        {activeSubTab === 'residents' && (
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

            {pendingResidentsQuery.isPending ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingResidents.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Check className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">
                    Tudo sob controle!
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Nenhuma solicitação de morador pendente para este
                    condomínio.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingResidents.map((resident) => (
                  <Card
                    key={resident.id}
                    className="flex flex-col justify-between"
                  >
                    <CardHeader>
                      <CardTitle className="font-semibold text-foreground text-lg">
                        {resident.provider?.name || 'Morador Sem Nome'}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Unidade: {resident.unitInfo || 'Não informada'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resident.proofOfResidency && (
                        <div className="rounded-lg border bg-muted/45 p-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-muted-foreground text-xs">
                              <FileText className="mr-1.5 h-4 w-4 text-primary" />
                              Comprovante
                            </span>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewUrl(
                                    resident.proofOfResidency || null,
                                  )
                                }
                                className="cursor-pointer text-primary text-xs hover:underline"
                              >
                                Visualizar
                              </button>
                              <a
                                href={resident.proofOfResidency}
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
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              onClick={() => setIsRejectingId(null)}
                              className="h-7 px-2 text-muted-foreground text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={
                                rejectMutation.isPending || !reason.trim()
                              }
                              onClick={() =>
                                rejectMutation.mutate({
                                  id: resident.id,
                                  reason: reason.trim(),
                                })
                              }
                              className="h-7 px-2 text-xs"
                            >
                              Confirmar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-2 pt-2">
                          <Button
                            disabled={approveMutation.isPending}
                            onClick={() =>
                              approveMutation.mutate({ id: resident.id })
                            }
                            className="flex-1"
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1.5 h-4 w-4" /> Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsRejectingId(resident.id);
                              setReason('');
                            }}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="mr-1.5 h-4 w-4" /> Rejeitar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Announcements View */}
        {activeSubTab === 'announcements' && (
          <>
            <div className="mb-6">
              <h2 className="font-bold text-2xl text-foreground">
                Anúncios da Comunidade
              </h2>
              <p className="mt-1 text-muted-foreground text-xs">
                Gerencie e suspenda anúncios que violam as regras do condomínio.
              </p>
            </div>

            {announcementsQuery.isPending ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : announcements.length === 0 ? (
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
                  <Card
                    key={ad.id}
                    className="flex flex-col justify-between overflow-hidden"
                  >
                    {/* Header Image */}
                    <div className="relative aspect-[4/3] w-full bg-muted">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="h-full w-full object-cover opacity-85"
                      />
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                        <span
                          className={`rounded-full border px-2.5 py-1 font-semibold text-xs shadow-md backdrop-blur-md ${
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
                          <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning/20 px-2 py-0.5 font-semibold text-[9px] text-warning backdrop-blur-md">
                            <ShieldAlert className="h-3 w-3" /> Alterado
                            recentemente
                          </span>
                        )}
                      </div>
                      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-background/95 to-transparent p-4">
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

                      {/* Suspension reason if already suspended */}
                      {ad.status === 'SUSPENDED' && ad.suspensionReason && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs">
                          <span className="mb-1 block font-bold text-destructive">
                            Motivo da Suspensão:
                          </span>
                          <p className="text-destructive/80 italic">
                            {ad.suspensionReason}
                          </p>
                        </div>
                      )}

                      {/* Action forms */}
                      {isSuspendingId === ad.id ? (
                        <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                          <div className="space-y-1">
                            <Label
                              htmlFor={`suspend-reason-${ad.id}`}
                              className="text-destructive text-xs"
                            >
                              Motivo da Suspensão *
                            </Label>
                            <Input
                              id={`suspend-reason-${ad.id}`}
                              placeholder="Ex: Conteúdo inadequado ou contato falso"
                              className="text-xs"
                              value={suspensionReason}
                              onChange={(e) =>
                                setSuspensionReason(e.target.value)
                              }
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              onClick={() => setIsSuspendingId(null)}
                              className="h-7 px-2 text-muted-foreground text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={
                                suspendMutation.isPending ||
                                !suspensionReason.trim()
                              }
                              onClick={() =>
                                suspendMutation.mutate({
                                  id: ad.id,
                                  reason: suspensionReason.trim(),
                                })
                              }
                              className="h-7 px-2 text-xs"
                            >
                              Confirmar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex pt-2">
                          {ad.status === 'ACTIVE' ? (
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setIsSuspendingId(ad.id);
                                setSuspensionReason('');
                              }}
                              className="w-full"
                            >
                              <AlertTriangle className="mr-1.5 h-4 w-4" />{' '}
                              Suspender Anúncio
                            </Button>
                          ) : (
                            <Button
                              disabled={reinstateMutation.isPending}
                              onClick={() =>
                                reinstateMutation.mutate({ id: ad.id })
                              }
                              className="w-full bg-success text-success-foreground hover:bg-success/80"
                            >
                              {reinstateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="mr-1.5 h-4 w-4" />{' '}
                                  Reabilitar Anúncio
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border bg-card shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex-1 overflow-hidden p-6 pt-12">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  title="Document Preview"
                  src={previewUrl}
                  className="h-full w-full rounded-lg bg-white"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center overflow-auto">
                  <img
                    src={previewUrl}
                    alt="Document Proof"
                    className="max-h-full max-w-full rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
