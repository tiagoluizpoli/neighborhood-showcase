import { Button } from '@base-fullstack-template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@base-fullstack-template/ui/components/card';
import { createFileRoute } from '@tanstack/react-router';
import { Home, Plus, Users } from 'lucide-react';

export const Route = createFileRoute('/dashboard/condo-setup')({
  component: CondoSetupComponent,
});

function CondoSetupComponent() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_45%)]" />
      </div>

      <Card className="w-full max-w-2xl border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <Home className="h-8 w-8" />
          </div>
          <CardTitle className="font-bold text-2xl text-slate-100">
            Configuração de Condomínio
          </CardTitle>
          <CardDescription className="mt-2 text-slate-400">
            Você ainda não está associado a nenhum condomínio. Escolha uma das
            opções abaixo para começar.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-6 transition-all hover:border-slate-700">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-200">
                Criar Novo Condomínio
              </h3>
              <p className="mt-2 text-slate-400 text-sm">
                Cadastre um novo condomínio para gerenciar moradores,
                prestadores de serviços e muito mais.
              </p>
            </div>
            <Button className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700">
              Começar
            </Button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-6 transition-all hover:border-slate-700">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-200">
                Participar de um Existente
              </h3>
              <p className="mt-2 text-slate-400 text-sm">
                Insira um código de convite ou solicite acesso para fazer parte
                de um condomínio já ativo.
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-6 w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
            >
              Solicitar Acesso
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
