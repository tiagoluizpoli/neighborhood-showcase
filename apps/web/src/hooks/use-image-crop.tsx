import { env } from '@neighborhood-showcase/env/web';
import { type ReactNode, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CropModal } from '@/components/crop-modal';
import { getCroppedImg } from '@/utils/crop-image';

export interface UseImageCropOptions {
  value: string;
  onChange: (url: string) => void;
  /** Original full-resolution source; Re-crop reframes from here (T-19-02). */
  originalValue?: string;
  onOriginalChange?: (url: string) => void;
  aspect: number;
  isCircular?: boolean;
}

export interface UseImageCrop {
  isUploading: boolean;
  /** Open the OS file picker to choose a new image (Replace / first upload). */
  triggerReplace: () => void;
  /** Reopen the cropper on the retained original source. */
  triggerRecrop: () => void;
  /** Clear both the derived crop and the original reference. */
  remove: () => void;
  /** Hidden file input — render once inside the consumer. */
  fileInput: ReactNode;
  /** Crop dialog — null unless a crop session is open. */
  modal: ReactNode;
}

/**
 * Image crop/upload lifecycle extracted so any surface (the provider hero's
 * hover-edit overlays, the account avatar field) drives the SAME crop dialog
 * with an aspect that matches how the image is actually displayed.
 */
export function useImageCrop({
  value,
  onChange,
  originalValue,
  onOriginalChange,
  aspect,
  isCircular = false,
}: UseImageCropOptions): UseImageCrop {
  const { t } = useTranslation('configuracoes');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Set only when the crop came from a NEW file pick, so the untouched
  // original is uploaded too; null on Re-crop (original already persisted).
  const [pendingOriginalFile, setPendingOriginalFile] = useState<File | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCropper = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    setIsOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      openCropper();
    };
    reader.readAsDataURL(file);
  };

  const triggerRecrop = () => {
    const source = originalValue || value;
    if (!source) return;
    setSelectedImageSrc(source);
    setPendingOriginalFile(null);
    openCropper();
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

  const handleConfirm = async () => {
    if (!selectedImageSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(
        selectedImageSrc,
        croppedAreaPixels,
      );
      const croppedUrl = await uploadBlob(croppedBlob, 'upload.webp');
      onChange(croppedUrl);
      if (pendingOriginalFile) {
        const originalUrl = await uploadBlob(
          pendingOriginalFile,
          pendingOriginalFile.name || 'original',
        );
        onOriginalChange?.(originalUrl);
      }
      toast.success(t('image_upload_success'));
      setPendingOriginalFile(null);
      setIsOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('image_upload_error'));
    } finally {
      setIsUploading(false);
    }
  };

  const remove = () => {
    onChange('');
    onOriginalChange?.('');
  };

  return {
    isUploading,
    triggerReplace: () => fileInputRef.current?.click(),
    triggerRecrop,
    remove,
    fileInput: (
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />
    ),
    modal: isOpen ? (
      <CropModal
        image={selectedImageSrc}
        aspect={aspect}
        isCircular={isCircular}
        crop={crop}
        zoom={zoom}
        isUploading={isUploading}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={setCroppedAreaPixels}
        onCancel={() => setIsOpen(false)}
        onConfirm={handleConfirm}
      />
    ) : null,
  };
}
