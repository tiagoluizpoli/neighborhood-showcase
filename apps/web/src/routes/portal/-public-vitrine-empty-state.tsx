import { Button } from '@neighborhood-showcase/ui/components/button';
import { Link } from '@tanstack/react-router';
import { CheckCircle2, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { allPublicVitrineCategoriesId } from '@/routes/portal/-public-vitrine-filters';

interface PublicVitrineCategory {
  id: string;
  name: string;
}

interface PublicVitrineSelectedCondo {
  id: string;
  name: string;
}

interface PublicVitrineRegion {
  city: string;
  neighborhood?: string;
}

interface PublicVitrineIpLocation {
  city: string;
  state: string;
}

interface ResolvePublicVitrineEmptyStateParams {
  backendCategories?: ReadonlyArray<PublicVitrineCategory>;
  categoryId: string;
  filterByCondo: boolean;
  ipLocation: PublicVitrineIpLocation | null;
  isGpsFresh: boolean;
  radiusKm: number;
  search: string;
  selectedCondo: PublicVitrineSelectedCondo | null;
  selectedRegion: PublicVitrineRegion | null;
  verifiedOnly: boolean;
  visitorCoords: { latitude: number; longitude: number } | null;
}

type PublicVitrineEmptyState =
  | { kind: 'search' }
  | { categoryName: string; kind: 'category' }
  | { kind: 'verified' }
  | { kind: 'condo' }
  | { kind: 'gps' }
  | { kind: 'region' }
  | { kind: 'default' };

interface PublicVitrineEmptyStateProps
  extends ResolvePublicVitrineEmptyStateParams {
  hasSession: boolean;
  onCategoryReset: () => void;
  onFilterByCondoChange: (nextValue: boolean) => void;
  onLocationSelectorOpen: () => void;
  onRadiusExpand: () => void;
  onRevokeLocation: () => void;
  onSearchClear: () => void;
  onVerifiedOnlyChange: (nextValue: boolean) => void;
}

export const resolvePublicVitrineEmptyState = ({
  backendCategories,
  categoryId,
  filterByCondo,
  ipLocation,
  isGpsFresh,
  radiusKm,
  search,
  selectedCondo,
  selectedRegion,
  verifiedOnly,
  visitorCoords,
}: ResolvePublicVitrineEmptyStateParams): PublicVitrineEmptyState => {
  if (search.trim() !== '') {
    return { kind: 'search' };
  }

  if (categoryId !== allPublicVitrineCategoriesId) {
    return {
      kind: 'category',
      categoryName:
        backendCategories?.find((category) => category.id === categoryId)
          ?.name ?? '',
    };
  }

  if (verifiedOnly) {
    return { kind: 'verified' };
  }

  if (filterByCondo && selectedCondo) {
    return { kind: 'condo' };
  }

  if (isGpsFresh && radiusKm === 10) {
    return { kind: 'gps' };
  }

  if (selectedRegion || ipLocation || visitorCoords) {
    return { kind: 'region' };
  }

  return { kind: 'default' };
};

export function PublicVitrineEmptyState(props: PublicVitrineEmptyStateProps) {
  const state = resolvePublicVitrineEmptyState(props);

  if (state.kind === 'search') {
    return (
      <div className="rounded-xl border bg-card py-20 text-center">
        <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="mb-1 font-medium text-lg">
          Nenhum resultado para "{props.search}"
        </h3>
        <p className="mx-auto mb-4 max-w-md px-4 text-muted-foreground text-sm">
          Verifique a ortografia ou tente buscar por outros termos.
        </p>
        <Button onClick={props.onSearchClear} variant="outline" size="sm">
          Limpar busca
        </Button>
      </div>
    );
  }

  if (state.kind === 'category') {
    return (
      <div className="rounded-xl border bg-card py-20 text-center">
        <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="mb-1 font-medium text-lg">
          Nenhum anúncio em {state.categoryName || props.categoryId}
        </h3>
        <p className="mx-auto mb-4 max-w-md px-4 text-muted-foreground text-sm">
          Não encontramos listagens ativas nesta categoria no momento.
        </p>
        <Button onClick={props.onCategoryReset} variant="outline" size="sm">
          Ver todas as categorias
        </Button>
      </div>
    );
  }

  if (state.kind === 'verified') {
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
          onClick={() => props.onVerifiedOnlyChange(false)}
          variant="outline"
          size="sm"
        >
          Mostrar todos os prestadores
        </Button>
      </div>
    );
  }

  if (state.kind === 'condo') {
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
            onClick={() => props.onFilterByCondoChange(false)}
            variant="outline"
            size="sm"
          >
            Ver anúncios da região
          </Button>
          <Button
            onClick={props.onLocationSelectorOpen}
            variant="outline"
            size="sm"
          >
            Alterar condomínio
          </Button>
        </div>
      </div>
    );
  }

  if (state.kind === 'gps') {
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
          <Button onClick={props.onRadiusExpand} variant="outline" size="sm">
            Expandir raio para 25 km
          </Button>
          <Button onClick={props.onRevokeLocation} variant="outline" size="sm">
            Limpar localização
          </Button>
        </div>
      </div>
    );
  }

  if (state.kind === 'region') {
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
            onClick={props.onLocationSelectorOpen}
            variant="outline"
            size="sm"
          >
            Ajustar localização
          </Button>
          <Button onClick={props.onRevokeLocation} variant="outline" size="sm">
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
        to={props.hasSession ? '/panel/dashboard' : '/auth'}
        search={props.hasSession ? undefined : { tab: 'signup' }}
      >
        <Button size="sm">Anunciar serviço</Button>
      </Link>
    </div>
  );
}
