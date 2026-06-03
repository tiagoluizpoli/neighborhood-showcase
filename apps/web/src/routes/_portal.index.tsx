import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@neighborhood-showcase/ui/components/avatar';
import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@neighborhood-showcase/ui/components/dialog';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  CheckCircle2,
  Globe,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  confirmNearbyCondoSelection,
  deriveNearbyCondoMatch,
  dismissNearbyCondoSelection,
  formatNearbyCondoDistance,
  nearbyCondoDismissedStorageKey,
  resetNearbyCondoSelectionPrompt,
  type NearbyCondoSelection as SelectedCondo,
} from '@/utils/condominium-proximity';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/_portal/')({
  component: PublicVitrineComponent,
});

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const CATEGORIES = [
  'Todos',
  'Alimentação',
  'Serviços',
  'Produtos',
  'Vagas',
  'Eventos',
  'Outros',
];

function PublicVitrineComponent() {
  const [selectedCondo, setSelectedCondo] = useState<SelectedCondo | null>(
    null,
  );
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [condoSearchQuery, setCondoSearchQuery] = useState('');

  // Geolocation states
  const [geoPreference, setGeoPreference] = useState<string | null>(() =>
    localStorage.getItem('geolocation_preference'),
  );
  const [isGeoDialogOpen, setIsGeoDialogOpen] = useState(
    () => localStorage.getItem('geolocation_preference') === null,
  );
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(() => {
    const savedCoords = localStorage.getItem('user_coords');
    if (savedCoords) {
      try {
        return JSON.parse(savedCoords);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Grid Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filterByCondo, setFilterByCondo] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(10);

  // Detail view state
  const [activeAdId, setActiveAdId] = useState<string | null>(null);

  const nearbyCondoPromptDismissed =
    localStorage.getItem(nearbyCondoDismissedStorageKey) === 'true';

  // tRPC Queries
  const { data: condoSearchResults, isLoading: isSearchingCondos } = useQuery(
    trpc.condominium.listApproved.queryOptions({ query: condoSearchQuery }),
  );

  const { data: nearbyCondoResults } = useQuery(
    trpc.condominium.listNearby.queryOptions(
      {
        latitude: coords?.latitude ?? 0,
        longitude: coords?.longitude ?? 0,
        radiusInMeters: 1000,
      },
      { enabled: geoPreference === 'granted' && coords !== null },
    ),
  );

  const nearbyCondoMatch =
    geoPreference === 'granted' &&
    !selectedCondo &&
    !nearbyCondoPromptDismissed &&
    nearbyCondoResults &&
    nearbyCondoResults.length > 0
      ? deriveNearbyCondoMatch(nearbyCondoResults)
      : null;

  const { data: announcements, isLoading: isLoadingAds } = useQuery(
    trpc.announcement.listPublic.queryOptions({
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      condominiumId:
        filterByCondo && selectedCondo ? selectedCondo.id : undefined,
      category,
      search,
      verifiedOnly,
      userCondoId: selectedCondo?.id,
      radiusKm: coords ? radiusKm : undefined,
    }),
  );

  const activeAdQuery = useQuery({
    ...trpc.announcement.getPublic.queryOptions({ id: activeAdId || '' }),
    enabled: !!activeAdId,
  });

  const trackEventMutation = useMutation(
    trpc.announcement.trackEvent.mutationOptions(),
  );

  // Fallback IP estimation
  const fetchIpFallback = useCallback(async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('IP api failed');
      const data = await res.json();
      const city = data.city;
      if (city) {
        const resList = await fetch(
          `${
            import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'
          }/trpc/condominium.listApproved?input=${encodeURIComponent(
            JSON.stringify({ query: city }),
          )}`,
        );
        const json = await resList.json();
        const condos = json?.result?.data as SelectedCondo[];

        if (condos && condos.length > 0) {
          // Set as selected condominium, but do NOT write to localStorage user_condo (LGPD compliance)
          setSelectedCondo(condos[0]);
          toast.info(`Localização estimada por IP: ${condos[0].name}`);
        }
      }
    } catch (err) {
      console.error('IP fallback failed:', err);
    }
  }, []);

  const handleGeoAllow = () => {
    setIsGeoDialogOpen(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coordsObj = { latitude, longitude };
          resetNearbyCondoSelectionPrompt();
          setCoords(coordsObj);
          localStorage.setItem('user_coords', JSON.stringify(coordsObj));
          localStorage.setItem('geolocation_preference', 'granted');
          setGeoPreference('granted');
          toast.success('Localização ativada com sucesso!');
        },
        (error) => {
          console.error('Geolocation failed:', error);
          handleGeoDeny();
        },
      );
    } else {
      handleGeoDeny();
    }
  };

  const handleGeoDeny = () => {
    setIsGeoDialogOpen(false);
    localStorage.setItem('geolocation_preference', 'denied');
    setGeoPreference('denied');
    toast.info('Localização desativada. Mostrando feed em ordem cronológica.');
    fetchIpFallback();
  };

  const revokeLocation = () => {
    localStorage.removeItem('geolocation_preference');
    localStorage.removeItem('user_coords');
    localStorage.removeItem('user_condo');
    resetNearbyCondoSelectionPrompt();
    setCoords(null);
    setSelectedCondo(null);
    setGeoPreference(null);
    setRadiusKm(10);
    setIsGeoDialogOpen(true);
    toast.success('Localização revogada com sucesso.');
  };

  const handleNearbyCondoConfirm = (condo: SelectedCondo) => {
    confirmNearbyCondoSelection(condo, setSelectedCondo);
    toast.success(`Condomínio selecionado: ${condo.name}`);
  };

  const handleNearbyCondoDismiss = () => {
    dismissNearbyCondoSelection(setSelectedCondo);
    toast.info(
      'Tudo bem. Você pode continuar navegando sem vincular um condomínio.',
    );
  };

  // 1. Geolocation and initial condo load
  useEffect(() => {
    const savedCondo = localStorage.getItem('user_condo');
    if (savedCondo) {
      setSelectedCondo(JSON.parse(savedCondo));
    }

    if (geoPreference === 'granted') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const coordsObj = { latitude, longitude };
            setCoords(coordsObj);
            localStorage.setItem('user_coords', JSON.stringify(coordsObj));
          },
          (err) => {
            console.error('Auto geolocation failed:', err);
          },
        );
      }
    } else if (geoPreference === 'denied') {
      fetchIpFallback();
    }
  }, [geoPreference, fetchIpFallback]);

  // 2. Synchronize URL path with activeAdId state & handle initial URL match
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/anuncios/')) {
        const id = path.split('/')[2];
        setActiveAdId(id);
      } else {
        setActiveAdId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Initial check
    const path = window.location.pathname;
    if (path.startsWith('/anuncios/')) {
      const id = path.split('/')[2];
      setActiveAdId(id);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openAdDetails = (id: string) => {
    setActiveAdId(id);
    window.history.pushState(null, '', `/anuncios/${id}`);
  };

  const closeAdDetails = () => {
    setActiveAdId(null);
    window.history.pushState(null, '', '/');
  };

  const handleContactClick = (
    adId: string,
    targetType: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE',
  ) => {
    trackEventMutation.mutate({
      announcementId: adId,
      eventType: 'CONTACT_CLICK',
      targetType,
    });
  };

  const selectCondoManually = (condo: {
    id: string;
    name: string;
    city: string;
    state: string;
    cep: string;
  }) => {
    const selected = {
      id: condo.id,
      name: condo.name,
      city: condo.city,
      state: condo.state,
      cep: condo.cep,
    };
    setSelectedCondo(selected);
    localStorage.setItem('user_condo', JSON.stringify(selected));
    setIsSelectorOpen(false);
    toast.success(`Condomínio selecionado: ${condo.name}`);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      {/* Geolocation / Selected Condo Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-xs">
              Exibindo anúncios próximos a
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="flex items-center gap-1 text-left font-semibold text-sm transition-colors hover:text-primary"
              >
                <span>
                  {selectedCondo
                    ? selectedCondo.name
                    : 'Nenhum condomínio selecionado'}
                </span>
                <span className="font-normal text-primary text-xs">
                  (Alterar)
                </span>
              </button>
              {(selectedCondo || geoPreference) && (
                <button
                  type="button"
                  onClick={revokeLocation}
                  className="font-normal text-destructive text-xs hover:underline"
                >
                  (Limpar localização)
                </button>
              )}
            </div>
          </div>
        </div>
        {!selectedCondo && (
          <Button onClick={() => setIsSelectorOpen(true)} size="sm">
            Selecionar Condomínio
          </Button>
        )}
      </div>

      {/* Subtle Geolocation Denied Re-enable Banner */}
      {geoPreference === 'denied' && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-warning/30 bg-warning/5 p-4 text-warning">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2 text-warning">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Localização desativada</p>
              <p className="text-muted-foreground text-xs">
                Ative a localização para ordenar os anúncios por proximidade de
                você.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGeoDialogOpen(true)}
            className="border-warning/30 hover:bg-warning/10 hover:text-warning"
          >
            Ativar Localização
          </Button>
        </div>
      )}

      {/* Nearby Condominium Prompt */}
      {nearbyCondoMatch ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              handleNearbyCondoDismiss();
            }
          }}
        >
          <DialogContent showCloseButton={false} className="max-w-lg p-6">
            <DialogHeader className="space-y-2 text-center">
              <div className="mx-auto rounded-full bg-primary/10 p-3 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <DialogTitle className="font-bold text-xl">
                {nearbyCondoMatch.mode === 'single'
                  ? `Você mora no Condomínio ${nearbyCondoMatch.condo.name}?`
                  : 'Encontramos condomínios próximos a você'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {nearbyCondoMatch.mode === 'single'
                  ? `Detectamos ${formatNearbyCondoDistance(
                      nearbyCondoMatch.distance,
                    )} até a entrada principal.`
                  : 'Escolha o condomínio que melhor corresponde ao seu endereço para personalizar o feed.'}
              </DialogDescription>
            </DialogHeader>

            {nearbyCondoMatch.mode === 'single' ? (
              <div className="my-4 rounded-xl border bg-muted/40 p-4 text-center">
                <p className="font-medium text-sm">
                  {nearbyCondoMatch.condo.name}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {nearbyCondoMatch.condo.city} - {nearbyCondoMatch.condo.state}
                </p>
              </div>
            ) : (
              <div className="my-4 max-h-72 space-y-2 overflow-y-auto rounded-xl border bg-muted/20 p-2">
                {nearbyCondoMatch.condos.map((candidate) => (
                  <button
                    type="button"
                    key={candidate.condo.id}
                    onClick={() => handleNearbyCondoConfirm(candidate.condo)}
                    className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {candidate.condo.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {candidate.condo.city} - {candidate.condo.state}
                      </p>
                    </div>
                    <span className="font-semibold text-primary text-xs">
                      {formatNearbyCondoDistance(candidate.distance)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleNearbyCondoDismiss}
                className="w-full sm:w-auto sm:flex-1"
              >
                Não, continuar sem condomínio
              </Button>
              {nearbyCondoMatch.mode === 'single' ? (
                <Button
                  onClick={() =>
                    handleNearbyCondoConfirm(nearbyCondoMatch.condo)
                  }
                  className="w-full sm:w-auto sm:flex-1"
                >
                  Sim, sou morador(a)
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Geolocation Permission Dialog */}
      <Dialog open={isGeoDialogOpen} onOpenChange={setIsGeoDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-md p-6">
          <DialogHeader className="flex flex-col items-center gap-2 text-center">
            <div className="mb-2 rounded-full bg-primary/10 p-3 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <DialogTitle className="font-bold text-xl">
              Descubra serviços perto de você
            </DialogTitle>
            <DialogDescription className="mt-1 text-muted-foreground text-sm">
              Ative a localização para podermos mostrar e ordenar os anúncios de
              serviços e produtos mais próximos a você.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 rounded-xl border bg-muted/50 p-3.5 text-center text-muted-foreground text-xs leading-relaxed">
            🔒 <strong>Privacidade & LGPD:</strong> Sua localização é utilizada
            exclusivamente para personalizar a sua experiência no feed e nunca é
            compartilhada com terceiros.
          </div>
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleGeoDeny}
              className="w-full sm:w-auto sm:flex-1"
            >
              Agora não
            </Button>
            <Button
              onClick={handleGeoAllow}
              className="w-full sm:w-auto sm:flex-1"
            >
              Permitir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Filter Section */}
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por serviços, comidas, produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card py-5 pl-10"
            />
          </div>
          <div className="flex items-center gap-2.5 self-start rounded-lg border bg-card px-4 py-2 md:self-auto">
            <Checkbox
              id="verified-switch"
              checked={verifiedOnly}
              onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
            />
            <label
              htmlFor="verified-switch"
              className="cursor-pointer select-none font-medium text-sm"
            >
              Apenas moradores verificados
            </label>
          </div>
          {selectedCondo && (
            <div className="flex items-center gap-2.5 self-start rounded-lg border bg-card px-4 py-2 md:self-auto">
              <Checkbox
                id="condo-filter-switch"
                checked={filterByCondo}
                onCheckedChange={(checked) =>
                  setFilterByCondo(checked === true)
                }
              />
              <label
                htmlFor="condo-filter-switch"
                className="cursor-pointer select-none font-medium text-sm"
              >
                Apenas neste condomínio
              </label>
            </div>
          )}
        </div>

        {/* Categories Tab Swiper */}
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Announcements Grid */}
      {isLoadingAds ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Buscando listagens...</p>
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {announcements.map((ad) => {
            const isLocal =
              selectedCondo && ad.condominiumId === selectedCondo.id;
            const formattedPrice =
              ad.priceCents !== null
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(ad.priceCents / 100)
                : null;

            return (
              <Card
                key={ad.id}
                onClick={() => openAdDetails(ad.id)}
                className="group flex h-full cursor-pointer flex-col overflow-hidden border bg-card"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="h-full w-full object-cover object-center"
                  />
                  {ad.showVerifiedBadge && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary/95 px-2 py-1 font-bold text-[10px] text-primary-foreground shadow">
                      <CheckCircle2 className="h-3 w-3 fill-current" />
                      <span>Verificado</span>
                    </div>
                  )}
                  {isLocal ? (
                    <div className="absolute top-3 right-3 rounded bg-success/90 px-2 py-1 font-bold text-[10px] text-success-foreground shadow">
                      Aqui no condomínio
                    </div>
                  ) : !ad.condominiumId ? (
                    <div className="absolute top-3 right-3 rounded bg-warning/90 px-2 py-1 font-bold text-[10px] text-warning-foreground shadow">
                      Prestador Externo
                    </div>
                  ) : null}
                </div>

                <CardHeader className="flex-grow-0 p-4 pb-2">
                  <div className="mb-1 flex items-center justify-between gap-2 font-medium text-[10px] text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground uppercase tracking-wider">
                      {ad.category}
                    </span>
                    <span className="truncate">
                      {ad.condominiumId ? (
                        `${ad.condoName} (${ad.condoCity})`
                      ) : (
                        <span className="font-semibold text-warning">
                          Autônomo ({ad.condoCity})
                        </span>
                      )}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-1">{ad.title}</CardTitle>
                  {ad.subtitle && (
                    <CardDescription className="line-clamp-1">
                      {ad.subtitle}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex flex-grow flex-col justify-between gap-3 p-4 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="line-clamp-2 pr-2 text-muted-foreground text-xs leading-relaxed">
                      {ad.description}
                    </span>
                    {formattedPrice && (
                      <span className="shrink-0 whitespace-nowrap font-bold text-sm text-success">
                        {formattedPrice}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col gap-3">
                    <hr className="border-border/50" />

                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`/prestadores/${ad.providerId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex min-w-0 items-center gap-2 hover:underline"
                      >
                        <Avatar size="sm">
                          <AvatarImage
                            src={ad.providerAvatarUrl || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(ad.providerName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex items-center gap-1 truncate font-semibold text-foreground text-xs">
                          {ad.providerName}
                          {ad.showVerifiedBadge && (
                            <CheckCircle2 className="h-3 w-3 fill-current text-primary" />
                          )}
                        </span>
                      </a>

                      {ad.contactLinks?.whatsapp ? (
                        <a
                          href={`https://wa.me/${ad.contactLinks.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactClick(ad.id, 'WHATSAPP');
                          }}
                          className="shrink-0"
                        >
                          <Button size="sm" className="h-8">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </Button>
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAdDetails(ad.id);
                          }}
                          className="h-8 shrink-0 text-xs"
                        >
                          Detalhes
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card py-20 text-center">
          <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 font-medium text-lg">
            Nenhum anúncio encontrado
          </h3>
          <p className="mx-auto max-w-md px-4 text-muted-foreground text-sm">
            Tente mudar a categoria, limpar o campo de busca ou selecionar outro
            condomínio.
          </p>
        </div>
      )}

      {/* Geolocation Radius Controls */}
      {geoPreference === 'granted' && coords !== null && (
        <div
          className={`mt-8 rounded-xl border p-6 ${
            radiusKm === 25
              ? 'border-warning/40 bg-warning/5 text-warning-foreground'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-start gap-3">
              <MapPin
                className={`mt-0.5 h-5 w-5 ${radiusKm === 25 ? 'text-warning' : 'text-primary'}`}
              />
              <div>
                <p className="font-semibold text-sm">
                  {radiusKm === 10
                    ? 'Raio de busca: 10 km (Padrão)'
                    : 'Raio de busca: 25 km (Expandido)'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {radiusKm === 10
                    ? 'Procurando prestadores e condomínios próximos em Florianópolis e região.'
                    : 'Atenção: Prestadores a distâncias maiores (até 25 km) podem não realizar entregas ou atendimentos na sua região.'}
                </p>
              </div>
            </div>
            <Button
              variant={radiusKm === 10 ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => setRadiusKm(radiusKm === 10 ? 25 : 10)}
              className="w-full shrink-0 font-semibold sm:w-auto"
            >
              {radiusKm === 10 ? 'Expandir para 25 km' : 'Voltar para 10 km'}
            </Button>
          </div>
        </div>
      )}

      {/* Become a Provider Promo Section */}
      <div className="mt-16 rounded-xl border bg-muted/30 p-8 text-center">
        <h3 className="mb-2 font-bold text-lg">
          Quer divulgar seus serviços na sua vizinhança?
        </h3>
        <p className="mx-auto mb-4 max-w-lg text-muted-foreground text-sm">
          Cadastre-se como prestador de serviços e anuncie para os moradores do
          seu condomínio ou região com facilidade e confiança.
        </p>
        <Link to="/auth" search={{ tab: 'signup' }}>
          <Button variant="default">Começar Agora (Anunciar Serviços)</Button>
        </Link>
      </div>

      {/* Manual Condominium Selector Modal */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border bg-background">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-bold text-lg">Selecionar Condomínio</h2>
              {selectedCondo && (
                <button
                  type="button"
                  onClick={() => setIsSelectorOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="p-5">
              <p className="mb-4 text-muted-foreground text-xs">
                Digite o nome, cidade ou CEP para buscar condomínios com
                anúncios cadastrados na nossa rede.
              </p>

              <div className="relative mb-4">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ex: Jardim, Floripa, 88000..."
                  value={condoSearchQuery}
                  onChange={(e) => setCondoSearchQuery(e.target.value)}
                  className="bg-muted pl-9"
                  autoFocus
                />
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {isSearchingCondos ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground text-xs">
                      Buscando...
                    </span>
                  </div>
                ) : condoSearchResults && condoSearchResults.length > 0 ? (
                  condoSearchResults.map((condo) => (
                    <button
                      type="button"
                      key={condo.id}
                      onClick={() => selectCondoManually(condo)}
                      className="flex w-full flex-col gap-1 rounded-lg border p-3 text-left hover:bg-muted"
                    >
                      <span className="font-semibold text-sm">
                        {condo.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {condo.city} - {condo.state} • CEP: {condo.cep}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-muted-foreground text-xs">
                    Nenhum condomínio aprovado encontrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Preview Drawer/Modal */}
      {activeAdId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-background">
            <div className="flex items-center justify-between border-b p-4">
              <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Visualizar Anúncio
              </span>
              <button
                type="button"
                onClick={closeAdDetails}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeAdQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-muted-foreground text-xs">
                    Carregando...
                  </span>
                </div>
              ) : activeAdQuery.data ? (
                <div>
                  {/* Cover Image */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                    <img
                      src={activeAdQuery.data.imageUrl}
                      alt={activeAdQuery.data.title}
                      className="h-full w-full object-cover object-center"
                    />
                    {activeAdQuery.data.showVerifiedBadge && (
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                        <span>Morador Verificado</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Category & Condo */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                      <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                        {activeAdQuery.data.category}
                      </span>
                      <span>•</span>
                      <span>
                        {activeAdQuery.data.condominiumId ? (
                          `${activeAdQuery.data.condoName} (${activeAdQuery.data.condoCity} - ${activeAdQuery.data.condoState})`
                        ) : (
                          <span className="font-semibold text-warning">
                            Prestador Externo ({activeAdQuery.data.condoCity} -{' '}
                            {activeAdQuery.data.condoState})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Title & Price */}
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="font-bold text-xl tracking-tight">
                          {activeAdQuery.data.title}
                        </h2>
                        {activeAdQuery.data.subtitle && (
                          <p className="mt-1 text-muted-foreground text-xs">
                            {activeAdQuery.data.subtitle}
                          </p>
                        )}
                      </div>
                      {activeAdQuery.data.priceCents !== null &&
                        activeAdQuery.data.priceCents !== undefined && (
                          <span className="whitespace-nowrap font-bold text-lg text-success">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(activeAdQuery.data.priceCents / 100)}
                          </span>
                        )}
                    </div>

                    <hr className="my-4 border-muted" />

                    {/* Description */}
                    <div className="mb-6">
                      <h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Descrição
                      </h4>
                      <p className="whitespace-pre-line text-foreground text-sm leading-relaxed">
                        {activeAdQuery.data.description}
                      </p>
                    </div>

                    {activeAdQuery.data.tags &&
                      activeAdQuery.data.tags.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-1.5">
                          {activeAdQuery.data.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-muted/65 px-2 py-0.5 text-muted-foreground text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Contacts */}
                    <div>
                      <h4 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Contatos do anunciante
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {activeAdQuery.data.contactLinks.whatsapp && (
                          <a
                            href={`https://wa.me/${activeAdQuery.data.contactLinks.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              handleContactClick(
                                activeAdQuery.data.id,
                                'WHATSAPP',
                              )
                            }
                          >
                            <Button className="w-full">
                              <MessageCircle className="h-4.5 w-4.5" />
                              WhatsApp
                            </Button>
                          </a>
                        )}

                        {activeAdQuery.data.contactLinks.instagram && (
                          <a
                            href={`https://instagram.com/${activeAdQuery.data.contactLinks.instagram.replace(/@/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              handleContactClick(
                                activeAdQuery.data.id,
                                'INSTAGRAM',
                              )
                            }
                          >
                            <Button variant="outline" className="w-full">
                              <Instagram className="h-4.5 w-4.5 text-muted-foreground" />
                              Instagram
                            </Button>
                          </a>
                        )}

                        {activeAdQuery.data.contactLinks.website && (
                          <a
                            href={
                              activeAdQuery.data.contactLinks.website.startsWith(
                                'http',
                              )
                                ? activeAdQuery.data.contactLinks.website
                                : `https://${activeAdQuery.data.contactLinks.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              handleContactClick(
                                activeAdQuery.data.id,
                                'WEBSITE',
                              )
                            }
                            className="sm:col-span-2"
                          >
                            <Button variant="secondary" className="w-full">
                              <Globe className="h-4.5 w-4.5 text-muted-foreground" />
                              Website
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  Erro ao carregar dados do anúncio.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
