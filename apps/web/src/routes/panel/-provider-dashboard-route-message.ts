import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { handleProviderDashboardMessage } from './-provider-dashboard-message-handler';

export function useProviderDashboardRouteMessage(message: string | undefined) {
  const navigate = useNavigate();

  useEffect(() => {
    handleProviderDashboardMessage({ message, navigate });
  }, [message, navigate]);
}
