import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
import { PublicVitrineLocationSelector } from '@/routes/portal/-public-vitrine-location-selector';
import type { NearbyCondoSelection } from '@/utils/condominium-proximity';

interface PublicVitrineDesktopLocationPopoverProps {
  condoSearchQuery: string;
  condoSearchResults:
    | Array<{
        id: string;
        name: string;
        city: string;
        state: string;
        cep: string;
      }>
    | undefined;
  isLocationSelectorOpen: boolean;
  isSearchingCondos: boolean;
  onCondoSearchQueryChange: (value: string) => void;
  onGeoAllow: () => void;
  onLocationSelectorOpenChange: (value: boolean) => void;
  onSaveRegion: () => void;
  onSelectCondo: (condo: NearbyCondoSelection) => void;
  onTempCityChange: (value: string) => void;
  onTempNeighborhoodChange: (value: string) => void;
  t: (key: string, options?: Record<string, string>) => string;
  tempCity: string;
  tempNeighborhood: string;
}

export const PublicVitrineDesktopLocationPopover = ({
  condoSearchQuery,
  condoSearchResults,
  isLocationSelectorOpen,
  isSearchingCondos,
  onCondoSearchQueryChange,
  onGeoAllow,
  onLocationSelectorOpenChange,
  onSaveRegion,
  onSelectCondo,
  onTempCityChange,
  onTempNeighborhoodChange,
  t,
  tempCity,
  tempNeighborhood,
}: PublicVitrineDesktopLocationPopoverProps) => (
  <Popover
    open={isLocationSelectorOpen}
    onOpenChange={onLocationSelectorOpenChange}
  >
    <PopoverTrigger
      render={
        <Button variant="outline" size="sm">
          {t('location.change')}
        </Button>
      }
    />
    <PopoverContent className="w-96 p-5">
      <h3 className="mb-1 font-bold text-sm">{t('location.modal_title')}</h3>
      <p className="mb-4 text-[10px] text-muted-foreground">
        {t('location.modal_desc')}
      </p>
      {PublicVitrineLocationSelector({
        condoSearchQuery,
        condoSearchResults,
        isSearchingCondos,
        onCondoSearchQueryChange,
        onGeoAllow,
        onSaveRegion,
        onSelectCondo,
        onTempCityChange,
        onTempNeighborhoodChange,
        t,
        tempCity,
        tempNeighborhood,
      })}
    </PopoverContent>
  </Popover>
);
