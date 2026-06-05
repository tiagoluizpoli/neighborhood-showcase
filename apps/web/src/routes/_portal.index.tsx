import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { PublicVitrineAnnouncementGrid } from '@/routes/portal/-public-vitrine-announcement-grid';
import { PublicVitrineEmptyState } from '@/routes/portal/-public-vitrine-empty-state';
import { PublicVitrineFilterControls } from '@/routes/portal/-public-vitrine-filter-controls';
import {
  allPublicVitrineCategoriesId,
  buildPublicAnnouncementQueryInput,
  hasPublicVitrineIpFallback,
  usePublicVitrineFilters,
} from '@/routes/portal/-public-vitrine-filters';
import { usePublicVitrineLocation } from '@/routes/portal/-public-vitrine-location';
import { getNearbyCondoMatch } from '@/routes/portal/-public-vitrine-location-support';
import { PublicVitrineMarketingSections } from '@/routes/portal/-public-vitrine-marketing-sections';
import { PublicVitrineNearbyCondoPrompt } from '@/routes/portal/-public-vitrine-nearby-condo-prompt';
import { nearbyCondoDismissedStorageKey } from '@/utils/condominium-proximity';
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

      {PublicVitrineNearbyCondoPrompt({
        match: nearbyCondoMatch,
        onConfirm: handleNearbyCondoConfirm,
        onDismiss: handleNearbyCondoDismiss,
        t,
      })}

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
      {PublicVitrineAnnouncementGrid({
        announcements,
        emptyState: PublicVitrineEmptyState({
          backendCategories,
          categoryId,
          filterByCondo,
          hasSession: Boolean(session),
          ipLocation,
          isGpsFresh,
          onCategoryReset: () => setCategoryId(allPublicVitrineCategoriesId),
          onFilterByCondoChange: setFilterByCondo,
          onLocationSelectorOpen: () => setIsLocationSelectorOpen(true),
          onRadiusExpand: () => setRadiusKm(25),
          onRevokeLocation: revokeLocation,
          onSearchClear: () => setSearch(''),
          onVerifiedOnlyChange: setVerifiedOnly,
          radiusKm,
          search,
          selectedCondo,
          selectedRegion,
          verifiedOnly,
          visitorCoords: coords,
        }),
        hasIpFallback: hasPublicVitrineIpFallback({
          coords,
          geoPreference,
          ipLocation,
        }),
        isError: isErrorAds,
        isGpsFresh,
        isLoading: isLoadingAds,
        onContactClick: handleContactClick,
        onRetry: () => refetchAds(),
        selectedCondo,
        visitorCoords: coords,
      })}

      {PublicVitrineMarketingSections({
        hasSession: Boolean(session),
        t,
      })}
    </div>
  );
}
