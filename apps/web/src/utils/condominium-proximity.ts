export interface NearbyCondoSelection {
  id: string;
  name: string;
  city: string;
  state: string;
  cep: string;
}

export interface NearbyCondoResult {
  condo: NearbyCondoSelection;
  distance: number;
}

export type NearbyCondoMatch =
  | {
      mode: 'single';
      condo: NearbyCondoSelection;
      distance: number;
    }
  | {
      mode: 'list';
      condos: NearbyCondoResult[];
    };

const nearbyCondoRadiusMeters = 1_000;
export const nearbyCondoDismissedStorageKey = 'nearby_condo_prompt_dismissed';

export function deriveNearbyCondoMatch(
  results: NearbyCondoResult[],
): NearbyCondoMatch | null {
  const nearbyResults = results.filter(
    (result) => result.distance <= nearbyCondoRadiusMeters,
  );

  if (nearbyResults.length === 0) {
    return null;
  }

  if (nearbyResults.length === 1) {
    return {
      mode: 'single',
      condo: nearbyResults[0].condo,
      distance: nearbyResults[0].distance,
    };
  }

  return {
    mode: 'list',
    condos: nearbyResults,
  };
}

export function formatNearbyCondoDistance(distance: number): string {
  if (distance < 1_000) {
    return `${Math.round(distance)} m`;
  }

  return `${(distance / 1_000).toFixed(1)} km`;
}

export function confirmNearbyCondoSelection(
  condo: NearbyCondoSelection,
  setSelectedCondo: (condo: NearbyCondoSelection) => void,
): void {
  const selected = {
    id: condo.id,
    name: condo.name,
    city: condo.city,
    state: condo.state,
    cep: condo.cep,
  };

  setSelectedCondo(selected);
  localStorage.setItem('user_condo', JSON.stringify(selected));
  localStorage.removeItem(nearbyCondoDismissedStorageKey);
}

export function dismissNearbyCondoSelection(
  setSelectedCondo: (condo: NearbyCondoSelection | null) => void,
): void {
  setSelectedCondo(null);
  localStorage.removeItem('user_condo');
  localStorage.setItem(nearbyCondoDismissedStorageKey, 'true');
}

export function resetNearbyCondoSelectionPrompt(): void {
  localStorage.removeItem(nearbyCondoDismissedStorageKey);
}
