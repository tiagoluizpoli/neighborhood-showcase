import { Button } from '@neighborhood-showcase/ui/components/button';
import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { PublicVitrineDesktopLocationPopover } from '@/routes/portal/-public-vitrine-desktop-location-popover';
import { PublicVitrineFilterSheets } from '@/routes/portal/-public-vitrine-filter-sheets';
import { allPublicVitrineCategoriesId } from '@/routes/portal/-public-vitrine-filters';
import type { NearbyCondoSelection } from '@/utils/condominium-proximity';

interface PublicVitrineFilterControlsProps {
  backendCategories: Array<{ id: string; name: string }> | undefined;
  categoryId: string;
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
  getLocationStatusText: () => string;
  isFiltersSheetOpen: boolean;
  isGpsFresh: boolean;
  isLocationSelectorOpen: boolean;
  isMobile: boolean;
  isSearchingCondos: boolean;
  onCategoryChange: (value: string) => void;
  onCondoSearchQueryChange: (value: string) => void;
  onFilterByCondoChange: (value: boolean) => void;
  onFilterSheetOpenChange: (value: boolean) => void;
  onGeoAllow: () => void;
  onLocationSelectorOpenChange: (value: boolean) => void;
  onRadiusToggle: () => void;
  onRevokeLocation: () => void;
  onSaveRegion: () => void;
  onSearchChange: (value: string) => void;
  onSelectCondo: (condo: NearbyCondoSelection) => void;
  onTempCityChange: (value: string) => void;
  onTempNeighborhoodChange: (value: string) => void;
  onVerifiedOnlyChange: (value: boolean) => void;
  radiusKm: number;
  search: string;
  selectedCondo: NearbyCondoSelection | null;
  filterByCondo: boolean;
  showLocationClearAction: boolean;
  t: (key: string, options?: Record<string, string>) => string;
  tempCity: string;
  tempNeighborhood: string;
  verifiedOnly: boolean;
}

export const PublicVitrineFilterControls = ({
  backendCategories,
  categoryId,
  condoSearchQuery,
  condoSearchResults,
  getLocationStatusText,
  isFiltersSheetOpen,
  isGpsFresh,
  isLocationSelectorOpen,
  isMobile,
  isSearchingCondos,
  onCategoryChange,
  onCondoSearchQueryChange,
  onFilterByCondoChange,
  onFilterSheetOpenChange,
  onGeoAllow,
  onLocationSelectorOpenChange,
  onRadiusToggle,
  onRevokeLocation,
  onSaveRegion,
  onSearchChange,
  onSelectCondo,
  onTempCityChange,
  onTempNeighborhoodChange,
  onVerifiedOnlyChange,
  radiusKm,
  search,
  selectedCondo,
  filterByCondo,
  showLocationClearAction,
  t,
  tempCity,
  tempNeighborhood,
  verifiedOnly,
}: PublicVitrineFilterControlsProps) => (
  <>
    <div id="explorar" className="mb-8">
      <div className="rounded-2xl border bg-card/70 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)_auto]">
            <div className="relative min-w-0">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('home.search_placeholder')}
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
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
                  {showLocationClearAction ? (
                    <button
                      type="button"
                      onClick={onRevokeLocation}
                      className="font-normal text-destructive text-xs hover:underline"
                    >
                      ({t('location.clear')})
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isMobile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLocationSelectorOpenChange(true)}
                  >
                    {t('location.change')}
                  </Button>
                ) : (
                  PublicVitrineDesktopLocationPopover({
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
                  })
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
                      onVerifiedOnlyChange(checked === true)
                    }
                  />
                  <label
                    htmlFor="verified-switch"
                    className="cursor-pointer select-none font-medium text-sm"
                  >
                    Apenas moradores verificados
                  </label>
                </div>
                {selectedCondo ? (
                  <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
                    <Checkbox
                      id="condo-filter-switch"
                      checked={filterByCondo}
                      onCheckedChange={(checked) =>
                        onFilterByCondoChange(checked === true)
                      }
                    />
                    <label
                      htmlFor="condo-filter-switch"
                      className="cursor-pointer select-none font-medium text-sm"
                    >
                      Apenas neste condomínio
                    </label>
                  </div>
                ) : null}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => onFilterSheetOpenChange(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>{t('home.filters')}</span>
              </Button>
            </div>
          </div>

          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              onClick={() => onCategoryChange(allPublicVitrineCategoriesId)}
              variant={
                categoryId === allPublicVitrineCategoriesId
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              className="whitespace-nowrap"
            >
              {allPublicVitrineCategoriesId}
            </Button>
            {backendCategories?.map((category) => (
              <Button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                variant={categoryId === category.id ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {isGpsFresh ? (
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
                onClick={onRadiusToggle}
                className="w-full shrink-0 md:w-auto"
              >
                {radiusKm === 10
                  ? t('location.radius_expand')
                  : t('location.radius_shrink')}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>

    {PublicVitrineFilterSheets({
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
    })}
  </>
);
