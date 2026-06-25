import { Button } from '@neighborhood-showcase/ui/components/button';
import { X } from 'lucide-react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';

export interface CropModalProps {
  image: string;
  aspect: number;
  isCircular: boolean;
  crop: { x: number; y: number };
  zoom: number;
  isUploading: boolean;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedAreaPixels: Area) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Presentational crop/reposition dialog shared by every image-edit surface
 * (provider logo/banner hover-edit and the account avatar field) so the crop
 * frame is identical everywhere and always matches the role's display aspect.
 */
export function CropModal({
  image,
  aspect,
  isCircular,
  crop,
  zoom,
  isUploading,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onCancel,
  onConfirm,
}: CropModalProps) {
  const { t } = useTranslation('configuracoes');

  return (
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
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-6">
          {/* A roomy viewport so the whole image is visible; the BRIGHT crop
              frame inside is the exact display aspect (`aspect`), so what you
              frame is what renders. Default objectFit ('contain') — its
              coordinate mapping is what getCroppedImg expects, so the saved
              crop matches the frame exactly (zoom in to fill a wide banner). */}
          <div className="relative h-[300px] w-full overflow-hidden rounded-lg border bg-background sm:h-[340px]">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              objectFit={aspect > 1.2 ? 'horizontal-cover' : 'contain'}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={(_, croppedPixels) =>
                onCropComplete(croppedPixels)
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
              onChange={(e) => onZoomChange(Number.parseFloat(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-border border-t bg-muted/50 p-5">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('image_upload_cancel')}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isUploading}>
            {isUploading ? t('image_upload_uploading') : t('image_upload_save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
