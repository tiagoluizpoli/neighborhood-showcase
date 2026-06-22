import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@neighborhood-showcase/ui/components/tooltip';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ProviderDashboardEditImageField } from './-provider-dashboard-edit-image-field';
import {
  type AnnouncementContactMode,
  AnnouncementContactSection,
  type ProviderContactDefaultsView,
} from './provider/-announcement-contact-section';
import {
  AnnouncementCtaSection,
  type AnnouncementCtaView,
} from './provider/-announcement-cta-section';
import { AnnouncementCategoryCombobox } from '@/components/announcement-category-combobox';
import { AnnouncementPriceInput } from '@/components/announcement-price-input';
import { AnnouncementTagsInput } from '@/components/announcement-tags-input';
import { trpc } from '@/utils/trpc';

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
  cta: AnnouncementCtaView;
  customCallEnabled: boolean;
  customPhone: string;
  description: string;
  imageUrl: string;
  isLoadingProviderDefaults: boolean;
  isUploading: boolean;
  priceCents: number | null;
  providerDefaults: ProviderContactDefaultsView | null;
  showVerifiedBadge: boolean;
  subtitle: string;
  tags: string[];
  title: string;
  onCategoryIdChange: (value: string) => void;
  onConfigureContact: () => void;
  onContactModeChange: (value: AnnouncementContactMode) => void;
  onCtaChange: (value: AnnouncementCtaView) => void;
  onCustomCallEnabledChange: (value: boolean) => void;
  onCustomPhoneChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageUrlChange: (imageUrl: string) => void;
  onPriceCentsChange: (value: number | null) => void;
  onShowVerifiedBadgeChange: (value: boolean) => void;
  onSubtitleChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
  onTitleChange: (value: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

export function ProviderDashboardEditFormFields({
  backendCategories,
  canVerify,
  categoryId,
  contactMode,
  cta,
  customCallEnabled,
  customPhone,
  description,
  imageUrl,
  isLoadingProviderDefaults,
  onCategoryIdChange,
  onConfigureContact,
  onContactModeChange,
  onCtaChange,
  onCustomCallEnabledChange,
  onCustomPhoneChange,
  onDescriptionChange,
  onImageUrlChange,
  onPriceCentsChange,
  onShowVerifiedBadgeChange,
  onSubtitleChange,
  onTagsChange,
  onTitleChange,
  onUploadingChange,
  isUploading,
  priceCents,
  providerDefaults,
  showVerifiedBadge,
  subtitle,
  tags,
  title,
}: ProviderDashboardEditFormFieldsProps) {
  const { t } = useTranslation();
  const { data: tagSuggestions } = useQuery(
    trpc.announcement.listTagSuggestions.queryOptions(),
  );

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
          <AnnouncementCategoryCombobox
            categories={backendCategories}
            value={categoryId}
            onChange={onCategoryIdChange}
          />
        </Field>
        <Field label={t('meus_anuncios.detail.form.price')}>
          <AnnouncementPriceInput
            valueCents={priceCents}
            onChange={onPriceCentsChange}
          />
        </Field>
      </div>

      <Field label={t('meus_anuncios.detail.form.tags')}>
        <AnnouncementTagsInput
          value={tags}
          onChange={onTagsChange}
          suggestions={tagSuggestions}
        />
      </Field>

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

      <AnnouncementCtaSection cta={cta} onChange={onCtaChange} />

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
