import { env } from '@neighborhood-showcase/env/web';
import { Button } from '@neighborhood-showcase/ui/components/button';
import { Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getCroppedImg } from '@/utils/crop-image';

/** Provider image roles driving preview shape/size. */
export type ImageUploadRole = 'banner' | 'avatar' | 'logo';

export interface ImageUploadFieldProps {
  label: string;
  helpText: string;
  value: string;
  onChange: (url: string) => void;
  /**
   * Role driving preview shape/size: banner 16:9 wide, avatar round, logo
   * square. When set it supersedes `aspectRatio`/`circular`. Named `imageRole`
   * (not `role`) to avoid colliding with the DOM ARIA `role` attribute, which
   * the a11y linter rejects for non-ARIA values like `avatar`/`logo`.
   */
  imageRole?: ImageUploadRole;
  /**
   * Original full-resolution upload reference (T-19-02 contract). Re-crop
   * reopens the cropper on this source so re-framing is lossless. Falls back
   * to `value` when absent (legacy rows persisted before original retention).
   */
  originalValue?: string;
  /** Persist the original-source reference alongside the derived crop. */
  onOriginalChange?: (url: string) => void;
  /** Explicit aspect ratio for the non-role (account) consumer. */
  aspectRatio?: number;
  /**
   * Deprecated: the raw URL text box is no longer rendered. Accepted so
   * existing call sites keep compiling; ignored.
   */
  urlInput?: boolean;
  /** When true, renders a small circular crop for avatar. */
  circular?: boolean;
}

function resolveShape(
  role: ImageUploadRole | undefined,
  aspectRatio: number | undefined,
  circular: boolean,
): { isCircular: boolean; aspect: number } {
  if (role) {
    return {
      isCircular: role === 'avatar',
      aspect: role === 'banner' ? 16 / 9 : 1,
    };
  }
  return { isCircular: circular, aspect: aspectRatio ?? 1 };
}

export function ImageUploadField({
  label,
  helpText,
  value,
  onChange,
  imageRole,
  originalValue,
  onOriginalChange,
  aspectRatio,
  circular = false,
}: ImageUploadFieldProps) {
  const { t } = useTranslation('configuracoes');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCroppingOpen, setIsCroppingOpen] = useState(false);
  // When set, the crop session originated from a NEW file pick (Replace /
  // initial upload), so the untouched original is uploaded too. Null on
  // Re-crop, where the original is already persisted and must not change.
  const [pendingOriginalFile, setPendingOriginalFile] = useState<File | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isCircular, aspect } = resolveShape(imageRole, aspectRatio, circular);
  const isWide = !isCircular && aspect > 1;
  const previewClass = isCircular
    ? 'aspect-square w-24 rounded-full'
    : isWide
      ? 'aspect-video w-full max-w-[16rem]'
      : 'aspect-square w-24';

  const setUploadingState = (nextState: boolean) => {
    setIsUploading(nextState);
  };

  const resetCropState = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    setIsCroppingOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('image_upload_invalid'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setPendingOriginalFile(file);
      resetCropState();
    };
    reader.readAsDataURL(file);
  };

  // Re-crop reopens the cropper on the ORIGINAL full-resolution upload with no
  // new file selection. Falls back to the derived crop for legacy rows that
  // predate original retention.
  const handleRecrop = () => {
    const source = originalValue || value;
    if (!source) return;
    setSelectedImageSrc(source);
    setPendingOriginalFile(null);
    resetCropState();
  };

  const uploadBlob = async (blob: Blob, filename: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('type', 'image');

    const response = await fetch(`${env.VITE_SERVER_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(t('image_upload_failed'));
    }

    const data = await response.json();
    return data.url as string;
  };

  const handleCropConfirm = async () => {
    if (!selectedImageSrc || !croppedAreaPixels) return;

    setUploadingState(true);
    try {
      const croppedBlob = await getCroppedImg(
        selectedImageSrc,
        croppedAreaPixels,
      );
      const croppedUrl = await uploadBlob(croppedBlob, 'upload.webp');
      onChange(croppedUrl);

      // Persist the untouched original only when this crop came from a new
      // file pick; a Re-crop keeps the already-saved original intact.
      if (pendingOriginalFile) {
        const originalUrl = await uploadBlob(
          pendingOriginalFile,
          pendingOriginalFile.name || 'original',
        );
        onOriginalChange?.(originalUrl);
      }

      toast.success(t('image_upload_success'));
      setPendingOriginalFile(null);
      setIsCroppingOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('image_upload_error'));
    } finally {
      setUploadingState(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    onOriginalChange?.('');
  };

  return (
    <>
      <div className="space-y-2">
        <span className="block font-medium text-foreground text-sm">
          {label}
        </span>

        {/* Preview */}
        {value && (
          <div
            className={`relative overflow-hidden rounded-lg border border-border bg-muted ${previewClass}`}
          >
            <img
              src={value}
              alt={t('image_upload_preview_alt')}
              className={`h-full w-full object-cover ${isCircular ? 'rounded-full' : ''}`}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/75">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="space-y-1.5">
          {value ? (
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs"
              >
                {t('image_upload_replace')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRecrop}
                disabled={isUploading}
                className="text-xs"
              >
                {t('image_upload_recrop')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                className="text-muted-foreground text-xs"
              >
                {t('button_remove')}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              size="sm"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : null}
              {t('button_upload')}
            </Button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          <p className="text-muted-foreground text-xs">{helpText}</p>
        </div>
      </div>

      {/* Crop Modal */}
      {isCroppingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4">
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-border border-b p-5">
              <div>
                <h4 className="font-bold text-foreground text-lg">
                  {t('image_upload_adjust_title')}
                </h4>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {aspect === 1
                    ? t('image_upload_adjust_help_square')
                    : aspect < 1
                      ? t('image_upload_adjust_help_portrait')
                      : t('image_upload_adjust_help_landscape')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCroppingOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-[300px] flex-1 space-y-4 p-6">
              <div
                className={`relative min-h-[220px] w-full overflow-hidden rounded-lg border bg-background ${
                  isCircular ? 'aspect-square max-w-[220px]' : ''
                }`}
                style={isCircular ? {} : { aspectRatio: String(aspect) }}
              >
                <Cropper
                  image={selectedImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) =>
                    setCroppedAreaPixels(croppedPixels)
                  }
                  cropShape={isCircular ? 'round' : 'rect'}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span className="font-medium text-foreground text-sm">
                    {t('image_upload_zoom')}
                  </span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-border border-t bg-muted/50 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCroppingOpen(false)}
              >
                {t('image_upload_cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleCropConfirm}
                disabled={isUploading}
              >
                {isUploading
                  ? t('image_upload_uploading')
                  : t('image_upload_save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
