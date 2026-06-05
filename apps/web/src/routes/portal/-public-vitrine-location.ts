import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  clearManualSelection,
  createCoords,
  type GeoPreference,
  getFreshStoredCoords,
  getLocationStatusText,
  getStoredJson,
  isFreshGpsSelection,
  loadIpFallback,
  type PublicVitrineCoords,
  type PublicVitrineRegion,
  persistGeoPreference,
  readGeoPreference,
  syncRefreshedCoords,
} from '@/routes/portal/-public-vitrine-location-support';
import {
  confirmNearbyCondoSelection,
  dismissNearbyCondoSelection,
  type NearbyCondoSelection,
  resetNearbyCondoSelectionPrompt,
} from '@/utils/condominium-proximity';

export const usePublicVitrineLocation = ({
  t,
}: {
  t: (key: string, options?: Record<string, string>) => string;
}) => {
  const [selectedCondo, setSelectedCondo] =
    useState<NearbyCondoSelection | null>(null);
  const [selectedRegion, setSelectedRegion] =
    useState<PublicVitrineRegion | null>(() =>
      getStoredJson<PublicVitrineRegion>('user_region'),
    );
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [condoSearchQuery, setCondoSearchQueryState] = useState('');
  const [tempCity, setTempCityState] = useState('');
  const [tempNeighborhood, setTempNeighborhoodState] = useState('');
  const [geoPreference, setGeoPreference] =
    useState<GeoPreference>(readGeoPreference);
  const [coords, setCoords] = useState<PublicVitrineCoords | null>(
    getFreshStoredCoords,
  );
  const [ipLocation, setIpLocation] = useState<{
    city: string;
    state: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [radiusKm, setRadiusKmState] = useState(10);

  const fetchIpFallback = useCallback(async () => {
    try {
      await loadIpFallback(setIpLocation);
    } catch (error) {
      console.error('IP fallback failed:', error);
    }
  }, []);

  const mapGeolocationError = useCallback(
    (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        persistGeoPreference('denied');
        setGeoPreference('denied');
        toast.error(t('location.err_permission_denied'));
        return;
      }

      if (error.code === error.POSITION_UNAVAILABLE) {
        setGeoPreference('unavailable');
        toast.error(t('location.err_position_unavailable'));
        return;
      }

      if (error.code === error.TIMEOUT) {
        setGeoPreference('unavailable');
        toast.error(t('location.err_timeout'));
        return;
      }

      setGeoPreference('unavailable');
      toast.error(t('location.unavailable'));
    },
    [t],
  );

  const handleGeoAllow = () => {
    setIsLocationSelectorOpen(false);
    if (!navigator.geolocation) {
      setGeoPreference('unavailable');
      toast.error(t('location.err_unsupported'));
      fetchIpFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = createCoords(
          position.coords.latitude,
          position.coords.longitude,
        );
        resetNearbyCondoSelectionPrompt();
        setCoords(nextCoords);
        localStorage.setItem('user_coords', JSON.stringify(nextCoords));
        persistGeoPreference('granted');
        setGeoPreference('granted');
        setRefreshFailed(false);
        setSelectedRegion(null);
        setSelectedCondo(null);
        clearManualSelection();
        toast.success(t('location.fresh_gps'));
      },
      (error) => {
        console.error('Geolocation failed:', error);
        mapGeolocationError(error);
        fetchIpFallback();
      },
    );
  };

  const revokeLocation = () => {
    localStorage.removeItem('geolocation_preference');
    localStorage.removeItem('user_coords');
    clearManualSelection();
    resetNearbyCondoSelectionPrompt();
    setCoords(null);
    setSelectedCondo(null);
    setSelectedRegion(null);
    setIpLocation(null);
    setGeoPreference('unset');
    setRadiusKmState(10);
    setIsLocationSelectorOpen(false);
    toast.success(t('location.clear'));
    fetchIpFallback();
  };

  const handleNearbyCondoConfirm = (condo: NearbyCondoSelection) => {
    confirmNearbyCondoSelection(condo, setSelectedCondo);
    setSelectedRegion(null);
    localStorage.removeItem('user_region');
    toast.success(`${t('location.selected_condo')}: ${condo.name}`);
  };

  const handleNearbyCondoDismiss = () => {
    dismissNearbyCondoSelection(setSelectedCondo);
    toast.info(t('location.nearby_dismissed'));
  };

  const selectCondoManually = (condo: NearbyCondoSelection) => {
    setSelectedCondo(condo);
    localStorage.setItem('user_condo', JSON.stringify(condo));
    setSelectedRegion(null);
    localStorage.removeItem('user_region');
    localStorage.removeItem('user_coords');
    setCoords(null);
    persistGeoPreference('unset');
    setGeoPreference('unset');
    setIsLocationSelectorOpen(false);
    toast.success(`${t('location.selected_condo')}: ${condo.name}`);
  };

  const handleSaveRegion = () => {
    if (!tempCity.trim()) {
      toast.error(t('location.city_placeholder'));
      return;
    }
    const nextRegion = {
      city: tempCity.trim(),
      neighborhood: tempNeighborhood.trim() || undefined,
    };
    setSelectedRegion(nextRegion);
    localStorage.setItem('user_region', JSON.stringify(nextRegion));
    setSelectedCondo(null);
    localStorage.removeItem('user_condo');
    localStorage.removeItem('user_coords');
    setCoords(null);
    persistGeoPreference('unset');
    setGeoPreference('unset');
    setIsLocationSelectorOpen(false);
    toast.success(t('location.selected_condo'));
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedCondo = getStoredJson<NearbyCondoSelection>('user_condo');
    const savedRegion = getStoredJson<PublicVitrineRegion>('user_region');
    const freshStoredCoords = getFreshStoredCoords();

    if (savedCondo) setSelectedCondo(savedCondo);
    if (savedRegion) setSelectedRegion(savedRegion);
    if (freshStoredCoords) setCoords(freshStoredCoords);

    if (geoPreference !== 'granted') {
      if (
        geoPreference === 'denied' ||
        geoPreference === 'unavailable' ||
        (!freshStoredCoords && geoPreference === 'unset')
      ) {
        fetchIpFallback();
      }
      return;
    }

    if (!navigator.geolocation) {
      if (freshStoredCoords) {
        setRefreshFailed(true);
      } else {
        setGeoPreference('unavailable');
        fetchIpFallback();
      }
      return;
    }

    setIsRefreshing(true);
    setRefreshFailed(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsRefreshing(false);
        syncRefreshedCoords({
          freshStoredCoords,
          nextCoords: createCoords(
            position.coords.latitude,
            position.coords.longitude,
          ),
          setCoords,
        });
      },
      (error) => {
        console.error('Background geolocation refresh failed:', error);
        setIsRefreshing(false);
        if (freshStoredCoords) {
          setRefreshFailed(true);
          return;
        }
        mapGeolocationError(error);
        fetchIpFallback();
      },
    );
  }, [fetchIpFallback, geoPreference, mapGeolocationError]);

  return {
    coords,
    condoSearchQuery,
    geoPreference,
    getLocationStatusText: () =>
      getLocationStatusText({
        coords,
        geoPreference,
        ipLocation,
        isRefreshing,
        refreshFailed,
        selectedCondo,
        selectedRegion,
        t,
      }),
    handleGeoAllow,
    handleNearbyCondoConfirm,
    handleNearbyCondoDismiss,
    handleSaveRegion,
    ipLocation,
    isFiltersSheetOpen,
    isGpsFresh: isFreshGpsSelection(geoPreference, coords),
    isLocationSelectorOpen,
    isMobile,
    radiusKm,
    revokeLocation,
    selectCondoManually,
    selectedCondo,
    selectedRegion,
    setCondoSearchQuery: setCondoSearchQueryState,
    setFilterSheetOpen: setIsFiltersSheetOpen,
    setIsLocationSelectorOpen,
    setRadiusKm: setRadiusKmState,
    setTempCity: setTempCityState,
    setTempNeighborhood: setTempNeighborhoodState,
    tempCity,
    tempNeighborhood,
  };
};
