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
import { Loader2, Plus, ShieldAlert, Trash2 } from 'lucide-react';

export interface AdminBlacklistRecord {
  cpfHash: string;
  id: string;
  reason: string;
}

interface AdminBlacklistPanelProps {
  addPending: boolean;
  blacklist: AdminBlacklistRecord[];
  blacklistReason: string;
  isPending: boolean;
  newCpfHash: string;
  removePending: boolean;
  onBlacklistReasonChange: (value: string) => void;
  onNewCpfHashChange: (value: string) => void;
  onRemove: (blacklistId: string) => void;
  onSubmit: (cpfHash: string, reason: string) => void;
}

export function AdminBlacklistPanel({
  addPending,
  blacklist,
  blacklistReason,
  isPending,
  newCpfHash,
  removePending,
  onBlacklistReasonChange,
  onNewCpfHashChange,
  onRemove,
  onSubmit,
}: AdminBlacklistPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar CPF Blacklist</CardTitle>
            <CardDescription>
              Bloqueie um CPF informando seu Hash SHA-256 e o motivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>CPF Hash (SHA-256) *</Label>
              <Input
                placeholder="Ex: 85afb35c0245a49..."
                value={newCpfHash}
                onChange={(e) => onNewCpfHashChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo do Bloqueio *</Label>
              <Input
                placeholder="Ex: Histórico de golpes em outros sistemas"
                value={blacklistReason}
                onChange={(e) => onBlacklistReasonChange(e.target.value)}
              />
            </div>
            <Button
              disabled={
                addPending || !newCpfHash.trim() || !blacklistReason.trim()
              }
              onClick={() =>
                onSubmit(newCpfHash.trim(), blacklistReason.trim())
              }
              className="w-full"
            >
              {addPending ? (
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

      <div className="lg:col-span-2">
        <div className="mb-4">
          <h3 className="font-bold text-foreground text-lg">CPFs Bloqueados</h3>
          <p className="text-muted-foreground text-xs">
            Lista global de hashes de CPF impedidos de se cadastrar.
          </p>
        </div>

        {isPending ? (
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
                {blacklist.map((record) => (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td
                      className="max-w-[180px] truncate px-6 py-4 font-mono text-muted-foreground text-xs"
                      title={record.cpfHash}
                    >
                      {record.cpfHash}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {record.reason}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        disabled={removePending}
                        onClick={() => onRemove(record.id)}
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
  );
}
