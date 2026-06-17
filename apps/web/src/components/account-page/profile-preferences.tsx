import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@neighborhood-showcase/ui/components/select';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageUploadField } from '@/components/image-upload-field';

export type AccountLanguage = 'pt-BR' | 'en';
export type AccountTheme = 'system' | 'light' | 'dark';

export interface AccountProfileSectionProps {
  email: string;
  emailVerified: boolean;
  image: string;
  isPending: boolean;
  name: string;
  phone: string;
  onImageChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export interface AccountPreferencesSectionProps {
  isPending: boolean;
  language: AccountLanguage;
  theme: AccountTheme;
  onLanguageChange: (value: AccountLanguage) => void;
  onSave: () => void;
  onThemeChange: (value: AccountTheme) => void;
}

export function AccountProfileSection({
  email,
  emailVerified,
  image,
  isPending,
  name,
  phone,
  onImageChange,
  onNameChange,
  onPhoneChange,
  onSubmit,
}: AccountProfileSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.section_profile')}</CardTitle>
        <CardDescription>{t('account.section_profile_help')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <ImageUploadField
            aspectRatio={1}
            circular
            helpText={t('account.field_avatar_help')}
            label={t('account.field_avatar')}
            onChange={onImageChange}
            value={image}
          />
          <div className="space-y-2">
            <Label htmlFor="account-name">
              {t('account.field_displayName')}
            </Label>
            <Input
              id="account-name"
              data-testid="account-name-input"
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={t('account.field_displayName_placeholder')}
              value={name}
            />
            <p className="text-muted-foreground text-xs">
              {t('account.field_displayName_help')}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-phone">{t('account.field_phone')}</Label>
            <Input
              id="account-phone"
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder={t('account.field_phone_placeholder')}
              value={phone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-email">{t('account.field_email')}</Label>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                className="bg-muted md:flex-1"
                disabled
                id="account-email"
                value={email}
              />
              {emailVerified ? (
                <span
                  className="flex items-center gap-1 font-medium text-emerald-600 text-sm"
                  data-testid="account-email-status-verified"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t('account.email_verified')}
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 font-medium text-amber-500 text-sm"
                  data-testid="account-email-status-pending"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {t('account.email_pending')}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {t('account.field_email_help')}
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              data-testid="account-profile-save"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('account.button_save_changes')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AccountPreferencesSection({
  isPending,
  language,
  theme,
  onLanguageChange,
  onSave,
  onThemeChange,
}: AccountPreferencesSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.section_preferences')}</CardTitle>
        <CardDescription>
          {t('account.section_preferences_help')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t('account.preference_language')}</Label>
          <Select
            value={language}
            onValueChange={(value) =>
              onLanguageChange(value as AccountLanguage)
            }
          >
            <SelectTrigger className="w-full md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">
                {t('account.preference_language_pt')}
              </SelectItem>
              <SelectItem value="en">
                {t('account.preference_language_en')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('account.preference_theme')}</Label>
          <div className="flex flex-wrap gap-2">
            {(['system', 'light', 'dark'] as const).map((option) => (
              <Button
                key={option}
                data-testid={`account-theme-${option}`}
                onClick={() => onThemeChange(option)}
                type="button"
                variant={theme === option ? 'default' : 'outline'}
              >
                {t(`account.preference_theme_${option}`)}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            data-testid="account-preferences-save"
            disabled={isPending}
            onClick={onSave}
            type="button"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t('account.button_save_changes')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
