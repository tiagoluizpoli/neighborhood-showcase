import { Button } from '@neighborhood-showcase/ui/components/button';
import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import {
  Eye,
  EyeOff,
  Loader2,
  Search,
  ShieldCheck,
  UserCog,
} from 'lucide-react';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'SYSTEM_MANAGER' | 'ADMINISTRATOR';
  status: 'ACTIVE' | 'BANNED';
  isProviderVisible: boolean;
}

export interface CondominiumOption {
  id: string;
  name: string;
}

interface AdminUsersPanelProps {
  assigningUserId: string | null;
  assignCondoId: string;
  condosForAssign: CondominiumOption[];
  isPending: boolean;
  promotingUserId: string | null;
  togglePending: boolean;
  promotePending: boolean;
  assignPending: boolean;
  users: AdminUserRecord[];
  userSearch: string;
  userRoleFilter: '' | 'USER' | 'SYSTEM_MANAGER' | 'ADMINISTRATOR';
  userStatusFilter: '' | 'ACTIVE' | 'BANNED';
  onAssignCondoIdChange: (id: string) => void;
  onAssignCancel: () => void;
  onAssignConfirm: (userId: string, condominiumId: string) => void;
  onAssignOpen: (userId: string) => void;
  onPromoteCancel: () => void;
  onPromoteConfirm: (userId: string) => void;
  onPromoteOpen: (userId: string) => void;
  onRoleFilterChange: (
    value: '' | 'USER' | 'SYSTEM_MANAGER' | 'ADMINISTRATOR',
  ) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: '' | 'ACTIVE' | 'BANNED') => void;
  onToggleVisibility: (userId: string) => void;
}

export function AdminUsersPanel({
  assigningUserId,
  assignCondoId,
  condosForAssign,
  isPending,
  promotingUserId,
  togglePending,
  promotePending,
  assignPending,
  users,
  userSearch,
  userRoleFilter,
  userStatusFilter,
  onAssignCondoIdChange,
  onAssignCancel,
  onAssignConfirm,
  onAssignOpen,
  onPromoteCancel,
  onPromoteConfirm,
  onPromoteOpen,
  onRoleFilterChange,
  onSearchChange,
  onStatusFilterChange,
  onToggleVisibility,
}: AdminUsersPanelProps) {
  return (
    <>
      {/* Header + Search/Filters */}
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={userRoleFilter}
            onChange={(e) =>
              onRoleFilterChange(
                e.target.value as
                  | ''
                  | 'USER'
                  | 'SYSTEM_MANAGER'
                  | 'ADMINISTRATOR',
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
              onStatusFilterChange(e.target.value as '' | 'ACTIVE' | 'BANNED')
            }
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="BANNED">Banido</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isPending ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
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
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
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
                      disabled={togglePending}
                      onClick={() => onToggleVisibility(u.id)}
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
                                onClick={onPromoteCancel}
                                className="h-6 px-2 text-[10px] text-muted-foreground"
                              >
                                Cancelar
                              </Button>
                              <Button
                                disabled={promotePending}
                                onClick={() => onPromoteConfirm(u.id)}
                                className="h-6 px-2 text-[10px]"
                              >
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => onPromoteOpen(u.id)}
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
                                onAssignCondoIdChange(e.target.value)
                              }
                              className="rounded border border-border bg-background px-2 py-1 text-foreground text-xs"
                            >
                              <option value="">Selecionar condomínio...</option>
                              {condosForAssign.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                onClick={onAssignCancel}
                                className="h-6 px-2 text-[10px] text-muted-foreground"
                              >
                                Cancelar
                              </Button>
                              <Button
                                disabled={assignPending || !assignCondoId}
                                onClick={() =>
                                  onAssignConfirm(u.id, assignCondoId)
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
                            onClick={() => onAssignOpen(u.id)}
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
  );
}
