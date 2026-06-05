import { Button } from '@neighborhood-showcase/ui/components/button';
import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@neighborhood-showcase/ui/components/sheet';
import { PublicVitrineLocationSelector } from '@/routes/portal/-public-vitrine-location-selector';
import type { NearbyCondoSelection } from '@/utils/condominium-proximity';

interface PublicVitrineFilterSheetsProps {
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
  filterByCondo: boolean;
  isFiltersSheetOpen: boolean;
  isGpsFresh: boolean;
  isLocationSelectorOpen: boolean;
  isMobile: boolean;
  isSearchingCondos: boolean;
  onCondoSearchQueryChange: (value: string) => void;
  onFilterByCondoChange: (value: boolean) => void;
  onFilterSheetOpenChange: (value: boolean) => void;
  onGeoAllow: () => void;
  onLocationSelectorOpenChange: (value: boolean) => void;
  onRadiusToggle: () => void;
  onSaveRegion: () => void;
  onSelectCondo: (condo: NearbyCondoSelection) => void;
  onTempCityChange: (value: string) => void;
  onTempNeighborhoodChange: (value: string) => void;
  onVerifiedOnlyChange: (value: boolean) => void;
  radiusKm: number;
  selectedCondo: NearbyCondoSelection | null;
  t: (key: string, options?: Record<string, string>) => string;
  tempCity: string;
  tempNeighborhood: string;
  verifiedOnly: boolean;
}

export const PublicVitrineFilterSheets = ({
  condoSearchQuery,
  condoSearchResults,
  filterByCondo,
  isFiltersSheetOpen,
  isGpsFresh,
  isLocationSelectorOpen,
  isMobile,
  isSearchingCondos,
  onCondoSearchQueryChange,
  onFilterByCondoChange,
  onFilterSheetOpenChange,
  onGeoAllow,
  onLocationSelectorOpenChange,
  onRadiusToggle,
  onSaveRegion,
  onSelectCondo,
  onTempCityChange,
  onTempNeighborhoodChange,
  onVerifiedOnlyChange,
  radiusKm,
  selectedCondo,
  t,
  tempCity,
  tempNeighborhood,
  verifiedOnly,
}: PublicVitrineFilterSheetsProps) => (
  <>
    {isMobile ? (
      <Sheet
        open={isLocationSelectorOpen}
        onOpenChange={onLocationSelectorOpenChange}
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
          </div>
        </SheetContent>
      </Sheet>
    ) : null}

    <Sheet open={isFiltersSheetOpen} onOpenChange={onFilterSheetOpenChange}>
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
              onCheckedChange={(checked) =>
                onVerifiedOnlyChange(checked === true)
              }
            />
            <label
              htmlFor="verified-switch-mobile"
              className="cursor-pointer select-none font-medium text-sm"
            >
              Apenas moradores verificados
            </label>
          </div>

          {selectedCondo ? (
            <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-3">
              <Checkbox
                id="condo-filter-switch-mobile"
                checked={filterByCondo}
                onCheckedChange={(checked) =>
                  onFilterByCondoChange(checked === true)
                }
              />
              <label
                htmlFor="condo-filter-switch-mobile"
                className="cursor-pointer select-none font-medium text-sm"
              >
                Apenas neste condomínio
              </label>
            </div>
          ) : null}

          {isGpsFresh ? (
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
                onClick={onRadiusToggle}
                className="mt-3 w-full"
              >
                {radiusKm === 10
                  ? t('location.radius_expand')
                  : t('location.radius_shrink')}
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  </>
);
