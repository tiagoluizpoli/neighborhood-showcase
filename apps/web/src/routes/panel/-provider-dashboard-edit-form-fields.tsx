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

interface ProviderDashboardEditFormFieldsProps {
  backendCategories:
    | Array<{
        id: string;
        name: string;
      }>
    | undefined;
  canVerify: boolean;
  categoryId: string;
  description: string;
  imageUrl: string;
  instagram: string;
  isUploading: boolean;
  price: number | '';
  showVerifiedBadge: boolean;
  subtitle: string;
  title: string;
  website: string;
  whatsapp: string;
  onCategoryIdChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageUrlChange: (imageUrl: string) => void;
  onInstagramChange: (value: string) => void;
  onPriceChange: (value: number | '') => void;
  onShowVerifiedBadgeChange: (value: boolean) => void;
  onSubtitleChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
  onWebsiteChange: (value: string) => void;
  onWhatsappChange: (value: string) => void;
}

export function ProviderDashboardEditFormFields({
  backendCategories,
  canVerify,
  categoryId,
  description,
  imageUrl,
  instagram,
  onCategoryIdChange,
  onDescriptionChange,
  onImageUrlChange,
  onInstagramChange,
  onPriceChange,
  onShowVerifiedBadgeChange,
  onSubtitleChange,
  onTitleChange,
  onUploadingChange,
  onWebsiteChange,
  onWhatsappChange,
  isUploading,
  price,
  showVerifiedBadge,
  subtitle,
  title,
  website,
  whatsapp,
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
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('meus_anuncios.detail.form.title_placeholder')}
          />
        </Field>
        <Field label={t('meus_anuncios.detail.form.subtitle')}>
          <Input
            type="text"
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
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('meus_anuncios.detail.form.description_placeholder')}
          className="resize-none"
        />
      </Field>

      <div className="space-y-3">
        <h4 className="font-semibold text-foreground text-sm">
          {t('meus_anuncios.detail.form.contact_title')}
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label={t('meus_anuncios.detail.contact_labels.whatsapp')}
            subtle
          >
            <Input
              type="text"
              value={whatsapp}
              onChange={(e) => onWhatsappChange(e.target.value)}
              placeholder={t('meus_anuncios.detail.form.whatsapp_placeholder')}
            />
          </Field>
          <Field
            label={t('meus_anuncios.detail.contact_labels.instagram')}
            subtle
          >
            <Input
              type="text"
              value={instagram}
              onChange={(e) => onInstagramChange(e.target.value)}
              placeholder={t('meus_anuncios.detail.form.instagram_placeholder')}
            />
          </Field>
          <Field
            label={t('meus_anuncios.detail.contact_labels.website')}
            subtle
          >
            <Input
              type="url"
              value={website}
              onChange={(e) => onWebsiteChange(e.target.value)}
              placeholder={t('meus_anuncios.detail.form.website_placeholder')}
            />
          </Field>
        </div>
      </div>

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
    <div className="space-y-1.5">
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
