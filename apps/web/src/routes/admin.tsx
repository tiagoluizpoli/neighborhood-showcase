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
  Check,
  ExternalLink,
  FileText,
  Loader2,
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
        to: '/',
      });
    }

    if (session.data.user.role !== 'SYSTEM_MANAGER') {
      throw redirect({
        to: '/dashboard',
        search: {
          message: 'Página não encontrada',
        },
      });
    }

    return { session };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
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

  const pendingCondos = pendingCondosQuery.data || [];
  const providers = providersQuery.data || [];
  const blacklist = blacklistQuery.data || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Showcase Admin
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Portal de Moderação Global
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex space-x-8 border-border border-b">
          <button
            type="button"
            onClick={() => setActiveTab('condos')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'condos'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Condomínios Pendentes ({pendingCondos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'providers'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Diretório de Provedores
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blacklist')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'blacklist'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Lista Negra de CPFs ({blacklist.length})
          </button>
        </div>

        {/* Tab 1: Condos Approval */}
        {activeTab === 'condos' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-bold text-2xl text-foreground">
                Aprovações Pendentes
              </h2>
            </div>

            {pendingCondosQuery.isPending ? (
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
                    className="flex flex-col justify-between"
                  >
                    <CardHeader>
                      <CardTitle className="font-semibold text-foreground text-lg">
                        {condo.name}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {condo.city} - {condo.state} | CEP: {condo.cep}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {condo.proofUrl && (
                        <div className="rounded-lg border bg-muted/45 p-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-muted-foreground text-xs">
                              <FileText className="mr-1.5 h-4 w-4 text-primary" />
                              Convenção / Ata
                            </span>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewUrl(condo.proofUrl || null)
                                }
                                className="cursor-pointer text-primary text-xs hover:underline"
                              >
                                Visualizar
                              </button>
                              <a
                                href={condo.proofUrl}
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

                      {isRejectingId === condo.id ? (
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
                                rejectCondoMutation.isPending || !reason.trim()
                              }
                              onClick={() =>
                                rejectCondoMutation.mutate({
                                  id: condo.id,
                                  reason: reason.trim(),
                                })
                              }
                              className="h-7 px-2 text-xs"
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
                            className="flex-1"
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

        {/* Tab 2: Providers Directory */}
        {activeTab === 'providers' && (
          <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-2xl text-foreground">
                  Diretório de Provedores
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Busque provedores cadastrados e gerencie suas permissões
                  globais.
                </p>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute top-3 left-3 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {providersQuery.isPending ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : providers.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum provedor encontrado.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Nome</th>
                      <th className="px-6 py-4">E-mail</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    {providers.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          {p.name}
                        </td>
                        <td className="px-6 py-4">{p.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 font-semibold text-xs ${
                              p.status === 'ACTIVE'
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? 'Ativo' : 'Banido'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === 'ACTIVE' ? (
                            banningUserId === p.id ? (
                              <div className="inline-flex w-64 max-w-xs flex-col gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-left">
                                <Label
                                  htmlFor={`ban-reason-${p.id}`}
                                  className="text-destructive text-xs"
                                >
                                  Motivo do Banimento *
                                </Label>
                                <Input
                                  id={`ban-reason-${p.id}`}
                                  placeholder="Ex: Fraude ou spam recorrente"
                                  className="h-8 text-xs"
                                  value={banReason}
                                  onChange={(e) => setBanReason(e.target.value)}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    onClick={() => setBanningUserId(null)}
                                    className="h-6 px-2 text-[10px] text-muted-foreground"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    variant="destructive"
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
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    Confirmar Ban
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setBanningUserId(p.id);
                                  setBanReason('');
                                }}
                                className="h-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <UserX className="mr-1.5 inline h-3.5 w-3.5" />
                                Banir Provedor
                              </Button>
                            )
                          ) : (
                            <span className="text-muted-foreground/50 text-xs italic">
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
              <Card>
                <CardHeader>
                  <CardTitle className="font-semibold text-foreground text-lg">
                    Adicionar CPF Blacklist
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Bloqueie um CPF informando seu Hash SHA-256 e o motivo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="font-medium text-foreground text-xs">
                      CPF Hash (SHA-256) *
                    </Label>
                    <Input
                      placeholder="Ex: 85afb35c0245a49..."
                      value={newCpfHash}
                      onChange={(e) => setNewCpfHash(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-medium text-foreground text-xs">
                      Motivo do Bloqueio *
                    </Label>
                    <Input
                      placeholder="Ex: Histórico de golpes em outros sistemas"
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
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
                    className="w-full"
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
                <h3 className="font-bold text-foreground text-lg">
                  CPFs Bloqueados
                </h3>
                <p className="text-muted-foreground text-xs">
                  Lista global de hashes de CPF impedidos de se cadastrar.
                </p>
              </div>

              {blacklistQuery.isPending ? (
                <div className="flex min-h-[30vh] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : blacklist.length === 0 ? (
                <Card className="py-12 text-center">
                  <CardContent>
                    <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Nenhum CPF na lista negra.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">CPF Hash (SHA-256)</th>
                        <th className="px-6 py-4">Motivo</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-foreground">
                      {blacklist.map((b) => (
                        <tr
                          key={b.id}
                          className="transition-colors hover:bg-muted/50"
                        >
                          <td
                            className="max-w-[180px] truncate px-6 py-4 font-mono text-muted-foreground text-xs"
                            title={b.cpfHash}
                          >
                            {b.cpfHash}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {b.reason}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              disabled={removeBlacklistMutation.isPending}
                              onClick={() =>
                                removeBlacklistMutation.mutate({ id: b.id })
                              }
                              className="h-8 w-8 cursor-pointer rounded-lg p-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
