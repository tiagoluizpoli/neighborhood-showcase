import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUserAccessProfile } from '@/routes/panel/-user-access-profile';

export const Route = createFileRoute('/panel/dashboard/announcements')({
  component: AnnouncementsGuard,
});

function AnnouncementsGuard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accessProfileQuery = useUserAccessProfile();

  useEffect(() => {
    if (
      !accessProfileQuery.isLoading &&
      accessProfileQuery.data &&
      !accessProfileQuery.data.providerEnabled
    ) {
      toast.error(t('meus_anuncios.toast_error_no_provider_account'));
      navigate({ to: '/panel/account' });
    }
  }, [accessProfileQuery.data, accessProfileQuery.isLoading, navigate, t]);

  if (accessProfileQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!accessProfileQuery.data?.providerEnabled) {
    return null;
  }

  return <Outlet />;
}
