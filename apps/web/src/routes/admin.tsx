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
  Building,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  LogOut,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/auth',
      });
    }

    if (session.data.user.role !== 'SYSTEM_MANAGER') {
      throw redirect({
        to: '/dashboard',
      });
    }

    return { session };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'condos' | 'providers' | 'blacklist'
  >('condos');

  // Search filter for providers
  const [providerSearch, setProviderSearch] = useState('');

  // Blacklist form inputs
  const [newCpfHash, setNewCpfHash] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');

  // Ban action inputs
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  // Queries
  const pendingCondosQuery = useQuery(
    trpc.condominium.listPending.queryOptions(),
  );

  const providersQuery = useQuery(
    trpc.admin.listProviders.queryOptions(
      { search: providerSearch || undefined },
      { enabled: activeTab === 'providers' },
    ),
  );

  const blacklistQuery = useQuery(
    trpc.admin.listBlacklist.queryOptions(undefined, {
      enabled: activeTab === 'blacklist',
    }),
  );

  // Mutations
  const approveCondoMutation = useMutation(
    trpc.condominium.approve.mutationOptions({
      onSuccess: () => {
        toast.success('Condomínio aprovado com sucesso!');
        pendingCondosQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao aprovar condomínio.');
      },
    }),
  );

  const rejectCondoMutation = useMutation(
    trpc.condominium.reject.mutationOptions({
      onSuccess: () => {
        toast.success('Condomínio rejeitado com sucesso!');
        setIsRejectingId(null);
        setReason('');
        pendingCondosQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao rejeitar condomínio.');
      },
    }),
  );

  const banProviderMutation = useMutation(
    trpc.admin.banProvider.mutationOptions({
      onSuccess: () => {
        toast.success('Provedor banido e anúncios removidos com sucesso!');
        setBanningUserId(null);
        setBanReason('');
        providersQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao banir provedor.');
      },
    }),
  );

  const addBlacklistMutation = useMutation(
    trpc.admin.addBlacklist.mutationOptions({
      onSuccess: () => {
        toast.success('CPF adicionado à lista negra com sucesso!');
        setNewCpfHash('');
        setBlacklistReason('');
        blacklistQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao adicionar CPF.');
      },
    }),
  );

  const removeBlacklistMutation = useMutation(
    trpc.admin.removeBlacklist.mutationOptions({
      onSuccess: () => {
        toast.success('CPF removido da lista negra com sucesso!');
        blacklistQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao remover CPF.');
      },
    }),
  );

  // States for condo reject modal
  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: '/auth' });
  };

  const pendingCondos = pendingCondosQuery.data || [];
  const providers = providersQuery.data || [];
  const blacklist = blacklistQuery.data || [];

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
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-200">
                Showcase Admin
              </h1>
              <p className="text-slate-400 text-xs">
                Portal de Moderação Global
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="cursor-pointer text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="mb-8 flex space-x-8 border-slate-800 border-b">
          <button
            type="button"
            onClick={() => setActiveTab('condos')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'condos'
                ? 'border-indigo-400 border-b-2 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Condomínios Pendentes ({pendingCondos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'providers'
                ? 'border-indigo-400 border-b-2 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Diretório de Provedores
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blacklist')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'blacklist'
                ? 'border-indigo-400 border-b-2 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lista Negra de CPFs ({blacklist.length})
          </button>
        </div>

        {/* Tab 1: Condos Approval */}
        {activeTab === 'condos' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-bold text-2xl text-slate-100">
                Aprovações Pendentes
              </h2>
            </div>

            {pendingCondosQuery.isPending ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : pendingCondos.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/40 py-12 text-center backdrop-blur-md">
                <CardContent>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                    <Check className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-300">
                    Tudo limpo!
                  </h3>
                  <p className="mt-1 text-slate-500 text-sm">
                    Não há nenhuma solicitação de condomínio pendente de
                    aprovação.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingCondos.map((condo) => (
                  <Card
                    key={condo.id}
                    className="flex flex-col justify-between border-slate-800 bg-slate-900/60 transition-all hover:border-slate-700 hover:shadow-indigo-500/5 hover:shadow-lg"
                  >
                    <CardHeader>
                      <CardTitle className="font-semibold text-lg text-slate-200">
                        {condo.name}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {condo.city} - {condo.state} | CEP: {condo.cep}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {condo.proofUrl && (
                        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-slate-400 text-xs">
                              <FileText className="mr-1.5 h-4 w-4 text-indigo-400" />
                              Convenção / Ata
                            </span>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewUrl(condo.proofUrl || null)
                                }
                                className="cursor-pointer text-indigo-400 text-xs hover:underline"
                              >
                                Visualizar
                              </button>
                              <a
                                href={condo.proofUrl}
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

                      {isRejectingId === condo.id ? (
                        <div className="space-y-3 rounded-lg border border-red-950/50 bg-red-950/10 p-3">
                          <div className="space-y-1">
                            <Label
                              htmlFor={`reason-${condo.id}`}
                              className="text-red-400 text-xs"
                            >
                              Motivo da Rejeição *
                            </Label>
                            <Input
                              id={`reason-${condo.id}`}
                              placeholder="Ex: Documento inválido ou ilegível"
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
                              disabled={
                                rejectCondoMutation.isPending || !reason.trim()
                              }
                              onClick={() =>
                                rejectCondoMutation.mutate({
                                  id: condo.id,
                                  reason: reason.trim(),
                                })
                              }
                              className="h-7 bg-red-600 px-2 text-white text-xs hover:bg-red-700"
                            >
                              Confirmar Rejeição
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-2 pt-2">
                          <Button
                            disabled={approveCondoMutation.isPending}
                            onClick={() =>
                              approveCondoMutation.mutate({ id: condo.id })
                            }
                            className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            {approveCondoMutation.isPending ? (
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
                              setIsRejectingId(condo.id);
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
          </>
        )}

        {/* Tab 2: Providers Directory */}
        {activeTab === 'providers' && (
          <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-2xl text-slate-100">
                  Diretório de Provedores
                </h2>
                <p className="mt-1 text-slate-400 text-xs">
                  Busque provedores cadastrados e gerencie suas permissões
                  globais.
                </p>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute top-3 left-3 h-4.5 w-4.5 text-slate-500" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="border-slate-850 bg-slate-900 pl-10 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            {providersQuery.isPending ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : providers.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/40 py-12 text-center backdrop-blur-md">
                <CardContent>
                  <Search className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                  <p className="text-slate-500 text-sm">
                    Nenhum provedor encontrado.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-slate-850 border-b bg-slate-900/50 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Nome</th>
                      <th className="px-6 py-4">E-mail</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {providers.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-slate-900/30"
                      >
                        <td className="px-6 py-4 font-medium text-slate-100">
                          {p.name}
                        </td>
                        <td className="px-6 py-4">{p.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-semibold text-xs ${
                              p.status === 'ACTIVE'
                                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? 'Ativo' : 'Banido'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === 'ACTIVE' ? (
                            banningUserId === p.id ? (
                              <div className="inline-flex w-64 max-w-xs flex-col gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3 text-left">
                                <Label
                                  htmlFor={`ban-reason-${p.id}`}
                                  className="text-red-400 text-xs"
                                >
                                  Motivo do Banimento *
                                </Label>
                                <Input
                                  id={`ban-reason-${p.id}`}
                                  placeholder="Ex: Fraude ou spam recorrente"
                                  className="h-8 border-red-950 bg-slate-950 text-xs"
                                  value={banReason}
                                  onChange={(e) => setBanReason(e.target.value)}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    onClick={() => setBanningUserId(null)}
                                    className="h-6 px-2 text-[10px] text-slate-400"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    disabled={
                                      banProviderMutation.isPending ||
                                      !banReason.trim()
                                    }
                                    onClick={() =>
                                      banProviderMutation.mutate({
                                        id: p.id,
                                        reason: banReason.trim(),
                                      })
                                    }
                                    className="h-6 bg-rose-600 px-2 text-[10px] text-white hover:bg-rose-700"
                                  >
                                    Confirmar Ban
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => {
                                  setBanningUserId(p.id);
                                  setBanReason('');
                                }}
                                className="h-8 rounded-lg border border-rose-500/20 bg-rose-600/10 px-3 py-1.5 font-medium text-rose-500 text-xs transition-all hover:border-transparent hover:bg-rose-600 hover:text-white active:scale-95"
                              >
                                <UserX className="mr-1.5 inline h-3.5 w-3.5" />
                                Banir Provedor
                              </Button>
                            )
                          ) : (
                            <span className="text-slate-600 text-xs italic">
                              Ações desabilitadas
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Tab 3: CPF Blacklist */}
        {activeTab === 'blacklist' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Add to Blacklist panel */}
            <div className="lg:col-span-1">
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="font-semibold text-lg text-slate-100">
                    Adicionar CPF Blacklist
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Bloqueie um CPF informando seu Hash SHA-256 e o motivo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="font-medium text-slate-300 text-xs">
                      CPF Hash (SHA-256) *
                    </Label>
                    <Input
                      placeholder="Ex: 85afb35c0245a49..."
                      value={newCpfHash}
                      onChange={(e) => setNewCpfHash(e.target.value)}
                      className="border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-medium text-slate-300 text-xs">
                      Motivo do Bloqueio *
                    </Label>
                    <Input
                      placeholder="Ex: Histórico de golpes em outros sistemas"
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      className="border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-700"
                    />
                  </div>
                  <Button
                    disabled={
                      addBlacklistMutation.isPending ||
                      !newCpfHash.trim() ||
                      !blacklistReason.trim()
                    }
                    onClick={() =>
                      addBlacklistMutation.mutate({
                        cpfHash: newCpfHash.trim(),
                        reason: blacklistReason.trim(),
                      })
                    }
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {addBlacklistMutation.isPending ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-1.5 h-4 w-4" /> Adicionar CPF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Blacklist records table */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h3 className="font-bold text-lg text-slate-100">
                  CPFs Bloqueados
                </h3>
                <p className="text-slate-500 text-xs">
                  Lista global de hashes de CPF impedidos de se cadastrar.
                </p>
              </div>

              {blacklistQuery.isPending ? (
                <div className="flex min-h-[30vh] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : blacklist.length === 0 ? (
                <Card className="border-slate-800 bg-slate-900/40 py-12 text-center backdrop-blur-md">
                  <CardContent>
                    <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-slate-500 text-sm">
                      Nenhum CPF na lista negra.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-slate-850 border-b bg-slate-900/50 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">CPF Hash (SHA-256)</th>
                        <th className="px-6 py-4">Motivo</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {blacklist.map((b) => (
                        <tr
                          key={b.id}
                          className="transition-colors hover:bg-slate-900/30"
                        >
                          <td
                            className="max-w-[180px] truncate px-6 py-4 font-mono text-slate-400 text-xs"
                            title={b.cpfHash}
                          >
                            {b.cpfHash}
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-xs">
                            {b.reason}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              disabled={removeBlacklistMutation.isPending}
                              onClick={() =>
                                removeBlacklistMutation.mutate({ id: b.id })
                              }
                              className="h-8 w-8 cursor-pointer rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
                              title="Remover da Lista Negra"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
