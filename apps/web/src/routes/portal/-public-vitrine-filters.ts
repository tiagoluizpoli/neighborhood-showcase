import { useState } from 'react';
import type {
  GeoPreference,
  PublicVitrineCoords,
  PublicVitrineRegion,
} from '@/routes/portal/-public-vitrine-location-support';
import type { NearbyCondoSelection } from '@/utils/condominium-proximity';

export const allPublicVitrineCategoriesId = 'Todos';

export interface PublicVitrineFiltersState {
  categoryId: string;
  filterByCondo: boolean;
  search: string;
  verifiedOnly: boolean;
}

export interface BuildPublicAnnouncementQueryInputParams {
  coords: PublicVitrineCoords | null;
  filters: PublicVitrineFiltersState;
  geoPreference: GeoPreference;
  ipLocation: { city: string; state: string } | null;
  isGpsFresh: boolean;
  radiusKm: number;
  selectedCondo: NearbyCondoSelection | null;
  selectedRegion: PublicVitrineRegion | null;
}

export const buildPublicAnnouncementQueryInput = ({
  coords,
  filters,
  ipLocation,
  isGpsFresh,
  radiusKm,
  selectedCondo,
  selectedRegion,
}: BuildPublicAnnouncementQueryInputParams) => ({
  latitude: coords?.latitude,
  longitude: coords?.longitude,
  condominiumId:
    filters.filterByCondo && selectedCondo ? selectedCondo.id : undefined,
  categoryId:
    filters.categoryId === allPublicVitrineCategoriesId
      ? undefined
      : filters.categoryId,
  search: filters.search,
  verifiedOnly: filters.verifiedOnly,
  userCondoId: selectedCondo?.id,
  radiusKm: isGpsFresh ? radiusKm : undefined,
  city: selectedRegion?.city,
  neighborhood: selectedRegion?.neighborhood,
  ipCity: ipLocation?.city,
  ipState: ipLocation?.state,
});

export const hasPublicVitrineIpFallback = ({
  coords,
  geoPreference,
  ipLocation,
}: Pick<
  BuildPublicAnnouncementQueryInputParams,
  'coords' | 'geoPreference' | 'ipLocation'
>) => geoPreference !== 'granted' && coords === null && ipLocation !== null;

export const usePublicVitrineFilters = () => {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(allPublicVitrineCategoriesId);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filterByCondo, setFilterByCondo] = useState(false);

  return {
    categoryId,
    filterByCondo,
    search,
    setCategoryId,
    setFilterByCondo,
    setSearch,
    setVerifiedOnly,
    verifiedOnly,
  };
};
