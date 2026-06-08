import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminBlacklistPanel } from './panel/-admin-blacklist-panel';
import { AdminPendingCondosQueue } from './panel/-admin-pending-condos-queue';
import { AdminProvidersPanel } from './panel/-admin-providers-panel';
import { AdminUsersPanel } from './panel/-admin-users-panel';
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
          <AdminUsersPanel
            assigningUserId={assigningUserId}
            assignCondoId={assignCondoId}
            assignPending={assignModeratorMutation.isPending}
            condosForAssign={condosForAssign}
            isPending={usersQuery.isPending}
            promotingUserId={promotingUserId}
            promotePending={promoteToSystemManagerMutation.isPending}
            togglePending={toggleVisibilityMutation.isPending}
            users={allUsers}
            userSearch={userSearch}
            userRoleFilter={userRoleFilter}
            userStatusFilter={userStatusFilter}
            onAssignCancel={() => {
              setAssigningUserId(null);
              setAssignCondoId('');
            }}
            onAssignCondoIdChange={setAssignCondoId}
            onAssignConfirm={(userId, condominiumId) =>
              assignModeratorMutation.mutate({
                targetUserId: userId,
                condominiumId,
              })
            }
            onAssignOpen={(userId) => {
              setAssigningUserId(userId);
              setAssignCondoId('');
            }}
            onPromoteCancel={() => setPromotingUserId(null)}
            onPromoteConfirm={(userId) =>
              promoteToSystemManagerMutation.mutate({
                targetUserId: userId,
              })
            }
            onPromoteOpen={(userId) => setPromotingUserId(userId)}
            onRoleFilterChange={setUserRoleFilter}
            onSearchChange={setUserSearch}
            onStatusFilterChange={setUserStatusFilter}
            onToggleVisibility={(targetUserId) =>
              toggleVisibilityMutation.mutate({ targetUserId })
            }
          />
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
