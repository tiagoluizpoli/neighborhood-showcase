import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@neighborhood-showcase/ui/components/dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnnouncementCard } from '@/components/announcement-card';
import { AnnouncementCardSkeleton } from '@/components/announcement-card-skeleton';
import { authClient } from '@/lib/auth-client';
import { PublicVitrineFilterControls } from '@/routes/portal/-public-vitrine-filter-controls';
import {
  allPublicVitrineCategoriesId,
  buildPublicAnnouncementQueryInput,
  hasPublicVitrineIpFallback,
  usePublicVitrineFilters,
} from '@/routes/portal/-public-vitrine-filters';
import { usePublicVitrineLocation } from '@/routes/portal/-public-vitrine-location';
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

  const {
    categoryId,
    filterByCondo,
    search,
    setCategoryId,
    setFilterByCondo,
    setSearch,
    setVerifiedOnly,
    verifiedOnly,
  } = usePublicVitrineFilters();

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
    trpc.announcement.listPublic.queryOptions(
      buildPublicAnnouncementQueryInput({
        coords,
        filters: {
          categoryId,
          filterByCondo,
          search,
          verifiedOnly,
        },
        geoPreference,
        ipLocation,
        isGpsFresh,
        radiusKm,
        selectedCondo,
        selectedRegion,
      }),
    ),
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

    if (categoryId !== allPublicVitrineCategoriesId) {
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
      {PublicVitrineFilterControls({
        backendCategories,
        categoryId,
        condoSearchQuery,
        condoSearchResults,
        filterByCondo,
        getLocationStatusText,
        isFiltersSheetOpen,
        isGpsFresh,
        isLocationSelectorOpen,
        isMobile,
        isSearchingCondos,
        onCategoryChange: setCategoryId,
        onCondoSearchQueryChange: setCondoSearchQuery,
        onFilterByCondoChange: setFilterByCondo,
        onFilterSheetOpenChange: setFilterSheetOpen,
        onGeoAllow: handleGeoAllow,
        onLocationSelectorOpenChange: setIsLocationSelectorOpen,
        onRadiusToggle: () => setRadiusKm(radiusKm === 10 ? 25 : 10),
        onRevokeLocation: revokeLocation,
        onSaveRegion: handleSaveRegion,
        onSearchChange: setSearch,
        onSelectCondo: selectCondoManually,
        onTempCityChange: setTempCity,
        onTempNeighborhoodChange: setTempNeighborhood,
        onVerifiedOnlyChange: setVerifiedOnly,
        radiusKm,
        search,
        selectedCondo,
        showLocationClearAction: Boolean(
          selectedCondo || coords || selectedRegion || ipLocation,
        ),
        t,
        tempCity,
        tempNeighborhood,
        verifiedOnly,
      })}

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
              hasIpFallback={hasPublicVitrineIpFallback({
                coords,
                geoPreference,
                ipLocation,
              })}
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
    </div>
  );
}
