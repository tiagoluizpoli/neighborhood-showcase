import { env } from '@neighborhood-showcase/env/web';
import { Button } from '@neighborhood-showcase/ui/components/button';
import { Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { toast } from 'sonner';
import { getCroppedImg } from '@/utils/crop-image';

interface ProviderDashboardEditImageFieldProps {
  imageUrl: string;
  onImageUrlChange: (imageUrl: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

export function ProviderDashboardEditImageField({
  imageUrl,
  onImageUrlChange,
  onUploadingChange,
}: ProviderDashboardEditImageFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCroppingOpen, setIsCroppingOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setUploadingState = (nextState: boolean) => {
    setIsUploading(nextState);
    onUploadingChange(nextState);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setIsCroppingOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!selectedImageSrc || !croppedAreaPixels) {
      return;
    }

    setUploadingState(true);
    try {
      const croppedBlob = await getCroppedImg(
        selectedImageSrc,
        croppedAreaPixels,
      );

      const formData = new FormData();
      formData.append('file', croppedBlob, 'cover-image.webp');
      formData.append('type', 'image');

      const response = await fetch(`${env.VITE_SERVER_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha no upload da imagem recortada.');
      }

      const data = await response.json();
      onImageUrlChange(data.url);
      toast.success('Imagem recortada e enviada com sucesso!');
      setIsCroppingOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao processar imagem.');
    } finally {
      setUploadingState(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <span className="block font-medium text-foreground text-sm">
          Imagem de Capa (4:3)
        </span>
        <div className="flex items-center gap-4">
          <div className="relative aspect-[4/3] w-32 overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={imageUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/75">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
            >
              Alterar Imagem
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <p className="text-muted-foreground text-xs">
              Imagens na proporção 4:3 são preferíveis.
            </p>
          </div>
        </div>
      </div>

      {isCroppingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4">
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-border border-b p-5">
              <div>
                <h4 className="font-bold text-foreground text-lg">
                  Ajustar Imagem
                </h4>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Arraste para ajustar o enquadramento de 4:3.
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
              <div className="relative aspect-[4/3] min-h-[220px] w-full overflow-hidden rounded-lg border bg-background">
                <Cropper
                  image={selectedImageSrc}
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
                  <span className="font-medium text-foreground text-sm">
                    Zoom
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
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCropConfirm}
                disabled={isUploading}
              >
                {isUploading ? 'Salvando...' : 'Recortar e Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
