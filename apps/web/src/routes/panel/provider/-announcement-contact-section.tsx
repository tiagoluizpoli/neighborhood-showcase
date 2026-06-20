import { Badge } from '@neighborhood-showcase/ui/components/badge';
import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { Phone, Settings, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type AnnouncementContactMode = 'inherit' | 'custom';

export interface ProviderContactDefaultsView {
  primaryPhone: string;
  callEnabled: boolean;
}

interface AnnouncementContactSectionProps {
  mode: AnnouncementContactMode;
  onModeChange: (mode: AnnouncementContactMode) => void;
  customPhone: string;
  onCustomPhoneChange: (value: string) => void;
  customCallEnabled: boolean;
  onCustomCallEnabledChange: (value: boolean) => void;
  providerDefaults: ProviderContactDefaultsView | null;
  isLoadingDefaults: boolean;
  onConfigureContact: () => void;
}

function countDigits(value: string): number {
  return value.replace(/\D/g, '').length;
}

export function hasBaseline(
  defaults: ProviderContactDefaultsView | null,
): defaults is ProviderContactDefaultsView {
  return defaults !== null && countDigits(defaults.primaryPhone) >= 10;
}

export function AnnouncementContactSection({
  mode,
  onModeChange,
  customPhone,
  onCustomPhoneChange,
  customCallEnabled,
  onCustomCallEnabledChange,
  providerDefaults,
  isLoadingDefaults,
  onConfigureContact,
}: AnnouncementContactSectionProps) {
  const { t } = useTranslation();
  const baselineReady = hasBaseline(providerDefaults);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{t('new_announcement.contact_card.title')}</CardTitle>
          {mode === 'inherit' ? (
            <Badge
              variant="secondary"
              className="gap-1"
              data-testid="contact-mode-inherit-badge"
            >
              <Sparkles className="h-3 w-3" />
              {t('new_announcement.contact_card.mode_inherit_badge')}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1"
              data-testid="contact-mode-custom-badge"
            >
              {t('new_announcement.contact_card.mode_custom_badge')}
            </Badge>
          )}
        </div>
        <CardDescription>
          {mode === 'inherit'
            ? t('new_announcement.contact_card.inherit_description')
            : t('new_announcement.contact_card.custom_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'inherit' ? (
          <div className="space-y-4">
            {isLoadingDefaults ? (
              <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
            ) : baselineReady ? (
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  {providerDefaults.primaryPhone}
                </div>
                <p className="mt-1 text-muted-foreground text-xs">
                  {providerDefaults.callEnabled
                    ? t('new_announcement.contact_card.calls_on')
                    : t('new_announcement.contact_card.calls_off')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/10 p-4">
                <p className="text-sm text-warning">
                  {t('new_announcement.contact_card.no_baseline_warning')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onConfigureContact}
                  className="gap-1.5"
                >
                  <Settings className="h-4 w-4" />
                  {t('new_announcement.contact_card.configure_link')}
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('custom')}
              className="px-0 text-primary"
              data-testid="contact-customize-button"
            >
              {t('new_announcement.contact_card.customize_button')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-contact-phone">
                {t('new_announcement.contact_card.custom_phone_label')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="custom-contact-phone"
                type="tel"
                value={customPhone}
                onChange={(e) => onCustomPhoneChange(e.target.value)}
                placeholder={t(
                  'new_announcement.contact_card.custom_phone_placeholder',
                )}
                data-testid="contact-custom-phone"
              />
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="custom-contact-call"
                checked={customCallEnabled}
                disabled={!customPhone.trim()}
                onCheckedChange={(checked) =>
                  onCustomCallEnabledChange(checked === true)
                }
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="custom-contact-call">
                  {t('new_announcement.contact_card.custom_call_label')}
                </Label>
                <p className="text-muted-foreground text-xs">
                  {t('new_announcement.contact_card.custom_call_help')}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onModeChange('inherit')}
              className="px-0 text-primary"
              data-testid="contact-use-defaults-button"
            >
              {t('new_announcement.contact_card.use_defaults_button')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
