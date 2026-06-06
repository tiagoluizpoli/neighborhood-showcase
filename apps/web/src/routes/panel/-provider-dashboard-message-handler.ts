import { toast } from 'sonner';

interface ProviderDashboardMessageHandlerOptions {
  message?: string;
  navigate: (options: { replace?: boolean; to: string }) => void;
}

export function handleProviderDashboardMessage({
  message,
  navigate,
}: ProviderDashboardMessageHandlerOptions) {
  if (!message) return;

  toast.error(message);
  navigate({
    to: '/panel/dashboard',
    replace: true,
  });
}
