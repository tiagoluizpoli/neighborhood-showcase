import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@neighborhood-showcase/ui/components/dropdown-menu';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import { useMutation } from '@tanstack/react-query';
import { Crop, ImageUp, Loader2, Pencil, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  BANNER_ASPECT,
  ProviderIdentityHero,
} from '@/components/provider-identity-hero';
import { type UseImageCrop, useImageCrop } from '@/hooks/use-image-crop';
import type { RouterOutputs } from '@/utils/trpc';
import { trpc } from '@/utils/trpc';

type ProviderProfileData = RouterOutputs['providerProfile']['get'];

interface PublicProfileSectionProps {
  profile: ProviderProfileData;
}

const MAX_DESCRIPTION_CHARS = 500;

/** Hover-revealed pencil → Replace / Re-crop / Remove menu over a hero image. */
function ImageEditMenu({
  crop,
  hasValue,
  reveal,
  position,
}: {
  crop: UseImageCrop;
  hasValue: boolean;
  reveal: string;
  position: string;
}) {
  const { t } = useTranslation('configuracoes');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('image_edit_label')}
        className={`absolute ${position} ${reveal} z-10 inline-flex items-center justify-center rounded-full border border-border bg-background/90 p-1.5 text-foreground shadow-sm backdrop-blur transition hover:bg-background focus-visible:opacity-100 data-[popup-open]:opacity-100`}
      >
        <Pencil className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => crop.triggerReplace()}>
          <ImageUp className="mr-2 h-4 w-4" />
          {hasValue ? t('image_upload_replace') : t('button_upload')}
        </DropdownMenuItem>
        {hasValue ? (
          <DropdownMenuItem onClick={() => crop.triggerRecrop()}>
            <Crop className="mr-2 h-4 w-4" />
            {t('image_upload_recrop')}
          </DropdownMenuItem>
        ) : null}
        {hasValue ? (
          <DropdownMenuItem variant="destructive" onClick={() => crop.remove()}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('button_remove')}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicProfileSection({ profile }: PublicProfileSectionProps) {
  const { t } = useTranslation('configuracoes');

  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [companyName, setCompanyName] = useState(profile.companyName ?? '');
  const [tradeName, setTradeName] = useState(profile.tradeName ?? '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl ?? '');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? '');
  const [logoOriginalUrl, setLogoOriginalUrl] = useState(
    profile.logoOriginalUrl ?? '',
  );
  const [bannerOriginalUrl, setBannerOriginalUrl] = useState(
    profile.bannerOriginalUrl ?? '',
  );
  const [publicDescription, setPublicDescription] = useState(
    profile.publicDescription ?? '',
  );

  const logoCrop = useImageCrop({
    value: logoUrl,
    onChange: setLogoUrl,
    originalValue: logoOriginalUrl,
    onOriginalChange: setLogoOriginalUrl,
    aspect: 1,
  });
  const bannerCrop = useImageCrop({
    value: bannerUrl,
    onChange: setBannerUrl,
    originalValue: bannerOriginalUrl,
    onOriginalChange: setBannerOriginalUrl,
    aspect: BANNER_ASPECT,
  });

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
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      logoOriginalUrl: logoOriginalUrl || null,
      bannerOriginalUrl: bannerOriginalUrl || null,
      publicDescription: publicDescription.trim() || null,
    });
  };

  const remaining = MAX_DESCRIPTION_CHARS - publicDescription.length;
  const previewName = displayName || tradeName || companyName || '';
  const identityLine = [companyName, tradeName].filter(Boolean).join(' · ');

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>{t('section_public_profile')}</CardTitle>
        <CardDescription>{t('section_public_profile_help')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Editable live preview — exactly what the public page shows. */}
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {t('identity_preview_label')}
            </p>
            <ProviderIdentityHero
              testId="identity-preview"
              bannerUrl={bannerUrl || null}
              logoUrl={logoUrl || null}
              name={previewName}
              namePlaceholder={t('field_displayName_placeholder')}
              identityLine={identityLine || null}
              description={publicDescription || null}
              bannerEdit={
                <ImageEditMenu
                  crop={bannerCrop}
                  hasValue={Boolean(bannerUrl)}
                  position="top-2 right-2"
                  reveal="opacity-0 group-hover/banner:opacity-100"
                />
              }
              logoEdit={
                <ImageEditMenu
                  crop={logoCrop}
                  hasValue={Boolean(logoUrl)}
                  position="right-0 bottom-0"
                  reveal="opacity-0 group-hover/logo:opacity-100"
                />
              }
            />
          </div>

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

      {logoCrop.fileInput}
      {bannerCrop.fileInput}
      {logoCrop.modal}
      {bannerCrop.modal}
    </Card>
  );
}
