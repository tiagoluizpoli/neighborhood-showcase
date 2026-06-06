import { createFileRoute } from '@tanstack/react-router';
import { ProviderDashboardPaymentFlow } from './panel/-provider-dashboard-payment-flow';

export const Route = createFileRoute('/panel/dashboard/anuncios/$id/pagamento')(
  {
    component: PaymentRouteComponent,
  },
);

function PaymentRouteComponent() {
  const { id } = Route.useParams();

  return <ProviderDashboardPaymentFlow announcementId={id} />;
}
