import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ImageUploadField } from '@/components/image-upload-field';
import type { RouterOutputs } from '@/utils/trpc';
import { trpc } from '@/utils/trpc';

type ProviderProfileData = RouterOutputs['providerProfile']['get'];

interface PublicProfileSectionProps {
  profile: ProviderProfileData;
}

const MAX_DESCRIPTION_CHARS = 500;

export function PublicProfileSection({ profile }: PublicProfileSectionProps) {
  const { t } = useTranslation('configuracoes');

  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [companyName, setCompanyName] = useState(profile.companyName ?? '');
  const [tradeName, setTradeName] = useState(profile.tradeName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl ?? '');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? '');
  const [publicDescription, setPublicDescription] = useState(
    profile.publicDescription ?? '',
  );

  const updateMutation = useMutation(
    trpc.providerProfile.update.mutationOptions({
      onSuccess: () => {
        toast.success(t('toast_success_public_profile'));
      },
      onError: (err) => {
        toast.error(err.message || t('toast_error_generic'));
      },
    }),
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      displayName: displayName.trim() || undefined,
      companyName: companyName.trim() || undefined,
      tradeName: tradeName.trim() || undefined,
      avatarUrl: avatarUrl || null,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      publicDescription: publicDescription.trim() || null,
    });
  };

  const remaining = MAX_DESCRIPTION_CHARS - publicDescription.length;

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>{t('section_public_profile')}</CardTitle>
        <CardDescription>{t('section_public_profile_help')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('field_displayName')}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('field_displayName_placeholder')}
                className="h-10"
                maxLength={100}
              />
              <p className="text-muted-foreground text-xs">
                {t('field_displayName_help')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">{t('field_companyName')}</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('field_companyName_placeholder')}
                className="h-10"
                maxLength={100}
              />
              <p className="text-muted-foreground text-xs">
                {t('field_companyName_help')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeName">{t('field_tradeName')}</Label>
            <Input
              id="tradeName"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder={t('field_tradeName_placeholder')}
              className="h-10"
              maxLength={100}
            />
            <p className="text-muted-foreground text-xs">
              {t('field_tradeName_help')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ImageUploadField
              label={t('field_avatarUrl')}
              helpText={t('field_avatarUrl_help')}
              value={avatarUrl}
              onChange={setAvatarUrl}
              aspectRatio={1}
              urlInput={false}
              circular={true}
            />
            <ImageUploadField
              label={t('field_logoUrl')}
              helpText={t('field_logoUrl_help')}
              value={logoUrl}
              onChange={setLogoUrl}
              aspectRatio={1}
              urlInput={true}
            />
            <ImageUploadField
              label={t('field_bannerUrl')}
              helpText={t('field_bannerUrl_help')}
              value={bannerUrl}
              onChange={setBannerUrl}
              aspectRatio={16 / 9}
              urlInput={true}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="publicDescription">
                {t('field_publicDescription')}
              </Label>
              <span
                className={`text-xs ${
                  remaining < 50
                    ? remaining < 20
                      ? 'text-destructive'
                      : 'text-warning'
                    : 'text-muted-foreground'
                }`}
              >
                {remaining} {t('field_publicDescription_counter_suffix')}
              </span>
            </div>
            <Textarea
              id="publicDescription"
              value={publicDescription}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESCRIPTION_CHARS) {
                  setPublicDescription(e.target.value);
                }
              }}
              placeholder={t('field_publicDescription_placeholder')}
              className="min-h-[100px] resize-y"
              maxLength={MAX_DESCRIPTION_CHARS}
            />
            <p className="text-muted-foreground text-xs">
              {t('field_publicDescription_help')}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('button_save')}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
