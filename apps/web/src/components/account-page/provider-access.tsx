import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { ArrowRight, Loader2, Settings, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AccountProviderAccessSectionProps {
  isLoading: boolean;
  providerEnabled: boolean;
  onOpenActivation: () => void;
  onOpenProviderSettings: () => void;
}

export function AccountProviderAccessSection({
  isLoading,
  providerEnabled,
  onOpenActivation,
  onOpenProviderSettings,
}: AccountProviderAccessSectionProps) {
  const { t } = useTranslation();

  return (
    <Card data-testid="account-provider-access-card">
      <CardHeader>
        <CardTitle>{t('account.section_provider_access')}</CardTitle>
        <CardDescription>
          {t('account.section_provider_access_help')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('account.provider_access_loading')}</span>
          </div>
        ) : providerEnabled ? (
          <ProviderEnabledState
            onOpenProviderSettings={onOpenProviderSettings}
          />
        ) : (
          <ProviderDisabledState onOpenActivation={onOpenActivation} />
        )}
      </CardContent>
    </Card>
  );
}

interface ProviderEnabledStateProps {
  onOpenProviderSettings: () => void;
}

function ProviderEnabledState({
  onOpenProviderSettings,
}: ProviderEnabledStateProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="font-medium text-foreground text-sm">
          {t('account.provider_access_enabled_title')}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t('account.provider_access_enabled_description')}
        </p>
      </div>
      <Button
        className="w-full justify-between"
        data-testid="account-provider-access-manage"
        onClick={onOpenProviderSettings}
        type="button"
      >
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {t('account.provider_access_manage_cta')}
        </span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ProviderDisabledStateProps {
  onOpenActivation: () => void;
}

function ProviderDisabledState({
  onOpenActivation,
}: ProviderDisabledStateProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="font-medium text-foreground text-sm">
          {t('account.provider_access_disabled_title')}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t('account.provider_access_disabled_description')}
        </p>
      </div>
      <Button
        className="w-full justify-between"
        data-testid="account-provider-access-activate"
        onClick={onOpenActivation}
        type="button"
        variant="outline"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {t('account.provider_access_activate_cta')}
        </span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
