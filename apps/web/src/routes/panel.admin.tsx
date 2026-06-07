import { Button } from '@neighborhood-showcase/ui/components/button';
import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  Eye,
  EyeOff,
  Loader2,
  Search,
  ShieldCheck,
  UserCog,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminBlacklistPanel } from './panel/-admin-blacklist-panel';
import { AdminPendingCondosQueue } from './panel/-admin-pending-condos-queue';
import { AdminProvidersPanel } from './panel/-admin-providers-panel';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/admin')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/',
      });
    }

    if (
      session.data.user.role !== 'SYSTEM_MANAGER' &&
      session.data.user.role !== 'ADMINISTRATOR'
    ) {
      throw redirect({
        to: '/panel/dashboard',
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
    'condos' | 'providers' | 'blacklist' | 'users'
  >('condos');

  // Search filter for providers
  const [providerSearch, setProviderSearch] = useState('');

  // Blacklist form inputs
  const [newCpfHash, setNewCpfHash] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');

  // Ban action inputs
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  // User management state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<
    'USER' | 'SYSTEM_MANAGER' | 'ADMINISTRATOR' | ''
  >('');
  const [userStatusFilter, setUserStatusFilter] = useState<
    'ACTIVE' | 'BANNED' | ''
  >('');
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [assignCondoId, setAssignCondoId] = useState('');

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

  const usersQuery = useQuery(
    trpc.admin.listUsers.queryOptions(
      {
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
        status: userStatusFilter || undefined,
      },
      { enabled: activeTab === 'users' },
    ),
  );

  const condosForAssignQuery = useQuery(
    trpc.condominium.listApproved.queryOptions(
      { query: '' },
      { enabled: activeTab === 'users' },
    ),
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

  const promoteToSystemManagerMutation = useMutation(
    trpc.admin.promoteToSystemManager.mutationOptions({
      onSuccess: () => {
        toast.success('Usuário promovido a System Manager com sucesso!');
        setPromotingUserId(null);
        usersQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao promover usuário.');
      },
    }),
  );

  const assignModeratorMutation = useMutation(
    trpc.admin.assignModerator.mutationOptions({
      onSuccess: () => {
        toast.success('Moderador atribuído com sucesso!');
        setAssigningUserId(null);
        setAssignCondoId('');
        usersQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao atribuir moderador.');
      },
    }),
  );

  const toggleVisibilityMutation = useMutation(
    trpc.admin.toggleProviderVisibility.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          data.isProviderVisible
            ? 'Provedor agora visível no diretório.'
            : 'Provedor ocultado do diretório.',
        );
        usersQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao alterar visibilidade.');
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
  const allUsers = usersQuery.data || [];
  const condosForAssign = condosForAssignQuery.data || [];

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
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`relative pb-4 font-semibold text-sm transition-all ${
              activeTab === 'users'
                ? 'border-primary border-b-2 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Usuários ({allUsers.length || '…'})
          </button>
        </div>

        {/* Tab 1: Condos Approval */}
        {activeTab === 'condos' && (
          <AdminPendingCondosQueue
            approvePending={approveCondoMutation.isPending}
            isPending={pendingCondosQuery.isPending}
            isRejectingId={isRejectingId}
            pendingCondos={pendingCondos}
            reason={reason}
            rejectPending={rejectCondoMutation.isPending}
            onApprove={(condominiumId) =>
              approveCondoMutation.mutate({ id: condominiumId })
            }
            onOpenPreview={(url) => setPreviewUrl(url)}
            onOpenReject={(condominiumId) => {
              setIsRejectingId(condominiumId);
              setReason('');
            }}
            onReasonChange={setReason}
            onReject={(condominiumId, rejectReason) =>
              rejectCondoMutation.mutate({
                id: condominiumId,
                reason: rejectReason.trim(),
              })
            }
            onRejectCancel={() => setIsRejectingId(null)}
          />
        )}

        {/* Tab 2: Providers Directory */}
        {activeTab === 'providers' && (
          <AdminProvidersPanel
            banningUserId={banningUserId}
            banPending={banProviderMutation.isPending}
            banReason={banReason}
            isPending={providersQuery.isPending}
            providers={providers}
            search={providerSearch}
            onBanReasonChange={setBanReason}
            onOpenBan={(id) => {
              setBanningUserId(id);
              setBanReason('');
            }}
            onCloseBan={() => setBanningUserId(null)}
            onConfirmBan={(id, reason) =>
              banProviderMutation.mutate({ id, reason })
            }
            onSearchChange={setProviderSearch}
          />
        )}

        {/* Tab 3: CPF Blacklist */}
        {activeTab === 'blacklist' && (
          <AdminBlacklistPanel
            addPending={addBlacklistMutation.isPending}
            blacklist={blacklist}
            blacklistReason={blacklistReason}
            isPending={blacklistQuery.isPending}
            newCpfHash={newCpfHash}
            removePending={removeBlacklistMutation.isPending}
            onBlacklistReasonChange={setBlacklistReason}
            onNewCpfHashChange={setNewCpfHash}
            onRemove={(blacklistId) =>
              removeBlacklistMutation.mutate({ id: blacklistId })
            }
            onSubmit={(cpfHash, reason) =>
              addBlacklistMutation.mutate({
                cpfHash,
                reason,
              })
            }
          />
        )}

        {/* Tab 4: User Management */}
        {activeTab === 'users' && (
          <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-bold text-2xl text-foreground">
                  Gerenciamento de Usuários
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Gerencie funções, visibilidade e status de todos os usuários.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative w-56">
                  <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) =>
                    setUserRoleFilter(
                      e.target.value as
                        | 'USER'
                        | 'SYSTEM_MANAGER'
                        | 'ADMINISTRATOR'
                        | '',
                    )
                  }
                  className="rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Todos os papéis</option>
                  <option value="USER">User</option>
                  <option value="SYSTEM_MANAGER">System Manager</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(e) =>
                    setUserStatusFilter(
                      e.target.value as 'ACTIVE' | 'BANNED' | '',
                    )
                  }
                  className="rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="BANNED">Banido</option>
                </select>
              </div>
            </div>

            {usersQuery.isPending ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : allUsers.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <UserCog className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum usuário encontrado.
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
                      <th className="px-6 py-4">Papel</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Visível</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-foreground">
                    {allUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="px-6 py-4 font-medium">{u.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 font-semibold text-xs ${
                              u.role === 'SYSTEM_MANAGER' ||
                              u.role === 'ADMINISTRATOR'
                                ? 'border-primary/20 bg-primary/10 text-primary'
                                : 'border-border bg-muted text-muted-foreground'
                            }`}
                          >
                            {u.role === 'ADMINISTRATOR'
                              ? 'Administrator'
                              : u.role === 'SYSTEM_MANAGER'
                                ? 'System Manager'
                                : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 font-semibold text-xs ${
                              u.status === 'ACTIVE'
                                ? 'border-success/20 bg-success/10 text-success'
                                : 'border-destructive/20 bg-destructive/10 text-destructive'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Ativo' : 'Banido'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            disabled={toggleVisibilityMutation.isPending}
                            onClick={() =>
                              toggleVisibilityMutation.mutate({
                                targetUserId: u.id,
                              })
                            }
                            className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
                            title={
                              u.isProviderVisible
                                ? 'Ocultar do diretório'
                                : 'Mostrar no diretório'
                            }
                          >
                            {u.isProviderVisible ? (
                              <Eye className="h-4 w-4 text-success" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-end gap-2">
                            {/* Promote to System Manager */}
                            {u.role !== 'SYSTEM_MANAGER' &&
                              u.role !== 'ADMINISTRATOR' &&
                              u.status === 'ACTIVE' &&
                              (promotingUserId === u.id ? (
                                <div className="inline-flex w-52 flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-left">
                                  <p className="font-medium text-primary text-xs">
                                    Promover a System Manager?
                                  </p>
                                  <div className="flex justify-end gap-1.5">
                                    <Button
                                      variant="ghost"
                                      onClick={() => setPromotingUserId(null)}
                                      className="h-6 px-2 text-[10px] text-muted-foreground"
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      disabled={
                                        promoteToSystemManagerMutation.isPending
                                      }
                                      onClick={() =>
                                        promoteToSystemManagerMutation.mutate({
                                          targetUserId: u.id,
                                        })
                                      }
                                      className="h-6 px-2 text-[10px]"
                                    >
                                      Confirmar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => setPromotingUserId(u.id)}
                                  className="h-7 gap-1 text-xs"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Promover
                                </Button>
                              ))}

                            {/* Assign Moderator */}
                            {u.status === 'ACTIVE' &&
                              (assigningUserId === u.id ? (
                                <div className="inline-flex w-52 flex-col gap-2 rounded-xl border border-border bg-muted p-3 text-left">
                                  <p className="font-medium text-foreground text-xs">
                                    Atribuir Moderador
                                  </p>
                                  <select
                                    value={assignCondoId}
                                    onChange={(e) =>
                                      setAssignCondoId(e.target.value)
                                    }
                                    className="rounded border border-border bg-background px-2 py-1 text-foreground text-xs"
                                  >
                                    <option value="">
                                      Selecionar condomínio...
                                    </option>
                                    {condosForAssign.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="flex justify-end gap-1.5">
                                    <Button
                                      variant="ghost"
                                      onClick={() => {
                                        setAssigningUserId(null);
                                        setAssignCondoId('');
                                      }}
                                      className="h-6 px-2 text-[10px] text-muted-foreground"
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      disabled={
                                        assignModeratorMutation.isPending ||
                                        !assignCondoId
                                      }
                                      onClick={() =>
                                        assignModeratorMutation.mutate({
                                          targetUserId: u.id,
                                          condominiumId: assignCondoId,
                                        })
                                      }
                                      className="h-6 px-2 text-[10px]"
                                    >
                                      Confirmar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setAssigningUserId(u.id);
                                    setAssignCondoId('');
                                  }}
                                  className="h-7 gap-1 text-xs"
                                >
                                  <UserCog className="h-3.5 w-3.5" />
                                  Moderador
                                </Button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border bg-card">
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
                  className="h-full w-full rounded-lg bg-background"
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
