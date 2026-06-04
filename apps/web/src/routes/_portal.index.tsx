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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@neighborhood-showcase/ui/components/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@neighborhood-showcase/ui/components/tabs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getFreshStoredCoords = () => {
  const savedCoords = localStorage.getItem('user_coords');
  if (!savedCoords) return null;

  try {
    const parsed = JSON.parse(savedCoords);
    if (
      !parsed ||
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number'
    ) {
      return null;
    }

    const capturedAt = parsed.capturedAt || new Date().toISOString();
    const ageMs = Date.now() - new Date(capturedAt).getTime();
    if (ageMs >= 24 * 60 * 60 * 1000) {
      return null;
    }

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      capturedAt,
    };
  } catch {
    return null;
  }
};

function PublicVitrineComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedCondo, setSelectedCondo] = useState<SelectedCondo | null>(
    null,
  );
  const [selectedRegion, setSelectedRegion] = useState<{
    city: string;
    neighborhood?: string;
  } | null>(() => {
    const saved = localStorage.getItem('user_region');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [condoSearchQuery, setCondoSearchQuery] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempNeighborhood, setTempNeighborhood] = useState('');

  // Geolocation states
  const [geoPreference, setGeoPreference] = useState<
    'unset' | 'granted' | 'denied' | 'unavailable'
  >(() => {
    const pref = localStorage.getItem('geolocation_preference');
    return (pref as 'unset' | 'granted' | 'denied' | 'unavailable') || 'unset';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    capturedAt?: string;
  } | null>(() => getFreshStoredCoords());

  const [ipLocation, setIpLocation] = useState<{
    city: string;
    state: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Grid Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('Todos');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filterByCondo, setFilterByCondo] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(10);

  const nearbyCondoPromptDismissed =
    localStorage.getItem(nearbyCondoDismissedStorageKey) === 'true';

  // tRPC Queries
  const { data: backendCategories } = useQuery(
    trpc.announcement.listCategories.queryOptions(),
  );

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

  const isGpsFresh =
    geoPreference === 'granted' &&
    coords !== null &&
    (() => {
      const capturedAt = coords.capturedAt || new Date().toISOString();
      return Date.now() - new Date(capturedAt).getTime() < 24 * 60 * 60 * 1000;
    })();

  const { data: announcements, isLoading: isLoadingAds } = useQuery(
    trpc.announcement.listPublic.queryOptions({
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      condominiumId:
        filterByCondo && selectedCondo ? selectedCondo.id : undefined,
      categoryId: categoryId === 'Todos' ? undefined : categoryId,
      search,
      verifiedOnly,
      userCondoId: selectedCondo?.id,
      radiusKm: isGpsFresh ? radiusKm : undefined,
      city: selectedRegion?.city,
      neighborhood: selectedRegion?.neighborhood,
      ipCity: ipLocation?.city,
      ipState: ipLocation?.state,
    }),
  );

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
      const region_code = data.region_code;
      if (city && region_code) {
        setIpLocation({ city, state: region_code });
      }
    } catch (err) {
      console.error('IP fallback failed:', err);
    }
  }, []);

  const mapGeolocationError = useCallback(
    (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        localStorage.setItem('geolocation_preference', 'denied');
        setGeoPreference('denied');
        toast.error(t('location.err_permission_denied'));
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setGeoPreference('unavailable');
        toast.error(t('location.err_position_unavailable'));
      } else if (error.code === error.TIMEOUT) {
        setGeoPreference('unavailable');
        toast.error(t('location.err_timeout'));
      } else {
        setGeoPreference('unavailable');
        toast.error(t('location.unavailable'));
      }
    },
    [t],
  );

  const handleGeoAllow = () => {
    setIsLocationSelectorOpen(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coordsObj = {
            latitude,
            longitude,
            capturedAt: new Date().toISOString(),
          };
          resetNearbyCondoSelectionPrompt();
          setCoords(coordsObj);
          localStorage.setItem('user_coords', JSON.stringify(coordsObj));
          localStorage.setItem('geolocation_preference', 'granted');
          setGeoPreference('granted');
          setRefreshFailed(false);
          // Clear manual region/condo if gps selected
          setSelectedRegion(null);
          localStorage.removeItem('user_region');
          setSelectedCondo(null);
          localStorage.removeItem('user_condo');
          toast.success(t('location.fresh_gps'));
        },
        (error) => {
          console.error('Geolocation failed:', error);
          mapGeolocationError(error);
          fetchIpFallback();
        },
      );
    } else {
      setGeoPreference('unavailable');
      toast.error(t('location.err_unsupported'));
      fetchIpFallback();
    }
  };

  const revokeLocation = () => {
    localStorage.removeItem('geolocation_preference');
    localStorage.removeItem('user_coords');
    localStorage.removeItem('user_condo');
    localStorage.removeItem('user_region');
    resetNearbyCondoSelectionPrompt();
    setCoords(null);
    setSelectedCondo(null);
    setSelectedRegion(null);
    setIpLocation(null);
    setGeoPreference('unset');
    setRadiusKm(10);
    setIsLocationSelectorOpen(false);
    toast.success(t('location.clear'));
    fetchIpFallback();
  };

  const handleNearbyCondoConfirm = (condo: SelectedCondo) => {
    confirmNearbyCondoSelection(condo, setSelectedCondo);
    // Clear manual region if condo selected
    setSelectedRegion(null);
    localStorage.removeItem('user_region');
    toast.success(`${t('location.selected_condo')}: ${condo.name}`);
  };

  const handleNearbyCondoDismiss = () => {
    dismissNearbyCondoSelection(setSelectedCondo);
    toast.info(t('location.nearby_dismissed'));
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

    // Clear manual region and gps coords
    setSelectedRegion(null);
    localStorage.removeItem('user_region');
    setCoords(null);
    localStorage.removeItem('user_coords');
    setGeoPreference('unset');
    localStorage.setItem('geolocation_preference', 'unset');

    setIsLocationSelectorOpen(false);
    toast.success(`${t('location.selected_condo')}: ${condo.name}`);
  };

  const handleSaveRegion = () => {
    if (!tempCity.trim()) {
      toast.error(t('location.city_placeholder'));
      return;
    }
    const region = {
      city: tempCity.trim(),
      neighborhood: tempNeighborhood.trim() || undefined,
    };
    setSelectedRegion(region);
    localStorage.setItem('user_region', JSON.stringify(region));

    // Clear manual condo and gps coords
    setSelectedCondo(null);
    localStorage.removeItem('user_condo');
    setCoords(null);
    localStorage.removeItem('user_coords');
    setGeoPreference('unset');
    localStorage.setItem('geolocation_preference', 'unset');

    setIsLocationSelectorOpen(false);
    toast.success(t('location.selected_condo'));
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Geolocation and initial condo load
  useEffect(() => {
    const savedCondo = localStorage.getItem('user_condo');
    if (savedCondo) {
      setSelectedCondo(JSON.parse(savedCondo));
    }

    const savedRegion = localStorage.getItem('user_region');
    if (savedRegion) {
      setSelectedRegion(JSON.parse(savedRegion));
    }

    const freshStoredCoords = getFreshStoredCoords();

    if (freshStoredCoords) {
      setCoords(freshStoredCoords);
    }

    // Background refresh if prior grant
    if (geoPreference === 'granted') {
      if (navigator.geolocation) {
        setIsRefreshing(true);
        setRefreshFailed(false);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newCoordsObj = {
              latitude,
              longitude,
              capturedAt: new Date().toISOString(),
            };
            setIsRefreshing(false);

            if (freshStoredCoords) {
              const distance = getDistanceKm(
                freshStoredCoords.latitude,
                freshStoredCoords.longitude,
                latitude,
                longitude,
              );
              // Use a 1 km movement threshold before updating ranking/state
              if (distance >= 1) {
                setCoords(newCoordsObj);
                localStorage.setItem(
                  'user_coords',
                  JSON.stringify(newCoordsObj),
                );
              } else {
                // Keep existing coords state to avoid re-fetch, but refresh storage timestamp
                localStorage.setItem(
                  'user_coords',
                  JSON.stringify({
                    ...freshStoredCoords,
                    capturedAt: newCoordsObj.capturedAt,
                  }),
                );
              }
            } else {
              setCoords(newCoordsObj);
              localStorage.setItem('user_coords', JSON.stringify(newCoordsObj));
            }
          },
          (error) => {
            console.error('Background geolocation refresh failed:', error);
            setIsRefreshing(false);
            if (freshStoredCoords) {
              setRefreshFailed(true);
            } else {
              mapGeolocationError(error);
              fetchIpFallback();
            }
          },
        );
      } else {
        if (freshStoredCoords) {
          setRefreshFailed(true);
        } else {
          setGeoPreference('unavailable');
          fetchIpFallback();
        }
      }
    } else if (
      geoPreference === 'denied' ||
      geoPreference === 'unavailable' ||
      (!freshStoredCoords && geoPreference === 'unset')
    ) {
      fetchIpFallback();
    }
  }, [geoPreference, fetchIpFallback, mapGeolocationError]);

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

  const getLocationStatusText = () => {
    if (selectedCondo) {
      return `${t('location.selected_condo')}: ${selectedCondo.name}`;
    }
    if (coords) {
      if (isRefreshing) {
        return t('location.refreshing_gps');
      }
      if (refreshFailed) {
        return t('location.stale_gps_fail');
      }
      return t('location.fresh_gps');
    }
    if (selectedRegion) {
      return selectedRegion.neighborhood
        ? `${selectedRegion.city} - ${selectedRegion.neighborhood}`
        : selectedRegion.city;
    }
    if (ipLocation) {
      return `${t('location.ip_fallback')}: ${ipLocation.city}`;
    }
    if (geoPreference === 'denied') {
      return t('location.denied');
    }
    if (geoPreference === 'unavailable') {
      return t('location.unavailable');
    }
    return t('location.no_signal');
  };

  const renderSelectorContent = () => {
    return (
      <Tabs defaultValue="gps" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gps" className="text-xs">
            GPS
          </TabsTrigger>
          <TabsTrigger value="region" className="text-xs">
            {t('location.tab_region')}
          </TabsTrigger>
          <TabsTrigger value="condo" className="text-xs">
            {t('location.tab_condo')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gps" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-muted/40 p-4 text-center">
            <MapPin className="mx-auto mb-2 h-6 w-6 animate-pulse text-primary" />
            <p className="font-semibold text-sm">{t('location.option_gps')}</p>
            <p className="mt-1 text-muted-foreground text-xs">
              {t('location.option_gps_desc')}
            </p>
          </div>
          <Button onClick={handleGeoAllow} className="w-full">
            {t('location.option_gps')}
          </Button>
        </TabsContent>

        <TabsContent value="region" className="mt-4 space-y-4">
          <p className="text-muted-foreground text-xs">
            {t('location.option_region_desc')}
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                className="font-medium text-muted-foreground text-xs"
                htmlFor="temp-city-input"
              >
                {t('location.city_placeholder')} *
              </label>
              <Input
                id="temp-city-input"
                placeholder={t('location.city_example')}
                value={tempCity}
                onChange={(e) => setTempCity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label
                className="font-medium text-muted-foreground text-xs"
                htmlFor="temp-neighborhood-input"
              >
                {t('location.neighborhood_placeholder')}
              </label>
              <Input
                id="temp-neighborhood-input"
                placeholder={t('location.neighborhood_example')}
                value={tempNeighborhood}
                onChange={(e) => setTempNeighborhood(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveRegion} className="w-full">
            {t('moderation.confirm')}
          </Button>
        </TabsContent>

        <TabsContent value="condo" className="mt-4 space-y-4">
          <p className="text-muted-foreground text-xs">
            {t('location.option_condo_desc')}
          </p>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('location.condo_placeholder')}
              value={condoSearchQuery}
              onChange={(e) => setCondoSearchQuery(e.target.value)}
              className="bg-muted pl-9"
            />
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {isSearchingCondos ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-muted-foreground text-xs">
                  {t('moderation.confirm')}
                </span>
              </div>
            ) : condoSearchResults && condoSearchResults.length > 0 ? (
              condoSearchResults.map((condo) => (
                <button
                  type="button"
                  key={condo.id}
                  onClick={() => selectCondoManually(condo)}
                  className="flex w-full flex-col gap-0.5 rounded-lg border p-2.5 text-left hover:bg-muted"
                >
                  <span className="font-semibold text-xs">{condo.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {condo.city} - {condo.state} • CEP: {condo.cep}
                  </span>
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-muted-foreground text-xs">
                {t('location.condo_empty')}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      {/* Geolocation / Selected Location Control */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-xs">
              {t('location.modal_title')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm">
                {getLocationStatusText()}
              </span>
              {(selectedCondo || coords || selectedRegion || ipLocation) && (
                <button
                  type="button"
                  onClick={revokeLocation}
                  className="font-normal text-destructive text-xs hover:underline"
                >
                  ({t('location.clear')})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMobile ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLocationSelectorOpen(true)}
            >
              {t('location.change')}
            </Button>
          ) : (
            <Popover
              open={isLocationSelectorOpen}
              onOpenChange={setIsLocationSelectorOpen}
            >
              <PopoverTrigger
                render={
                  <Button variant="outline" size="sm">
                    {t('location.change')}
                  </Button>
                }
              />
              <PopoverContent className="w-96 p-5">
                <h3 className="mb-1 font-bold text-sm">
                  {t('location.modal_title')}
                </h3>
                <p className="mb-4 text-[10px] text-muted-foreground">
                  {t('location.modal_desc')}
                </p>
                {renderSelectorContent()}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

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
                  ? t('location.nearby_single_title', {
                      name: nearbyCondoMatch.condo.name,
                    })
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

      {/* Main Filter Section */}
      <div id="explorar" className="mb-8 flex flex-col gap-6">
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
          <Button
            type="button"
            onClick={() => setCategoryId('Todos')}
            variant={categoryId === 'Todos' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          {backendCategories?.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              variant={categoryId === cat.id ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
            >
              {cat.name}
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
                onClick={() =>
                  navigate({ to: '/anuncios/$id', params: { id: ad.id } })
                }
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
                            navigate({
                              to: '/anuncios/$id',
                              params: { id: ad.id },
                            });
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
      {isGpsFresh && (
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
                    ? t('location.radius_standard')
                    : t('location.radius_expanded')}
                </p>
                <p className="text-muted-foreground text-xs">
                  {radiusKm === 10
                    ? t('location.radius_standard_desc')
                    : t('location.radius_expanded_desc')}
                </p>
              </div>
            </div>
            <Button
              variant={radiusKm === 10 ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => setRadiusKm(radiusKm === 10 ? 25 : 10)}
              className="w-full shrink-0 font-semibold sm:w-auto"
            >
              {radiusKm === 10
                ? t('location.radius_expand')
                : t('location.radius_shrink')}
            </Button>
          </div>
        </div>
      )}

      {/* Como Funciona Section */}
      <div id="como-funciona" className="mt-16 rounded-xl border bg-card p-8">
        <h3 className="mb-6 text-center font-bold text-lg">Como Funciona</h3>
        <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
          <div>
            <div className="mb-2 font-semibold text-primary">
              1. Explore perto de você
            </div>
            <p className="text-muted-foreground text-sm">
              Descubra prestadores de serviços e produtos perto da sua
              localização ou condomínio.
            </p>
          </div>
          <div>
            <div className="mb-2 font-semibold text-primary">
              2. Confira quem anuncia
            </div>
            <p className="text-muted-foreground text-sm">
              Veja o perfil dos prestadores e saiba quem são os moradores
              verificados.
            </p>
          </div>
          <div>
            <div className="mb-2 font-semibold text-primary">
              3. Fale direto com o prestador
            </div>
            <p className="text-muted-foreground text-sm">
              Entre em contato via WhatsApp ou outros canais cadastrados com um
              clique.
            </p>
          </div>
        </div>
      </div>

      {/* Become a Provider Promo Section */}
      <div
        id="anunciar"
        className="mt-16 rounded-xl border bg-muted/30 p-8 text-center"
      >
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

      {/* Mobile Location Selector Sheet */}
      {isMobile && (
        <Sheet
          open={isLocationSelectorOpen}
          onOpenChange={setIsLocationSelectorOpen}
        >
          <SheetContent
            side="bottom"
            className="max-h-[90vh] w-full overflow-y-auto border-t p-6"
          >
            <SheetHeader>
              <SheetTitle className="font-bold text-lg">
                {t('location.modal_title')}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-xs">
                {t('location.modal_desc')}
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">{renderSelectorContent()}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
