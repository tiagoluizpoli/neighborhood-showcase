import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProviderDashboardShellBoundaryProps {
  dashboardQuery: {
    data?: unknown;
    isError: boolean;
    isLoading: boolean;
  };
  renderContent: () => ReactNode;
}

export function ProviderDashboardShellBoundary({
  dashboardQuery,
  renderContent,
}: ProviderDashboardShellBoundaryProps) {
  if (dashboardQuery.isLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">
          Carregando painel do provedor...
        </p>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="font-semibold text-foreground text-xl">
          Erro ao carregar dados
        </h2>
        <p className="max-w-md text-muted-foreground">
          Não foi possível carregar as informações do seu painel. Por favor,
          tente novamente mais tarde.
        </p>
      </div>
    );
  }

  if (!dashboardQuery.data) {
    return null;
  }

  return renderContent();
}
