import { Button } from '@neighborhood-showcase/ui/components/button';
import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { Loader2, Search, UserX } from 'lucide-react';

export interface AdminProviderRecord {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'BANNED';
}

interface AdminProvidersPanelProps {
  banningUserId: string | null;
  banPending: boolean;
  banReason: string;
  isPending: boolean;
  providers: AdminProviderRecord[];
  search: string;
  onBanReasonChange: (value: string) => void;
  onOpenBan: (userId: string) => void;
  onCloseBan: () => void;
  onConfirmBan: (userId: string, reason: string) => void;
  onSearchChange: (value: string) => void;
}

export function AdminProvidersPanel({
  banningUserId,
  banPending,
  banReason,
  isPending,
  providers,
  search,
  onBanReasonChange,
  onOpenBan,
  onCloseBan,
  onConfirmBan,
  onSearchChange,
}: AdminProvidersPanelProps) {
  return (
    <>
      {/* Header + Search */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-2xl text-foreground">
            Diretório de Provedores
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Busque provedores cadastrados e gerencie suas permissões globais.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-3 left-3 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {isPending ? (
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
                <tr key={p.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {p.name}
                  </td>
                  <td className="px-6 py-4">{p.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-semibold text-xs ${
                        p.status === 'ACTIVE'
                          ? 'border-success/20 bg-success/10 text-success'
                          : 'border-destructive/20 bg-destructive/10 text-destructive'
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
                            onChange={(e) => onBanReasonChange(e.target.value)}
                          />
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              onClick={onCloseBan}
                              className="h-6 px-2 text-[10px] text-muted-foreground"
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={banPending || !banReason.trim()}
                              onClick={() =>
                                onConfirmBan(p.id, banReason.trim())
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
                          onClick={() => onOpenBan(p.id)}
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
  );
}
