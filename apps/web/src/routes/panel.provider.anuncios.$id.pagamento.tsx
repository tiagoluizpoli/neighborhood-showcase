import { createFileRoute } from '@tanstack/react-router';
import { ProviderDashboardPaymentFlow } from './panel/-provider-dashboard-payment-flow';
import { PanelContentContainer } from '@/components/panel-content-container';

export const Route = createFileRoute('/panel/provider/anuncios/$id/pagamento')({
  component: PaymentRouteComponent,
});

function PaymentRouteComponent() {
  const { id } = Route.useParams();

  return (
    <PanelContentContainer variant="default">
      <ProviderDashboardPaymentFlow announcementId={id} />
    </PanelContentContainer>
  );
}
