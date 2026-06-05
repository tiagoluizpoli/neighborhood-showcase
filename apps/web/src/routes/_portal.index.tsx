import { Button } from '@neighborhood-showcase/ui/components/button';
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnnouncementCard } from '@/components/announcement-card';
import { AnnouncementCardSkeleton } from '@/components/announcement-card-skeleton';
import { authClient } from '@/lib/auth-client';
import { usePublicVitrineLocation } from '@/routes/portal/-public-vitrine-location';
import { PublicVitrineLocationSelector } from '@/routes/portal/-public-vitrine-location-selector';
import { getNearbyCondoMatch } from '@/routes/portal/-public-vitrine-location-support';
import {
  formatNearbyCondoDistance,
  nearbyCondoDismissedStorageKey,
} from '@/utils/condominium-proximity';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/_portal/')({
  component: PublicVitrineComponent,
});

function PublicVitrineComponent() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const {
    coords,
    condoSearchQuery,
    geoPreference,
    getLocationStatusText,
    handleGeoAllow,
    handleNearbyCondoConfirm,
    handleNearbyCondoDismiss,
    handleSaveRegion,
    ipLocation,
    isFiltersSheetOpen,
    isGpsFresh,
    isLocationSelectorOpen,
    isMobile,
    radiusKm,
    revokeLocation,
    selectCondoManually,
    selectedCondo,
    selectedRegion,
    setCondoSearchQuery,
    setFilterSheetOpen,
    setIsLocationSelectorOpen,
    setRadiusKm,
    setTempCity,
    setTempNeighborhood,
    tempCity,
    tempNeighborhood,
  } = usePublicVitrineLocation({ t });

  // Grid Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('Todos');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filterByCondo, setFilterByCondo] = useState(false);

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
  const nearbyCondoMatch = getNearbyCondoMatch({
    geoPreference,
    nearbyCondoPromptDismissed:
      localStorage.getItem(nearbyCondoDismissedStorageKey) === 'true',
    nearbyCondoResults,
    selectedCondo,
  });

  const {
    data: announcements,
    isLoading: isLoadingAds,
    isError: isErrorAds,
    refetch: refetchAds,
  } = useQuery(
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

  const getEmptyStateContent = () => {
    if (search.trim() !== '') {
      return (
        <div className="rounded-xl border bg-card py-20 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 font-medium text-lg">
            Nenhum resultado para "{search}"
          </h3>
          <p className="mx-auto mb-4 max-w-md px-4 text-muted-foreground text-sm">
            Verifique a ortografia ou tente buscar por outros termos.
          </p>
          <Button onClick={() => setSearch('')} variant="outline" size="sm">
            Limpar busca
          </Button>
        </div>
      );
    }

    if (categoryId !== 'Todos') {
      const categoryName =
        backendCategories?.find((c) => c.id === categoryId)?.name || '';
      return (
        <div className="rounded-xl border bg-card py-20 text-center">
          <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 font-medium text-lg">
            Nenhum anúncio em {categoryName || categoryId}
          </h3>
          <p className="mx-auto mb-4 max-w-md px-4 text-muted-foreground text-sm">
            Não encontramos listagens ativas nesta categoria no momento.
          </p>
          <Button
            onClick={() => setCategoryId('Todos')}
            variant="outline"
            size="sm"
          >
            Ver todas as categorias
          </Button>
        </div>
      );
    }

    if (verifiedOnly) {
      return (
        <div className="rounded-xl border bg-card py-20 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 font-medium text-lg">
            Nenhum morador verificado encontrado
          </h3>
          <p className="mx-auto mb-4 max-w-md px-4 text-muted-foreground text-sm">
            Não encontramos prestadores que sejam moradores verificados com os
            filtros atuais.
          </p>
          <Button
            onClick={() => setVerifiedOnly(false)}
            variant="outline"
            size="sm"
          >
            Mostrar todos os prestadores
          </Button>
        </div>
      );
    }

    if (filterByCondo && selectedCondo) {
      return (
        <div className="rounded-xl border bg-card py-20 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 font-medium text-lg">
            Ainda não há anúncios neste condomínio
          </h3>
          <p className="mx-auto mb-4 max-w-md px-4 text-muted-foreground text-sm">
            Seja o primeiro a anunciar para seus vizinhos ou explore a região ao
            redor.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setFilterByCondo(false)}
              variant="outline"
              size="sm"
            >
              Ver anúncios da região
            </Button>
            <Button
              onClick={() => setIsLocationSelectorOpen(true)}
              variant="outline"
              size="sm"
            >
              Alterar condomínio
            </Button>
          </div>
        </div>
      );
    }

    if (isGpsFresh && radiusKm === 10) {
      return (
        <div className="rounded-xl border bg-card py-20 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 font-medium text-lg">
            Nenhum anúncio encontrado nesta região
          </h3>
          <p className="mx-auto mb-4 max-w-md px-4 text-muted-foreground text-sm">
            Não há serviços cadastrados em um raio de 10 km da sua localização.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setRadiusKm(25)} variant="outline" size="sm">
              Expandir raio para 25 km
            </Button>
            <Button onClick={revokeLocation} variant="outline" size="sm">
              Limpar localização
            </Button>
          </div>
        </div>
      );
    }

    if (selectedRegion || ipLocation || coords) {
      return (
        <div className="rounded-xl border bg-card py-20 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 font-medium text-lg">
            Nenhum anúncio encontrado nesta região
          </h3>
          <p className="mx-auto mb-4 max-w-md px-4 text-muted-foreground text-sm">
            Tente buscar em outras cidades ou limpar sua localização atual.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setIsLocationSelectorOpen(true)}
              variant="outline"
              size="sm"
            >
              Ajustar localização
            </Button>
            <Button onClick={revokeLocation} variant="outline" size="sm">
              Limpar localização
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border bg-card py-20 text-center">
        <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="mb-1 font-medium text-lg">
          Ainda não há anúncios publicados
        </h3>
        <p className="mx-auto mb-6 max-w-md px-4 text-muted-foreground text-sm">
          Seja o primeiro prestador a divulgar seus serviços na plataforma!
        </p>
        <Link
          to={session ? '/panel/dashboard' : '/auth'}
          search={session ? undefined : { tab: 'signup' }}
        >
          <Button size="sm">Anunciar serviço</Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <section className="mb-6 rounded-2xl border bg-muted/30 px-5 py-5 md:px-6">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="font-semibold text-primary text-xs uppercase tracking-[0.24em]">
            {t('home.hero.eyebrow')}
          </span>
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
            {t('home.hero.title')}
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
            {t('home.hero.description')}
          </p>
        </div>
      </section>

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
      <div id="explorar" className="mb-8">
        <div className="rounded-2xl border bg-card/70 p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)_auto]">
              <div className="relative min-w-0">
                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('home.search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 bg-background pl-10"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
                    {t('location.modal_title')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-sm">
                      {getLocationStatusText()}
                    </span>
                    {(selectedCondo ||
                      coords ||
                      selectedRegion ||
                      ipLocation) && (
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

                <div className="flex shrink-0 items-center gap-2">
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
                        {PublicVitrineLocationSelector({
                          condoSearchQuery,
                          condoSearchResults,
                          isSearchingCondos,
                          onCondoSearchQueryChange: setCondoSearchQuery,
                          onGeoAllow: handleGeoAllow,
                          onSaveRegion: handleSaveRegion,
                          onSelectCondo: selectCondoManually,
                          onTempCityChange: setTempCity,
                          onTempNeighborhoodChange: setTempNeighborhood,
                          t,
                          tempCity,
                          tempNeighborhood,
                        })}
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-end gap-2">
                <div className="hidden flex-wrap items-center gap-2 md:flex">
                  <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
                    <Checkbox
                      id="verified-switch"
                      checked={verifiedOnly}
                      onCheckedChange={(checked) =>
                        setVerifiedOnly(checked === true)
                      }
                    />
                    <label
                      htmlFor="verified-switch"
                      className="cursor-pointer select-none font-medium text-sm"
                    >
                      Apenas moradores verificados
                    </label>
                  </div>
                  {selectedCondo && (
                    <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
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

                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setFilterSheetOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>{t('home.filters')}</span>
                </Button>
              </div>
            </div>

            {/* Categories Tab Swiper */}
            <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
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

            {isGpsFresh && (
              <div
                className={`flex flex-col gap-3 rounded-xl border px-4 py-3 md:flex-row md:items-center md:justify-between ${
                  radiusKm === 25
                    ? 'border-warning/40 bg-warning/5'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin
                    className={`mt-0.5 h-4 w-4 ${
                      radiusKm === 25 ? 'text-warning' : 'text-primary'
                    }`}
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
                  className="w-full shrink-0 md:w-auto"
                >
                  {radiusKm === 10
                    ? t('location.radius_expand')
                    : t('location.radius_shrink')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      {isErrorAds ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 py-20 text-center">
          <p className="font-semibold text-destructive text-lg">
            Não conseguimos carregar os anúncios agora.
          </p>
          <Button
            onClick={() => refetchAds()}
            variant="outline"
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      ) : isLoadingAds ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <AnnouncementCardSkeleton key={i} />
          ))}
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {announcements.map((ad) => (
            <AnnouncementCard
              key={ad.id}
              ad={ad}
              selectedCondo={selectedCondo}
              visitorCoords={coords}
              isGpsFresh={isGpsFresh}
              hasIpFallback={
                geoPreference !== 'granted' &&
                coords === null &&
                ipLocation !== null
              }
              onContactClick={handleContactClick}
            />
          ))}
        </div>
      ) : (
        getEmptyStateContent()
      )}

      {/* Como Funciona Section */}
      <div id="como-funciona" className="mt-16 px-1">
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-6 font-semibold text-lg md:text-xl">
            {t('home.how_it_works.title')}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3 rounded-xl border bg-background px-4 py-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {t('home.how_it_works.step_1_title')}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {t('home.how_it_works.step_1_description')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border bg-background px-4 py-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {t('home.how_it_works.step_2_title')}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {t('home.how_it_works.step_2_description')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border bg-background px-4 py-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {t('home.how_it_works.step_3_title')}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {t('home.how_it_works.step_3_description')}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            {t('home.how_it_works.provider_note')}
          </p>
        </div>
      </div>

      {/* Become a Provider Promo Section */}
      <div
        id="anunciar"
        className="-mx-4 mt-16 border-y bg-muted/30 px-6 py-12 text-center md:-mx-6 md:px-8 lg:-mx-8"
      >
        <div className="mx-auto max-w-3xl">
          <h3 className="mb-2 font-bold text-xl md:text-2xl">
            {t('home.anunciar.title')}
          </h3>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground text-sm md:text-base">
            {t('home.anunciar.description')}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {session ? (
              <Link to="/panel/dashboard">
                <Button variant="default" size="lg">
                  {t('home.anunciar.cta')}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" search={{ tab: 'signup' }}>
                  <Button variant="default" size="lg">
                    {t('home.anunciar.cta')}
                  </Button>
                </Link>
                <Link
                  to="/auth"
                  search={{ tab: 'signin' }}
                  className="font-medium text-primary text-sm hover:underline"
                >
                  {t('home.anunciar.has_account')}
                </Link>
              </>
            )}
          </div>
        </div>
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
            <div className="py-4">
              {PublicVitrineLocationSelector({
                condoSearchQuery,
                condoSearchResults,
                isSearchingCondos,
                onCondoSearchQueryChange: setCondoSearchQuery,
                onGeoAllow: handleGeoAllow,
                onSaveRegion: handleSaveRegion,
                onSelectCondo: selectCondoManually,
                onTempCityChange: setTempCity,
                onTempNeighborhoodChange: setTempNeighborhood,
                t,
                tempCity,
                tempNeighborhood,
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}

      <Sheet open={isFiltersSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] w-full overflow-y-auto border-t p-6 md:hidden"
        >
          <SheetHeader>
            <SheetTitle className="font-bold text-lg">
              {t('home.filters_title')}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-xs">
              {t('home.filters_description')}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-3">
              <Checkbox
                id="verified-switch-mobile"
                checked={verifiedOnly}
                onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
              />
              <label
                htmlFor="verified-switch-mobile"
                className="cursor-pointer select-none font-medium text-sm"
              >
                Apenas moradores verificados
              </label>
            </div>

            {selectedCondo && (
              <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-3">
                <Checkbox
                  id="condo-filter-switch-mobile"
                  checked={filterByCondo}
                  onCheckedChange={(checked) =>
                    setFilterByCondo(checked === true)
                  }
                />
                <label
                  htmlFor="condo-filter-switch-mobile"
                  className="cursor-pointer select-none font-medium text-sm"
                >
                  Apenas neste condomínio
                </label>
              </div>
            )}

            {isGpsFresh && (
              <div className="rounded-xl border bg-background px-4 py-3">
                <p className="font-semibold text-sm">
                  {radiusKm === 10
                    ? t('location.radius_standard')
                    : t('location.radius_expanded')}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {radiusKm === 10
                    ? t('location.radius_standard_desc')
                    : t('location.radius_expanded_desc')}
                </p>
                <Button
                  variant={radiusKm === 10 ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => setRadiusKm(radiusKm === 10 ? 25 : 10)}
                  className="mt-3 w-full"
                >
                  {radiusKm === 10
                    ? t('location.radius_expand')
                    : t('location.radius_shrink')}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
