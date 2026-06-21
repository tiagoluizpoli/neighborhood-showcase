import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@neighborhood-showcase/ui/components/tooltip';
import { useTranslation } from 'react-i18next';
import { ProviderDashboardEditImageField } from './-provider-dashboard-edit-image-field';
import {
  type AnnouncementContactMode,
  AnnouncementContactSection,
  type ProviderContactDefaultsView,
} from './provider/-announcement-contact-section';

interface ProviderDashboardEditFormFieldsProps {
  backendCategories:
    | Array<{
        id: string;
        name: string;
      }>
    | undefined;
  canVerify: boolean;
  categoryId: string;
  contactMode: AnnouncementContactMode;
  customCallEnabled: boolean;
  customPhone: string;
  description: string;
  imageUrl: string;
  isLoadingProviderDefaults: boolean;
  isUploading: boolean;
  price: number | '';
  providerDefaults: ProviderContactDefaultsView | null;
  showVerifiedBadge: boolean;
  subtitle: string;
  title: string;
  onCategoryIdChange: (value: string) => void;
  onConfigureContact: () => void;
  onContactModeChange: (value: AnnouncementContactMode) => void;
  onCustomCallEnabledChange: (value: boolean) => void;
  onCustomPhoneChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageUrlChange: (imageUrl: string) => void;
  onPriceChange: (value: number | '') => void;
  onShowVerifiedBadgeChange: (value: boolean) => void;
  onSubtitleChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

export function ProviderDashboardEditFormFields({
  backendCategories,
  canVerify,
  categoryId,
  contactMode,
  customCallEnabled,
  customPhone,
  description,
  imageUrl,
  isLoadingProviderDefaults,
  onCategoryIdChange,
  onConfigureContact,
  onContactModeChange,
  onCustomCallEnabledChange,
  onCustomPhoneChange,
  onDescriptionChange,
  onImageUrlChange,
  onPriceChange,
  onShowVerifiedBadgeChange,
  onSubtitleChange,
  onTitleChange,
  onUploadingChange,
  isUploading,
  price,
  providerDefaults,
  showVerifiedBadge,
  subtitle,
  title,
}: ProviderDashboardEditFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ProviderDashboardEditImageField
        imageUrl={imageUrl}
        onImageUrlChange={onImageUrlChange}
        onUploadingChange={onUploadingChange}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('meus_anuncios.detail.form.title')}>
          <Input
            type="text"
            required
            aria-label={t('meus_anuncios.detail.form.title')}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('meus_anuncios.detail.form.title_placeholder')}
          />
        </Field>
        <Field label={t('meus_anuncios.detail.form.subtitle')}>
          <Input
            type="text"
            aria-label={t('meus_anuncios.detail.form.subtitle')}
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder={t('meus_anuncios.detail.form.subtitle_placeholder')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('meus_anuncios.detail.form.category')}>
          <select
            required
            aria-label={t('meus_anuncios.detail.form.category')}
            value={categoryId}
            onChange={(e) => onCategoryIdChange(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {backendCategories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('meus_anuncios.detail.form.price')}>
          <Input
            type="number"
            step="0.01"
            min="0"
            aria-label={t('meus_anuncios.detail.form.price')}
            value={price}
            onChange={(e) =>
              onPriceChange(e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder={t('meus_anuncios.detail.form.price_placeholder')}
          />
        </Field>
      </div>

      <Field label={t('meus_anuncios.detail.form.description')}>
        <Textarea
          required
          rows={4}
          aria-label={t('meus_anuncios.detail.form.description')}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('meus_anuncios.detail.form.description_placeholder')}
          className="resize-none"
        />
      </Field>

      <AnnouncementContactSection
        mode={contactMode}
        onModeChange={onContactModeChange}
        customPhone={customPhone}
        onCustomPhoneChange={onCustomPhoneChange}
        customCallEnabled={customCallEnabled}
        onCustomCallEnabledChange={onCustomCallEnabledChange}
        providerDefaults={providerDefaults}
        isLoadingDefaults={isLoadingProviderDefaults}
        onConfigureContact={onConfigureContact}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
          <div className="space-y-0.5">
            <span className="block font-semibold text-foreground text-sm">
              {t('meus_anuncios.detail.form.verified_badge_title')}
            </span>
            <span className="text-muted-foreground text-xs">
              {t('meus_anuncios.detail.form.verified_badge_hint')}
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-block">
                    <Checkbox
                      disabled={!canVerify || isUploading}
                      checked={showVerifiedBadge && canVerify}
                      onCheckedChange={(checked) =>
                        onShowVerifiedBadgeChange(checked === true)
                      }
                    />
                  </span>
                }
              />
              {!canVerify && (
                <TooltipContent
                  side="top"
                  align="center"
                  className="max-w-xs p-2 text-center"
                >
                  {t('meus_anuncios.detail.form.verified_badge_disabled')}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        {!canVerify && (
          <p className="px-1 text-[10px] text-warning">
            {t('meus_anuncios.detail.form.verified_badge_disabled')}
          </p>
        )}
      </div>
    </>
  );
}

function Field({
  children,
  label,
  subtle = false,
}: {
  children: React.ReactNode;
  label: string;
  subtle?: boolean;
}) {
  return (
    <div className="block space-y-1.5">
      <span
        className={
          subtle
            ? 'block text-muted-foreground text-xs'
            : 'block font-medium text-foreground text-sm'
        }
      >
        {label}
      </span>
      {children}
    </div>
  );
}
