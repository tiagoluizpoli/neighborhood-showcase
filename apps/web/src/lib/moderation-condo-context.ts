import { useQuery } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { type RouterOutputs, trpc } from '@/utils/trpc';

/**
 * Single source of truth for the condominium a moderator is currently working
 * on. Persisted to localStorage and exposed as a reactive external store so the
 * sidebar selector and every moderation section stay in sync — changing the
 * condo in one place re-renders all consumers and refetches their queries.
 */
const STORAGE_KEY = 'mod_ctx__cndo';

type Assignment = RouterOutputs['assignment']['getMyAssignments'][number];
export type ModeratorAssignment = Assignment & { condominiumId: string };

export function isModeratorWithCondoId(
  a: Assignment,
): a is ModeratorAssignment {
  return (
    a.type === 'MODERATOR' &&
    a.status === 'APPROVED' &&
    typeof a.condominiumId === 'string'
  );
}

// ---------------------------------------------------------------------------
// External store — localStorage backed, reactive across the whole app
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keep other browser tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getModerationCondoId(): string | null {
  return getSnapshot();
}

export function setModerationCondoId(condoId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, condoId);
  } catch {
    // localStorage unavailable — fail silently
  }
  emitChange();
}

/** Reactive read of the raw stored condo id (may be stale/invalid). */
export function useModerationCondoId(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

// ---------------------------------------------------------------------------
// useModerationCondo — resolves the stored id against the moderator's
// assignments, auto-selecting the first valid condo, and exposes a setter.
// ---------------------------------------------------------------------------

export interface UseModerationCondoResult {
  assignments: ModeratorAssignment[];
  selectedId: string | null;
  selectedAssignment: ModeratorAssignment | null;
  selectedName: string | null;
  setSelected: (condoId: string) => void;
  isPending: boolean;
}

export function useModerationCondo(): UseModerationCondoResult {
  const { data, isPending } = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(undefined),
  );
  const storedId = useModerationCondoId();

  const assignments = (data ?? []).filter(isModeratorWithCondoId);
  const validIds = new Set(assignments.map((a) => a.condominiumId));

  let selectedId: string | null = null;
  if (storedId && validIds.has(storedId)) {
    selectedId = storedId;
  } else if (assignments.length > 0) {
    selectedId = assignments[0].condominiumId;
  }

  // Persist the auto-selected default so every consumer reads the same id.
  useEffect(() => {
    if (selectedId && selectedId !== storedId) {
      setModerationCondoId(selectedId);
    }
  }, [selectedId, storedId]);

  const selectedAssignment =
    assignments.find((a) => a.condominiumId === selectedId) ?? null;

  return {
    assignments,
    selectedId,
    selectedAssignment,
    selectedName: selectedAssignment?.condominium?.name ?? selectedId,
    setSelected: setModerationCondoId,
    isPending,
  };
}
