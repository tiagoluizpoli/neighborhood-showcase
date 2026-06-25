import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useActiveProviderId } from './panel/provider/-active-provider-context';
import { ContactChannelsSection } from './panel/provider/-configuration-contact-channels-section';
import { PublicProfileSection } from './panel/provider/-configuration-public-profile-section';
import { VisibilitySection } from './panel/provider/-configuration-visibility-section';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute(
  '/panel/provider/$providerId/configuration',
)({
  component: ProviderConfigurationPage,
});

function ProviderConfigurationPage() {
  const { t } = useTranslation('configuracoes');
  const providerId = useActiveProviderId();
  const { data: session } = authClient.useSession();
  const { data: profile, isLoading } = useQuery(
    trpc.providerProfile.get.queryOptions({ providerId }),
  );

  if (isLoading || !session || !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          {t('page_title')}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {t('page_subtitle')}
        </p>
      </div>

      <PublicProfileSection profile={profile} />
      <VisibilitySection profile={profile} />
      <ContactChannelsSection profile={profile} />
    </div>
  );
}
