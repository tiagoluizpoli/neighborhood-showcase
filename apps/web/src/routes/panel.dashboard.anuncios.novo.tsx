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
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@neighborhood-showcase/ui/components/tooltip';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { toast } from 'sonner';
import { getCroppedImg } from '@/utils/crop-image';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard/anuncios/novo')({
  component: NewAnnouncementComponent,
});

function NewAnnouncementComponent() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for form fields
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Queries
  const { data: backendCategories } = useQuery(
    trpc.announcement.listCategories.queryOptions(),
  );

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
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
  };

  // Form mutation
  const createMutation = useMutation(
    trpc.announcement.create.mutationOptions({
      onSuccess: () => {
        toast.success('Rascunho do anúncio criado com sucesso!');
        navigate({ to: '/panel/dashboard' });
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
    if (!categoryId) {
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
    if (!imageSrc || !croppedAreaPixels) {
      toast.error('A imagem de capa é obrigatória.');
      return;
    }

    try {
      setIsUploading(true);
      // Crop image on submission
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

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
        categoryId,
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
          onClick={() => navigate({ to: '/panel/dashboard' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 font-bold text-2xl text-foreground tracking-tight">
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
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Anúncio</CardTitle>
              <CardDescription>
                Insira as informações gerais sobre seu produto ou serviço.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Selector */}
              {isLoadingAssignments ? (
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <div className="h-10 w-full animate-pulse rounded bg-muted" />
                </div>
              ) : approvedLocations.length === 0 ? (
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <div className="rounded border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    Você não possui nenhuma localização aprovada. Cadastre-se em
                    um condomínio ou registre-se de forma autônoma antes de
                    anunciar.
                  </div>
                </div>
              ) : (
                approvedLocations.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="location-select">
                      Localização do Anúncio *
                    </Label>
                    <select
                      id="location-select"
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
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
                <Label>Categoria</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {backendCategories?.map((cat) => (
                    <Button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      variant={categoryId === cat.id ? 'default' : 'outline'}
                      size="sm"
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="title">
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
                />
                <div className="flex justify-end text-[10px] text-muted-foreground">
                  {title.length}/100 caracteres
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
                <Input
                  id="subtitle"
                  type="text"
                  maxLength={100}
                  placeholder="Ex: Entregas gratuitas às sextas-feiras"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrição Completa <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  maxLength={2000}
                  placeholder="Descreva seu serviço ou produto em detalhes, incluindo formas de entrega..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="min-h-[100px]"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Mínimo 10 caracteres</span>
                  <span>{description.length}/2000 caracteres</span>
                </div>
              </div>

              {/* Price & Tags */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Inicial (opcional)</Label>
                  <Input
                    id="price"
                    type="text"
                    placeholder="Ex: R$ 45,00"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags / Palavras-chave</Label>
                  <Input
                    id="tags"
                    type="text"
                    placeholder="Ex: bolo doce festa caseiro"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Separe por espaço ou vírgula.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Links Card */}
          <Card>
            <CardHeader>
              <CardTitle>Canais de Contato</CardTitle>
              <CardDescription>
                Forneça pelo menos uma opção para os vizinhos entrarem em
                contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">
                  WhatsApp (apenas números com DDD)
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="Ex: 11999999999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Perfil do Instagram</Label>
                <Input
                  id="instagram"
                  type="text"
                  placeholder="Ex: @seu_negocio"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  Website / Cardápio Online (link completo)
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="Ex: https://meusite.com.br"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Media & Cropper Column */}
        <div className="space-y-6">
          {/* Cropper Card */}
          <Card>
            <CardHeader>
              <CardTitle>Imagem de Capa</CardTitle>
              <CardDescription>
                Imagens são obrigatórias e devem possuir a proporção 4:3.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!imageSrc ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-2 border-dashed bg-background p-6 hover:bg-card"
                >
                  <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground transition-colors group-hover:text-primary" />
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
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-background">
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

                  {/* Zoom controls */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <Label htmlFor="zoom-slider">Zoom</Label>
                      <span>{zoom.toFixed(1)}x</span>
                    </div>
                    <input
                      id="zoom-slider"
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) =>
                        setZoom(Number.parseFloat(e.target.value))
                      }
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImageSrc('');
                      setCroppedAreaPixels(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="w-full"
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
          <Card>
            <CardHeader>
              <CardTitle>Confiança & Selos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border bg-background p-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
                    Selo Morador Verificado
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Exibe um selo para vizinhos de que você realmente mora neste
                    condomínio.
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
                          O selo de morador verificado está disponível apenas
                          para moradores de condomínio aprovados. Acesse a
                          página "Minha Conta" para verificar sua residência.
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {!canVerify && selectedLocationId && (
                <p className="mt-2 text-[10px] text-warning">
                  Indisponível: O selo de morador verificado está disponível
                  apenas para moradores de condomínio aprovados. Acesse a página
                  "Minha Conta" para verificar sua residência.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="space-y-2">
            <Button
              type="submit"
              disabled={isUploading || createMutation.isPending}
              className="w-full"
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
              onClick={() => navigate({ to: '/panel/dashboard' })}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
