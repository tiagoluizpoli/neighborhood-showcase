import { toast } from 'sonner';

interface ProviderDashboardRenewActionsOptions {
  navigate: (options: { to: string }) => void;
}

export function createProviderDashboardRenewActions({
  navigate,
}: ProviderDashboardRenewActionsOptions) {
  return {
    onSuccess(announcementId: string) {
      toast.success('Intenção de pagamento gerada. Redirecionando...');
      navigate({
        to: `/panel/dashboard/anuncios/${announcementId}/pagamento`,
      });
    },
    onError(message: string | undefined) {
      toast.error(message || 'Erro ao gerar intenção de pagamento.');
    },
  };
}
