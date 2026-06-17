import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard/announcements')({
  component: AnnouncementsGuard,
});

function AnnouncementsGuard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: assignments, isLoading } = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );

  const hasEnabledProviderAssignment = assignments?.some(
    (a) => a.type === 'RESIDENT' && a.status === 'APPROVED',
  );

  useEffect(() => {
    if (!isLoading && assignments && !hasEnabledProviderAssignment) {
      toast.error(t('meus_anuncios.toast_error_no_provider_account'));
      navigate({ to: '/panel/account' });
    }
  }, [isLoading, assignments, hasEnabledProviderAssignment, navigate, t]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasEnabledProviderAssignment) {
    return null;
  }

  return <Outlet />;
}
