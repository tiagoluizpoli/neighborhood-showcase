import { env } from '@neighborhood-showcase/env/web';
import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { clampCropBounds, validateCropBounds } from '@/utils/cropper';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard/anuncios/novo')({
  component: NewAnnouncementComponent,
});

const CATEGORIES = [
  'Alimentação',
  'Serviços Gerais',
  'Aulas & Consultoria',
  'Artesanato & Moda',
  'Beleza & Estética',
  'Outros',
];

function NewAnnouncementComponent() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for form fields
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priceStr, setPriceStr] = useState<string>('');
  const [tagsStr, setTagsStr] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [showVerifiedBadge, setShowVerifiedBadge] = useState<boolean>(false);

  // Cropper states
  const [imageSrc, setImageSrc] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1.2);
  const [xOffset, setXOffset] = useState<number>(50); // percentage (0 - 100)
  const [yOffset, setYOffset] = useState<number>(50); // percentage (0 - 100)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Queries
  const assignmentsQuery = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );
  const assignments = assignmentsQuery.data;
  const isLoadingAssignments = assignmentsQuery.isLoading;

  const approvedLocations =
    assignments?.filter((a) => a.status === 'APPROVED') || [];

  // Default select location if only one is available
  useEffect(() => {
    if (approvedLocations.length === 1 && !selectedLocationId) {
      setSelectedLocationId(approvedLocations[0].id);
    }
  }, [approvedLocations, selectedLocationId]);

  // Update verified badge availability depending on the selected location type
  const selectedAssignment = approvedLocations.find(
    (a) => a.id === selectedLocationId,
  );
  const canVerify = selectedAssignment?.type === 'RESIDENT';

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      // Reset cropper offsets
      setZoom(1.2);
      setXOffset(50);
      setYOffset(50);
      setCroppedBlob(null);
    };
    reader.readAsDataURL(file);
  };

  // Perform cropping onto canvas and previewing
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Crop to 4:3 viewport ratio
      const viewportRatio = 4 / 3;
      const imageRatio = naturalWidth / naturalHeight;

      let sWidth = naturalWidth;
      let sHeight = naturalHeight;

      if (imageRatio > viewportRatio) {
        sWidth = naturalHeight * viewportRatio;
      } else {
        sHeight = naturalWidth / viewportRatio;
      }

      // Apply zoom
      sWidth = sWidth / zoom;
      sHeight = sHeight / zoom;

      // Calculate source coordinates based on offsets
      const maxX = naturalWidth - sWidth;
      const maxY = naturalHeight - sHeight;

      // Interpolate offsets
      const sx = (xOffset / 100) * maxX;
      const sy = (yOffset / 100) * maxY;

      // Validate bounds using cropper utility
      const cropRect = {
        x: Math.round(sx),
        y: Math.round(sy),
        width: Math.round(sWidth),
        height: Math.round(sHeight),
      };

      const validated = validateCropBounds(
        naturalWidth,
        naturalHeight,
        cropRect,
      );
      const finalCrop = validated.isValid
        ? cropRect
        : clampCropBounds(naturalWidth, naturalHeight, cropRect);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        finalCrop.x,
        finalCrop.y,
        finalCrop.width,
        finalCrop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // Extract blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCroppedBlob(blob);
          }
        },
        'image/webp',
        0.85,
      );
    };
  }, [imageSrc, zoom, xOffset, yOffset]);

  // Form mutation
  const createMutation = useMutation(
    trpc.announcement.create.mutationOptions({
      onSuccess: () => {
        toast.success('Rascunho do anúncio criado com sucesso!');
        navigate({ to: '/dashboard' });
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao criar o anúncio.');
      },
    }),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocationId) {
      toast.error('Por favor, selecione uma localização.');
      return;
    }
    if (!category) {
      toast.error('Por favor, selecione uma categoria.');
      return;
    }
    if (title.trim().length < 3) {
      toast.error('O título deve conter pelo menos 3 caracteres.');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('A descrição deve conter pelo menos 10 caracteres.');
      return;
    }
    if (!whatsapp.trim() && !instagram.trim() && !website.trim()) {
      toast.error(
        'Forneça pelo menos um meio de contato (WhatsApp, Instagram ou Website).',
      );
      return;
    }
    if (!croppedBlob) {
      toast.error('A imagem de capa é obrigatória.');
      return;
    }

    try {
      setIsUploading(true);
      // Upload cropped image
      const formData = new FormData();
      formData.append('file', croppedBlob, 'cover-image.webp');
      formData.append('type', 'image');

      const uploadRes = await fetch(`${env.VITE_SERVER_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadRes.ok) {
        throw new Error('Falha no upload da imagem recortada.');
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // Extract tags
      const tags = tagsStr
        .split(/[,\s]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      // Parse price in cents
      let priceCents: number | null = null;
      if (priceStr.trim()) {
        const cleanPrice = priceStr.replace(/[^\d]/g, '');
        if (cleanPrice) {
          priceCents = Number.parseInt(cleanPrice, 10);
        }
      }

      // Submit mutation
      createMutation.mutate({
        providerLocationId: selectedLocationId,
        title,
        subtitle: subtitle || null,
        description,
        priceCents,
        imageUrl,
        category,
        tags,
        contactLinks: {
          whatsapp: whatsapp || undefined,
          instagram: instagram || undefined,
          website: website || undefined,
        },
        showVerifiedBadge: showVerifiedBadge && canVerify,
      });
    } catch (error) {
      const errMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao realizar upload ou processar o formulário.';
      toast.error(errMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate({ to: '/dashboard' })}
          className="border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 font-bold text-2xl text-white tracking-tight">
            Novo Anúncio <Sparkles className="h-5 w-5 text-warning" />
          </h1>
          <p className="text-muted-foreground text-sm">
            Crie um rascunho da sua oferta e publique para seus vizinhos.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {/* Form Fields Column */}
        <div className="space-y-6 md:col-span-2">
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Detalhes do Anúncio
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Insira as informações gerais sobre seu produto ou serviço.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Selector */}
              {isLoadingAssignments ? (
                <div className="space-y-2">
                  <Label className="font-medium text-muted-foreground text-sm">
                    Localização
                  </Label>
                  <div className="h-10 w-full animate-pulse rounded bg-muted" />
                </div>
              ) : approvedLocations.length === 0 ? (
                <div className="space-y-2">
                  <Label className="font-medium text-muted-foreground text-sm">
                    Localização
                  </Label>
                  <div className="rounded border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    Você não possui nenhuma localização aprovada. Cadastre-se em
                    um condomínio ou registre-se de forma autônoma antes de
                    anunciar.
                  </div>
                </div>
              ) : (
                approvedLocations.length > 1 && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="location-select"
                      className="font-medium text-muted-foreground text-sm"
                    >
                      Localização do Anúncio *
                    </Label>
                    <select
                      id="location-select"
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="" disabled>
                        Selecione a localização...
                      </option>
                      {approvedLocations.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.type === 'EXTERNAL'
                            ? `Atendimento Autônomo (${a.unitInfo ? `${a.unitInfo}, ` : ''}${a.number})`
                            : `${a.condominium?.name ?? 'Condomínio'} (${a.condominium?.city ?? ''} - ${a.condominium?.state ?? ''})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}

              {/* Category selector */}
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground text-sm">
                  Categoria
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-md border px-3 py-2 font-semibold text-xs transition-all ${
                        category === cat
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border bg-background text-muted-foreground hover:bg-card hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="font-medium text-muted-foreground text-sm"
                >
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  maxLength={100}
                  placeholder="Ex: Bolos Decorados Artesanais"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                />
                <div className="flex justify-end text-[10px] text-muted-foreground">
                  {title.length}/100 caracteres
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="subtitle"
                  className="font-medium text-muted-foreground text-sm"
                >
                  Subtítulo (opcional)
                </Label>
                <Input
                  id="subtitle"
                  type="text"
                  maxLength={100}
                  placeholder="Ex: Entregas gratuitas às sextas-feiras"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="font-medium text-muted-foreground text-sm"
                >
                  Descrição Completa <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="description"
                  rows={4}
                  maxLength={2000}
                  placeholder="Descreva seu serviço ou produto em detalhes, incluindo formas de entrega..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="flex min-h-[100px] w-full rounded-md border border bg-background px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Mínimo 10 caracteres</span>
                  <span>{description.length}/2000 caracteres</span>
                </div>
              </div>

              {/* Price & Tags */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="price"
                    className="font-medium text-muted-foreground text-sm"
                  >
                    Preço Inicial (opcional)
                  </Label>
                  <Input
                    id="price"
                    type="text"
                    placeholder="Ex: R$ 45,00"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className="border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="tags"
                    className="font-medium text-muted-foreground text-sm"
                  >
                    Tags / Palavras-chave
                  </Label>
                  <Input
                    id="tags"
                    type="text"
                    placeholder="Ex: bolo doce festa caseiro"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    className="border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Separe por espaço ou vírgula.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Links Card */}
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Canais de Contato
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Forneça pelo menos uma opção para os vizinhos entrarem em
                contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="whatsapp"
                  className="font-medium text-muted-foreground text-sm"
                >
                  WhatsApp (apenas números com DDD)
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="Ex: 11999999999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="instagram"
                  className="font-medium text-muted-foreground text-sm"
                >
                  Perfil do Instagram
                </Label>
                <Input
                  id="instagram"
                  type="text"
                  placeholder="Ex: @seu_negocio"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="website"
                  className="font-medium text-muted-foreground text-sm"
                >
                  Website / Cardápio Online (link completo)
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="Ex: https://meusite.com.br"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Media & Cropper Column */}
        <div className="space-y-6">
          {/* Cropper Card */}
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Imagem de Capa
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Imagens são obrigatórias e devem possuir a proporção 4:3.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!imageSrc ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-2 border-dashed bg-background p-6 transition-all hover:bg-card/50"
                >
                  <UploadCloud className="mb-3 h-10 w-10 animate-bounce text-muted-foreground transition-colors group-hover:text-primary" />
                  <p className="font-semibold text-foreground text-xs">
                    Escolher imagem
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    PNG, JPG, WEBP de até 5MB
                  </p>
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Viewport Cropper container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border bg-background">
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt="Original"
                      className="hidden"
                    />
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Zoom controls */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <Label htmlFor="zoom-slider">Zoom</Label>
                      <span>{zoom.toFixed(1)}x</span>
                    </div>
                    <input
                      id="zoom-slider"
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) =>
                        setZoom(Number.parseFloat(e.target.value))
                      }
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-indigo-500"
                    />
                  </div>

                  {/* Positioning controls */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <Label htmlFor="xoffset-slider">Posição X</Label>
                      </div>
                      <input
                        id="xoffset-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={xOffset}
                        onChange={(e) =>
                          setXOffset(Number.parseInt(e.target.value, 10))
                        }
                        className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <Label htmlFor="yoffset-slider">Posição Y</Label>
                      </div>
                      <input
                        id="yoffset-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={yOffset}
                        onChange={(e) =>
                          setYOffset(Number.parseInt(e.target.value, 10))
                        }
                        className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-indigo-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImageSrc('');
                      setCroppedBlob(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="h-8 w-full border bg-background py-1 text-muted-foreground text-xs hover:bg-card"
                  >
                    Trocar imagem
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

          {/* Badge & Trust Card */}
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Confiança & Selos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border bg-background/60 p-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-white">
                    Selo Morador Verificado
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Exibe um selo para vizinhos de que você realmente mora neste
                    condomínio.
                  </p>
                </div>
                <div>
                  <input
                    type="checkbox"
                    id="verified-badge-toggle"
                    disabled={!canVerify}
                    checked={showVerifiedBadge}
                    onChange={(e) => setShowVerifiedBadge(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-primary disabled:opacity-50"
                  />
                </div>
              </div>
              {!canVerify && selectedLocationId && (
                <p className="text-[10px] text-warning">
                  Indisponível: O selo de morador verificado está disponível
                  apenas para moradores de condomínio aprovados.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="space-y-2">
            <Button
              type="submit"
              disabled={isUploading || createMutation.isPending}
              className="w-full bg-primary py-3 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processando
                  Imagem...
                </span>
              ) : createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando
                  Rascunho...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> Salvar Rascunho
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/dashboard' })}
              className="w-full border text-muted-foreground hover:bg-card/50"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
