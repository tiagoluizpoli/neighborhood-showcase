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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ProviderDashboardAnnouncementItem } from '../-provider-dashboard-types';
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
  withCtaIds,
} from './-announcement-cta-section';
import { AnnouncementCategoryCombobox } from '@/components/announcement-category-combobox';
import { AnnouncementPriceInput } from '@/components/announcement-price-input';
import { AnnouncementTagsInput } from '@/components/announcement-tags-input';
import { PanelContentContainer } from '@/components/panel-content-container';
import { getCroppedImg } from '@/utils/crop-image';
import { trpc } from '@/utils/trpc';

/**
 * Authoring mode for the shared announcement form. `create` submits via
 * `announcement.create`; `edit` fetches the announcement by id, prefills every
 * field, and submits via `announcement.update` carrying the id (T-18-02).
 */
export type AnnouncementFormMode = 'create' | 'edit';

/**
 * Per-field lockability seam (T-18-01 / ST-02). Every authorable field maps to a
 * policy so a specific field can be frozen later by flipping a single entry,
 * with no structural change to how fields render. Identity fields (`id`) are
 * non-editable; for MVP every other field — including `category` — stays
 * editable.
 */
export type AnnouncementFieldKey =
  | 'id'
  | 'location'
  | 'category'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'price'
  | 'tags'
  | 'contact'
  | 'cta'
  | 'image'
  | 'verifiedBadge';

export interface AnnouncementFieldPolicy {
  /** When false, the field renders disabled / non-editable in the form. */
  editable: boolean;
}

export type AnnouncementFieldPolicyMap = Record<
  AnnouncementFieldKey,
  AnnouncementFieldPolicy
>;

const EDITABLE_FIELD: AnnouncementFieldPolicy = { editable: true };
const LOCKED_FIELD: AnnouncementFieldPolicy = { editable: false };

/**
 * Default per-field policy for a given authoring mode. Identity is always
 * locked; all other fields are editable in both create and edit for MVP.
 * Freezing one more field later is a single-entry change in this map.
 */
export function resolveAnnouncementFieldPolicy(
  _mode: AnnouncementFormMode,
): AnnouncementFieldPolicyMap {
  return {
    id: LOCKED_FIELD,
    location: EDITABLE_FIELD,
    category: EDITABLE_FIELD,
    title: EDITABLE_FIELD,
    subtitle: EDITABLE_FIELD,
    description: EDITABLE_FIELD,
    price: EDITABLE_FIELD,
    tags: EDITABLE_FIELD,
    contact: EDITABLE_FIELD,
    cta: EDITABLE_FIELD,
    image: EDITABLE_FIELD,
    verifiedBadge: EDITABLE_FIELD,
  };
}

export interface AnnouncementFormProps {
  /** Branches create vs edit. Defaults to `create`. */
  mode?: AnnouncementFormMode;
  /**
   * Identity of the announcement being edited. Required in edit mode (used to
   * fetch/prefill and to carry the id on `update`); absent in create mode.
   */
  announcementId?: string;
  /**
   * Optional override of the per-field lockability policy. Defaults to
   * `resolveAnnouncementFieldPolicy(mode)`. Frozen fields render disabled.
   */
  fieldPolicy?: AnnouncementFieldPolicyMap;
}

export function AnnouncementForm({
  mode = 'create',
  announcementId,
  fieldPolicy,
}: AnnouncementFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = mode === 'edit';
  const policy = fieldPolicy ?? resolveAnnouncementFieldPolicy(mode);

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
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
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

  const dashboardQuery = useQuery(
    trpc.announcement.getDashboardData.queryOptions(undefined, {
      enabled: isEditMode,
    }),
  );

  const editingAnnouncement =
    useMemo<ProviderDashboardAnnouncementItem | null>(() => {
      if (!isEditMode || !announcementId) return null;
      return (
        flattenDashboardAnnouncements(dashboardQuery.data?.announcements).find(
          (item) => item.id === announcementId,
        ) ?? null
      );
    }, [isEditMode, announcementId, dashboardQuery.data]);

  const prefilledRef = useRef<boolean>(false);
  useEffect(() => {
    if (!editingAnnouncement || prefilledRef.current) return;
    prefilledRef.current = true;
    setSelectedLocationId(editingAnnouncement.providerAssignmentId ?? '');
    setCategoryId(editingAnnouncement.categoryId);
    setTitle(editingAnnouncement.title);
    setSubtitle(editingAnnouncement.subtitle ?? '');
    setDescription(editingAnnouncement.description);
    setPriceCents(editingAnnouncement.priceCents ?? null);
    setTags(editingAnnouncement.tags);
    setContactMode(editingAnnouncement.contact.mode);
    setCustomPhone(editingAnnouncement.contact.custom?.primaryPhone ?? '');
    setCustomCallEnabled(
      editingAnnouncement.contact.custom?.callEnabled ?? false,
    );
    setCta(withCtaIds(editingAnnouncement.cta));
    setShowVerifiedBadge(editingAnnouncement.showVerifiedBadge);
    setExistingImageUrl(editingAnnouncement.imageUrl);
  }, [editingAnnouncement]);

  useEffect(() => {
    if (
      isEditMode &&
      !dashboardQuery.isLoading &&
      dashboardQuery.data &&
      !editingAnnouncement
    ) {
      toast.error(t('meus_anuncios.detail.not_found_toast'));
      void navigate({ to: '/panel/provider/announcements' });
    }
  }, [
    isEditMode,
    dashboardQuery.isLoading,
    dashboardQuery.data,
    editingAnnouncement,
    navigate,
    t,
  ]);

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

  const updateMutation = useMutation(
    trpc.announcement.update.mutationOptions({
      onSuccess: () => {
        toast.success(t('meus_anuncios.detail.update_success'));
        void queryClient.invalidateQueries({
          queryKey: trpc.announcement.getDashboardData.queryKey(),
        });
        if (announcementId) {
          navigate({
            to: '/panel/provider/announcements/$id',
            params: { id: announcementId },
          });
        }
      },
      onError: (err) => {
        toast.error(err.message || t('meus_anuncios.detail.update_error'));
      },
    }),
  );

  const isSubmitting =
    isUploading || createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && !selectedLocationId) {
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
    const hasNewImage = Boolean(imageSrc && croppedAreaPixels);
    if (!hasNewImage && !(isEditMode && existingImageUrl)) {
      toast.error(t('new_announcement.toast.image_required'));
      return;
    }
    if (ctaHasIncompleteTarget(cta)) {
      toast.error(t('new_announcement.toast.cta_incomplete'));
      return;
    }

    try {
      setIsUploading(true);

      let imageUrl = existingImageUrl;
      if (hasNewImage && croppedAreaPixels) {
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
        imageUrl = uploadData.url;
      }

      const contact =
        contactMode === 'custom'
          ? {
              mode: 'custom' as const,
              custom: {
                primaryPhone: customPhone.trim(),
                callEnabled: customCallEnabled,
              },
            }
          : { mode: 'inherit' as const, custom: null };

      if (isEditMode && announcementId) {
        updateMutation.mutate({
          id: announcementId,
          title,
          subtitle: subtitle || null,
          description,
          priceCents,
          imageUrl,
          categoryId,
          tags,
          contact,
          cta,
          showVerifiedBadge: showVerifiedBadge && canVerify,
        });
      } else {
        createMutation.mutate({
          providerAssignmentId: selectedLocationId,
          title,
          subtitle: subtitle || null,
          description,
          priceCents,
          imageUrl,
          categoryId,
          tags,
          contact,
          cta,
          showVerifiedBadge: showVerifiedBadge && canVerify,
        });
      }
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

  if (isEditMode && (dashboardQuery.isLoading || !editingAnnouncement)) {
    return (
      <PanelContentContainer variant="default">
        <div className="flex min-h-[50vh] items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            {t('meus_anuncios.detail.loading')}
          </p>
        </div>
      </PanelContentContainer>
    );
  }

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
              {t(
                isEditMode
                  ? 'new_announcement.edit_title'
                  : 'new_announcement.title',
              )}{' '}
              <Sparkles className="h-5 w-5 text-warning" />
            </h1>
            <p className="text-muted-foreground text-sm">
              {t(
                isEditMode
                  ? 'new_announcement.edit_subtitle'
                  : 'new_announcement.subtitle',
              )}
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
                        disabled={!policy.location.editable}
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
                      disabled={!policy.title.editable}
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
                      disabled={!policy.subtitle.editable}
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
                    disabled={!policy.description.editable}
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
                  existingImageUrl ? (
                    <div className="space-y-4">
                      <div className="relative mx-auto aspect-[4/3] w-full max-w-[220px] overflow-hidden rounded-lg border bg-background">
                        <img
                          src={existingImageUrl}
                          alt={t('new_announcement.image_card.title')}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!policy.image.editable}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        {t('new_announcement.image_card.change')}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!policy.image.editable}
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
                  )
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
                      disabled={!policy.image.editable}
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
                                disabled={
                                  !canVerify || !policy.verifiedBadge.editable
                                }
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
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                    {t('new_announcement.submit.processing')}
                  </span>
                ) : createMutation.isPending || updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                    {t(
                      isEditMode
                        ? 'new_announcement.submit.updating'
                        : 'new_announcement.submit.saving',
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />{' '}
                    {t(
                      isEditMode
                        ? 'new_announcement.submit.update'
                        : 'new_announcement.submit.save',
                    )}
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

interface DashboardAnnouncementGroups {
  active: ProviderDashboardAnnouncementItem[];
  draft: ProviderDashboardAnnouncementItem[];
  expired: ProviderDashboardAnnouncementItem[];
  suspended: ProviderDashboardAnnouncementItem[];
}

function flattenDashboardAnnouncements(
  announcements?: DashboardAnnouncementGroups,
): ProviderDashboardAnnouncementItem[] {
  if (!announcements) return [];
  return [
    ...announcements.active,
    ...announcements.draft,
    ...announcements.expired,
    ...announcements.suspended,
  ];
}
