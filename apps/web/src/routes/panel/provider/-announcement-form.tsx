import { env } from '@neighborhood-showcase/env/web';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@neighborhood-showcase/ui/components/select';
import { Slider } from '@neighborhood-showcase/ui/components/slider';
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@neighborhood-showcase/ui/components/tooltip';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  type AnnouncementContactMode,
  AnnouncementContactSection,
  hasBaseline,
} from './-announcement-contact-section';
import {
  AnnouncementCtaSection,
  type AnnouncementCtaView,
  ctaHasIncompleteTarget,
  EMPTY_CTA_VIEW,
} from './-announcement-cta-section';
import { AnnouncementCategoryCombobox } from '@/components/announcement-category-combobox';
import { AnnouncementPriceInput } from '@/components/announcement-price-input';
import { AnnouncementTagsInput } from '@/components/announcement-tags-input';
import { PanelContentContainer } from '@/components/panel-content-container';
import { getCroppedImg } from '@/utils/crop-image';
import { trpc } from '@/utils/trpc';

/**
 * Authoring mode for the shared announcement form. `create` is the only path
 * wired in this slice (T-18-01 / ST-01); `edit` is reserved for the edit-route
 * split landed in T-18-02.
 */
export type AnnouncementFormMode = 'create' | 'edit';

export interface AnnouncementFormProps {
  /** Branches create vs edit. Defaults to `create`; edit is wired in T-18-02. */
  mode?: AnnouncementFormMode;
  /**
   * Identity of the announcement being edited. Absent in create mode; carried
   * through to the edit wiring in T-18-02.
   */
  announcementId?: string;
}

export function AnnouncementForm({
  mode = 'create',
  announcementId,
}: AnnouncementFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [contactMode, setContactMode] =
    useState<AnnouncementContactMode>('inherit');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [customCallEnabled, setCustomCallEnabled] = useState<boolean>(false);
  const [cta, setCta] = useState<AnnouncementCtaView>(EMPTY_CTA_VIEW);
  const [showVerifiedBadge, setShowVerifiedBadge] = useState<boolean>(false);

  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { data: backendCategories } = useQuery(
    trpc.announcement.listCategories.queryOptions(),
  );

  const { data: tagSuggestions } = useQuery(
    trpc.announcement.listTagSuggestions.queryOptions(),
  );

  const providerProfileQuery = useQuery(
    trpc.providerProfile.get.queryOptions(),
  );
  const providerDefaults = providerProfileQuery.data?.contactDefaults ?? null;

  const assignmentsQuery = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );
  const assignments = assignmentsQuery.data;
  const isLoadingAssignments = assignmentsQuery.isLoading;

  const approvedLocations =
    assignments?.filter((a) => a.status === 'APPROVED') || [];

  useEffect(() => {
    if (approvedLocations.length === 1 && !selectedLocationId) {
      setSelectedLocationId(approvedLocations[0].id);
    }
  }, [approvedLocations, selectedLocationId]);

  const selectedAssignment = approvedLocations.find(
    (a) => a.id === selectedLocationId,
  );
  const canVerify = selectedAssignment?.type === 'RESIDENT';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('new_announcement.toast.invalid_image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
  };

  const createMutation = useMutation(
    trpc.announcement.create.mutationOptions({
      onSuccess: () => {
        toast.success(t('new_announcement.toast.draft_created'));
        navigate({ to: '/panel/provider' });
      },
      onError: (err) => {
        toast.error(err.message || t('new_announcement.toast.create_error'));
      },
    }),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocationId) {
      toast.error(t('new_announcement.toast.select_location'));
      return;
    }
    if (!categoryId) {
      toast.error(t('new_announcement.toast.select_category'));
      return;
    }
    if (title.trim().length < 3) {
      toast.error(t('new_announcement.toast.title_too_short'));
      return;
    }
    if (description.trim().length < 10) {
      toast.error(t('new_announcement.toast.description_too_short'));
      return;
    }
    if (contactMode === 'custom') {
      if (customPhone.replace(/\D/g, '').length < 10) {
        toast.error(t('new_announcement.toast.custom_phone_invalid'));
        return;
      }
    } else if (!hasBaseline(providerDefaults)) {
      toast.error(t('new_announcement.toast.inherit_no_baseline'));
      return;
    }
    if (!imageSrc || !croppedAreaPixels) {
      toast.error(t('new_announcement.toast.image_required'));
      return;
    }
    if (ctaHasIncompleteTarget(cta)) {
      toast.error(t('new_announcement.toast.cta_incomplete'));
      return;
    }

    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      const formData = new FormData();
      formData.append('file', croppedBlob, 'cover-image.webp');
      formData.append('type', 'image');

      const uploadRes = await fetch(`${env.VITE_SERVER_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadRes.ok) {
        throw new Error(t('new_announcement.toast.upload_failed'));
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      createMutation.mutate({
        providerAssignmentId: selectedLocationId,
        title,
        subtitle: subtitle || null,
        description,
        priceCents,
        imageUrl,
        categoryId,
        tags,
        contact:
          contactMode === 'custom'
            ? {
                mode: 'custom' as const,
                custom: {
                  primaryPhone: customPhone.trim(),
                  callEnabled: customCallEnabled,
                },
              }
            : { mode: 'inherit' as const, custom: null },
        cta,
        showVerifiedBadge: showVerifiedBadge && canVerify,
      });
    } catch (error) {
      const errMessage =
        error instanceof Error
          ? error.message
          : t('new_announcement.toast.upload_or_form_error');
      toast.error(errMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PanelContentContainer variant="default">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: '/panel/provider' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
              {t('new_announcement.title')}{' '}
              <Sparkles className="h-5 w-5 text-warning" />
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('new_announcement.subtitle')}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          data-testid={`announcement-form-${mode}`}
          data-announcement-id={announcementId}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('new_announcement.details_card.title')}
                </CardTitle>
                <CardDescription>
                  {t('new_announcement.details_card.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAssignments ? (
                  <div className="space-y-2">
                    <Label>
                      {t('new_announcement.details_card.location.label')}
                    </Label>
                    <div className="h-10 w-full animate-pulse rounded bg-muted" />
                  </div>
                ) : approvedLocations.length === 0 ? (
                  <div className="space-y-2">
                    <Label>
                      {t('new_announcement.details_card.location.label')}
                    </Label>
                    <div className="rounded border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                      {t('new_announcement.details_card.location.no_approved')}
                    </div>
                  </div>
                ) : (
                  approvedLocations.length > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="location-select">
                        {t(
                          'new_announcement.details_card.location.label_required',
                        )}
                      </Label>
                      <Select
                        value={selectedLocationId}
                        onValueChange={(value) =>
                          setSelectedLocationId(value ?? '')
                        }
                      >
                        <SelectTrigger id="location-select" className="w-full">
                          <SelectValue
                            placeholder={t(
                              'new_announcement.details_card.location.placeholder',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedLocations.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.type === 'EXTERNAL'
                                ? `${t('new_announcement.details_card.location.external_prefix')} (${a.unitInfo ? `${a.unitInfo}, ` : ''}${a.number})`
                                : `${a.condominium?.name ?? t('new_announcement.details_card.location.condo_fallback')} (${a.condominium?.city ?? ''} - ${a.condominium?.state ?? ''})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                )}

                <div className="space-y-2">
                  <Label>
                    {t('new_announcement.details_card.category.label')}
                  </Label>
                  <AnnouncementCategoryCombobox
                    categories={backendCategories}
                    value={categoryId}
                    onChange={setCategoryId}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {t('new_announcement.details_card.form.title_label')}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      maxLength={100}
                      placeholder={t(
                        'new_announcement.details_card.form.title_placeholder',
                      )}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    <div className="flex justify-end text-[10px] text-muted-foreground">
                      {t('new_announcement.details_card.form.chars_count', {
                        current: title.length,
                        max: 100,
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">
                      {t('new_announcement.details_card.form.subtitle_label')}
                    </Label>
                    <Input
                      id="subtitle"
                      type="text"
                      maxLength={100}
                      placeholder={t(
                        'new_announcement.details_card.form.subtitle_placeholder',
                      )}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('new_announcement.details_card.form.description_label')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    rows={4}
                    maxLength={2000}
                    placeholder={t(
                      'new_announcement.details_card.form.description_placeholder',
                    )}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      {t(
                        'new_announcement.details_card.form.description_min_chars',
                      )}
                    </span>
                    <span>
                      {t('new_announcement.details_card.form.chars_count', {
                        current: description.length,
                        max: 2000,
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price-input">
                      {t('new_announcement.details_card.form.price_label')}
                    </Label>
                    <AnnouncementPriceInput
                      valueCents={priceCents}
                      onChange={setPriceCents}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags-input">
                      {t('new_announcement.details_card.form.tags_label')}
                    </Label>
                    <AnnouncementTagsInput
                      value={tags}
                      onChange={setTags}
                      suggestions={tagSuggestions}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <AnnouncementContactSection
              mode={contactMode}
              onModeChange={setContactMode}
              customPhone={customPhone}
              onCustomPhoneChange={setCustomPhone}
              customCallEnabled={customCallEnabled}
              onCustomCallEnabledChange={setCustomCallEnabled}
              providerDefaults={providerDefaults}
              isLoadingDefaults={providerProfileQuery.isLoading}
              onConfigureContact={() =>
                navigate({ to: '/panel/provider/configuration' })
              }
            />

            <AnnouncementCtaSection cta={cta} onChange={setCta} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('new_announcement.image_card.title')}</CardTitle>
                <CardDescription>
                  {t('new_announcement.image_card.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!imageSrc ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group mx-auto flex aspect-[4/3] w-full max-w-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border border-2 border-dashed bg-background p-6 hover:bg-card"
                  >
                    <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground transition-colors group-hover:text-primary" />
                    <p className="font-semibold text-foreground text-xs">
                      {t('new_announcement.image_card.choose')}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {t('new_announcement.image_card.format_hint')}
                    </p>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative mx-auto aspect-[4/3] w-full max-w-[220px] overflow-hidden rounded-lg border bg-background">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={4 / 3}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, croppedPixels) =>
                          setCroppedAreaPixels(croppedPixels)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <Label htmlFor="zoom-slider">Zoom</Label>
                        <span>{zoom.toFixed(1)}x</span>
                      </div>
                      <Slider
                        id="zoom-slider"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onValueChange={(value) =>
                          setZoom(Array.isArray(value) ? value[0] : value)
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImageSrc('');
                        setCroppedAreaPixels(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = '';
                      }}
                      className="w-full"
                    >
                      {t('new_announcement.image_card.change')}
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('new_announcement.trust_card.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border bg-background p-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
                      {t('new_announcement.trust_card.verified_badge_title')}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {t(
                        'new_announcement.trust_card.verified_badge_description',
                      )}
                    </p>
                  </div>
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="inline-block">
                              <Checkbox
                                id="verified-badge-toggle"
                                disabled={!canVerify}
                                checked={showVerifiedBadge}
                                onCheckedChange={(checked) =>
                                  setShowVerifiedBadge(checked === true)
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
                            {t(
                              'new_announcement.trust_card.verified_badge_tooltip',
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                {!canVerify && selectedLocationId && (
                  <p className="mt-2 text-[10px] text-warning">
                    {t(
                      'new_announcement.trust_card.verified_badge_unavailable',
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isUploading || createMutation.isPending}
                className="flex-1"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                    {t('new_announcement.submit.processing')}
                  </span>
                ) : createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                    {t('new_announcement.submit.saving')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />{' '}
                    {t('new_announcement.submit.save')}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/panel/provider' })}
                className="flex-1"
              >
                {t('new_announcement.submit.cancel')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PanelContentContainer>
  );
}
