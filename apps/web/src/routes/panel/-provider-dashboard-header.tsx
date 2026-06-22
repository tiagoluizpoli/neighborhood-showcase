import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

interface ProviderDashboardHeaderProps {
  displayName?: string | null;
}

export function ProviderDashboardHeader({
  displayName,
}: ProviderDashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Painel do Provedor
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Bem-vindo de volta,{' '}
          <span className="font-medium text-foreground">
            {displayName ?? 'Provedor'}
          </span>
          . Gerencie seus anúncios e analise suas conversões.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/provider/announcements/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Criar Anúncio
        </Link>
      </div>
    </div>
  );
}
