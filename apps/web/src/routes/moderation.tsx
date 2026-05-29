import { Button } from '@base-fullstack-template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@base-fullstack-template/ui/components/card';
import { Input } from '@base-fullstack-template/ui/components/input';
import { Label } from '@base-fullstack-template/ui/components/label';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  LogOut,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { trpc, trpcClient } from '@/utils/trpc';

export const Route = createFileRoute('/moderation')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/auth',
      });
    }

    // Call tRPC client directly to verify moderator role
    const assignments = await trpcClient.assignment.getMyAssignments.query();
    const moderatorAssignments = assignments.filter(
      (a) => a.type === 'MODERATOR' && a.status === 'APPROVED',
    );

    if (moderatorAssignments.length === 0) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return { session, moderatorAssignments };
  },
  component: ModerationDashboard,
});

function ModerationDashboard() {
  const navigate = useNavigate();
  const { moderatorAssignments } = Route.useRouteContext();

  // Selected condo context state
  const [selectedCondoId, setSelectedCondoId] = useState<string>(
    moderatorAssignments[0]?.condominiumId || '',
  );

  // Queries & Mutations
  const pendingResidentsQuery = useQuery(
    trpc.assignment.listPending.queryOptions(
      { condominiumId: selectedCondoId },
      { enabled: !!selectedCondoId },
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

  // UI States
  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: '/auth' });
  };

  const currentCondo = moderatorAssignments.find(
    (a) => a.condominiumId === selectedCondoId,
  )?.condominium;

  const pendingResidents = pendingResidentsQuery.data || [];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="border-slate-800 border-b bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-200">
                Painel de Moderação
              </h1>
              <p className="text-slate-400 text-xs">
                {currentCondo?.name || 'Carregando condomínio...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {moderatorAssignments.length > 1 && (
              <select
                value={selectedCondoId}
                onChange={(e) => {
                  setSelectedCondoId(e.target.value);
                  setIsRejectingId(null);
                  setReason('');
                }}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-medium text-slate-300 text-sm focus:border-indigo-600 focus:outline-none"
              >
                {moderatorAssignments.map((a) => (
                  <option key={a.condominiumId} value={a.condominiumId}>
                    {a.condominium?.name}
                  </option>
                ))}
              </select>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="cursor-pointer text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-slate-100">
              Solicitações de Moradores
            </h2>
            <p className="mt-1 text-slate-400 text-xs">
              Aprove ou rejeite novas solicitações de moradores para a sua
              comunidade
            </p>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-semibold text-indigo-400 text-xs">
            {pendingResidents.length} pendentes
          </span>
        </div>

        {pendingResidentsQuery.isPending ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : pendingResidents.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900/40 py-12 text-center backdrop-blur-md">
            <CardContent>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-300">
                Tudo sob controle!
              </h3>
              <p className="mt-1 text-slate-500 text-sm">
                Nenhuma solicitação de morador pendente para este condomínio.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingResidents.map((resident) => (
              <Card
                key={resident.id}
                className="flex flex-col justify-between border-slate-800 bg-slate-900/60 transition-all hover:border-slate-700 hover:shadow-indigo-500/5 hover:shadow-lg"
              >
                <CardHeader>
                  <CardTitle className="font-semibold text-lg text-slate-200">
                    {resident.provider?.name || 'Morador Sem Nome'}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Unidade: {resident.unitInfo || 'Não informada'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resident.proofOfResidency && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-slate-400 text-xs">
                          <FileText className="mr-1.5 h-4 w-4 text-indigo-400" />
                          Comprovante
                        </span>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewUrl(resident.proofOfResidency || null)
                            }
                            className="cursor-pointer text-indigo-400 text-xs hover:underline"
                          >
                            Visualizar
                          </button>
                          <a
                            href={resident.proofOfResidency}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center text-indigo-400 text-xs hover:underline"
                          >
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {isRejectingId === resident.id ? (
                    <div className="space-y-3 rounded-lg border border-red-950/50 bg-red-950/10 p-3">
                      <div className="space-y-1">
                        <Label
                          htmlFor={`reason-${resident.id}`}
                          className="text-red-400 text-xs"
                        >
                          Motivo da Rejeição *
                        </Label>
                        <Input
                          id={`reason-${resident.id}`}
                          placeholder="Ex: Nome inválido ou comprovante ilegível"
                          className="border-red-950/80 bg-slate-950 text-slate-100 text-xs placeholder:text-slate-700 focus-visible:ring-red-600"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => setIsRejectingId(null)}
                          className="h-7 px-2 text-slate-400 text-xs hover:bg-slate-800"
                        >
                          Cancelar
                        </Button>
                        <Button
                          disabled={rejectMutation.isPending || !reason.trim()}
                          onClick={() =>
                            rejectMutation.mutate({
                              id: resident.id,
                              reason: reason.trim(),
                            })
                          }
                          className="h-7 bg-red-600 px-2 text-white text-xs hover:bg-red-700"
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
                        className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
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
                        className="border-slate-800 text-red-400 hover:bg-red-950/20 hover:text-red-300"
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
      </main>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
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
