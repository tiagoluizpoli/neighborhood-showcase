import { Button } from '@neighborhood-showcase/ui/components/button';
import { Input } from '@neighborhood-showcase/ui/components/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@neighborhood-showcase/ui/components/tabs';
import { Loader2, MapPin, Search } from 'lucide-react';
import type { NearbyCondoSelection } from '@/utils/condominium-proximity';

interface PublicVitrineLocationSelectorProps {
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
  isSearchingCondos: boolean;
  onCondoSearchQueryChange: (value: string) => void;
  onGeoAllow: () => void;
  onSaveRegion: () => void;
  onSelectCondo: (condo: NearbyCondoSelection) => void;
  t: (key: string, options?: Record<string, string>) => string;
  tempCity: string;
  tempNeighborhood: string;
  onTempCityChange: (value: string) => void;
  onTempNeighborhoodChange: (value: string) => void;
}

export const PublicVitrineLocationSelector = ({
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
}: PublicVitrineLocationSelectorProps) => {
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
        <Button onClick={onGeoAllow} className="w-full">
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
              onChange={(e) => onTempCityChange(e.target.value)}
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
              onChange={(e) => onTempNeighborhoodChange(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={onSaveRegion} className="w-full">
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
            onChange={(e) => onCondoSearchQueryChange(e.target.value)}
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
                onClick={() => onSelectCondo(condo)}
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
