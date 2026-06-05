import type {
  NearbyCondoMatch,
  NearbyCondoResult,
  NearbyCondoSelection,
} from '@/utils/condominium-proximity';
import { deriveNearbyCondoMatch } from '@/utils/condominium-proximity';

export type GeoPreference = 'unset' | 'granted' | 'denied' | 'unavailable';

export interface PublicVitrineRegion {
  city: string;
  neighborhood?: string;
}

export interface PublicVitrineCoords {
  latitude: number;
  longitude: number;
  capturedAt?: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const GPS_REFRESH_DISTANCE_KM = 1;

export const createCoords = (
  latitude: number,
  longitude: number,
): PublicVitrineCoords => ({
  latitude,
  longitude,
  capturedAt: new Date().toISOString(),
});

export const getStoredJson = <T>(key: string): T | null => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const getFreshStoredCoords = (): PublicVitrineCoords | null => {
  const parsed = getStoredJson<PublicVitrineCoords>('user_coords');
  if (
    !parsed ||
    typeof parsed.latitude !== 'number' ||
    typeof parsed.longitude !== 'number'
  ) {
    return null;
  }

  const capturedAt = parsed.capturedAt || new Date().toISOString();
  const ageMs = Date.now() - new Date(capturedAt).getTime();
  if (ageMs >= ONE_DAY_MS) {
    return null;
  }

  return {
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    capturedAt,
  };
};

export const readGeoPreference = (): GeoPreference => {
  const pref = localStorage.getItem('geolocation_preference');
  if (
    pref === 'granted' ||
    pref === 'denied' ||
    pref === 'unavailable' ||
    pref === 'unset'
  ) {
    return pref;
  }

  return 'unset';
};

export const persistGeoPreference = (preference: GeoPreference) => {
  localStorage.setItem('geolocation_preference', preference);
};

export const clearManualSelection = () => {
  localStorage.removeItem('user_region');
  localStorage.removeItem('user_condo');
};

export const loadIpFallback = async (
  setIpLocation: (value: { city: string; state: string }) => void,
) => {
  const res = await fetch('https://ipapi.co/json/');
  if (!res.ok) {
    throw new Error('IP api failed');
  }

  const data = await res.json();
  if (data.city && data.region_code) {
    setIpLocation({ city: data.city, state: data.region_code });
  }
};

export const isFreshGpsSelection = (
  geoPreference: GeoPreference,
  coords: PublicVitrineCoords | null,
) =>
  geoPreference === 'granted' &&
  coords !== null &&
  (() => {
    const capturedAt = coords.capturedAt || new Date().toISOString();
    return Date.now() - new Date(capturedAt).getTime() < ONE_DAY_MS;
  })();

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
};

export const syncRefreshedCoords = ({
  freshStoredCoords,
  nextCoords,
  setCoords,
}: {
  freshStoredCoords: PublicVitrineCoords | null;
  nextCoords: PublicVitrineCoords;
  setCoords: (coords: PublicVitrineCoords) => void;
}) => {
  if (!freshStoredCoords) {
    setCoords(nextCoords);
    localStorage.setItem('user_coords', JSON.stringify(nextCoords));
    return;
  }

  const distance = getDistanceKm(
    freshStoredCoords.latitude,
    freshStoredCoords.longitude,
    nextCoords.latitude,
    nextCoords.longitude,
  );

  if (distance >= GPS_REFRESH_DISTANCE_KM) {
    setCoords(nextCoords);
    localStorage.setItem('user_coords', JSON.stringify(nextCoords));
    return;
  }

  localStorage.setItem(
    'user_coords',
    JSON.stringify({
      ...freshStoredCoords,
      capturedAt: nextCoords.capturedAt,
    }),
  );
};

export const getLocationStatusText = ({
  coords,
  geoPreference,
  ipLocation,
  isRefreshing,
  refreshFailed,
  selectedCondo,
  selectedRegion,
  t,
}: {
  coords: PublicVitrineCoords | null;
  geoPreference: GeoPreference;
  ipLocation: { city: string; state: string } | null;
  isRefreshing: boolean;
  refreshFailed: boolean;
  selectedCondo: NearbyCondoSelection | null;
  selectedRegion: PublicVitrineRegion | null;
  t: (key: string, options?: Record<string, string>) => string;
}) => {
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

export const getNearbyCondoMatch = ({
  geoPreference,
  nearbyCondoPromptDismissed,
  nearbyCondoResults,
  selectedCondo,
}: {
  geoPreference: GeoPreference;
  nearbyCondoPromptDismissed: boolean;
  nearbyCondoResults?: NearbyCondoResult[];
  selectedCondo: NearbyCondoSelection | null;
}): NearbyCondoMatch | null => {
  if (
    geoPreference !== 'granted' ||
    selectedCondo ||
    nearbyCondoPromptDismissed ||
    !nearbyCondoResults ||
    nearbyCondoResults.length === 0
  ) {
    return null;
  }

  return deriveNearbyCondoMatch(nearbyCondoResults);
};
