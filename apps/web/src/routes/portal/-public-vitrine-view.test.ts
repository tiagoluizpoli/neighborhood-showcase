import { describe, expect, test } from 'bun:test';
import {
  PublicVitrineAnnouncementGrid,
  resolvePublicVitrineAnnouncementGridState,
} from '@/routes/portal/-public-vitrine-announcement-grid';
import {
  PublicVitrineEmptyState,
  resolvePublicVitrineEmptyState,
} from '@/routes/portal/-public-vitrine-empty-state';

describe('public vitrine view seams', () => {
  test('resolves category empty state with backend category label', () => {
    expect(
      resolvePublicVitrineEmptyState({
        backendCategories: [{ id: 'food', name: 'Alimentação' }],
        categoryId: 'food',
        filterByCondo: false,
        ipLocation: null,
        isGpsFresh: false,
        radiusKm: 10,
        search: '',
        selectedCondo: null,
        selectedRegion: null,
        verifiedOnly: false,
        visitorCoords: null,
      }),
    ).toEqual({
      kind: 'category',
      categoryName: 'Alimentação',
    });
  });

  test('prioritizes condo empty state over generic region state', () => {
    expect(
      resolvePublicVitrineEmptyState({
        backendCategories: [],
        categoryId: 'Todos',
        filterByCondo: true,
        ipLocation: { city: 'Florianopolis', state: 'SC' },
        isGpsFresh: false,
        radiusKm: 10,
        search: '',
        selectedCondo: { id: 'condo-1', name: 'Residencial Azul' },
        selectedRegion: { city: 'Florianopolis' },
        verifiedOnly: false,
        visitorCoords: null,
      }),
    ).toEqual({
      kind: 'condo',
    });
  });

  test('resolves grid state by error, loading, results, then empty', () => {
    expect(
      resolvePublicVitrineAnnouncementGridState({
        announcements: [{ id: 'ann-1' }],
        isError: true,
        isLoading: true,
      }),
    ).toEqual({ kind: 'error' });

    expect(
      resolvePublicVitrineAnnouncementGridState({
        announcements: [{ id: 'ann-1' }],
        isError: false,
        isLoading: true,
      }),
    ).toEqual({ kind: 'loading' });

    expect(
      resolvePublicVitrineAnnouncementGridState({
        announcements: [{ id: 'ann-1' }],
        isError: false,
        isLoading: false,
      }),
    ).toEqual({
      announcements: [{ id: 'ann-1' }],
      kind: 'results',
    });

    expect(
      resolvePublicVitrineAnnouncementGridState({
        announcements: [],
        isError: false,
        isLoading: false,
      }),
    ).toEqual({ kind: 'empty' });
  });

  test('renders empty-state call to action for signed-out visitors', () => {
    const view = PublicVitrineEmptyState({
      backendCategories: [],
      categoryId: 'Todos',
      filterByCondo: false,
      hasSession: false,
      ipLocation: null,
      isGpsFresh: false,
      onCategoryReset: () => {},
      onFilterByCondoChange: () => {},
      onLocationSelectorOpen: () => {},
      onRadiusExpand: () => {},
      onRevokeLocation: () => {},
      onSearchClear: () => {},
      onVerifiedOnlyChange: () => {},
      radiusKm: 10,
      search: '',
      selectedCondo: null,
      selectedRegion: null,
      verifiedOnly: false,
      visitorCoords: null,
    });

    expect(view.props.children[3].props.to).toBe('/auth');
    expect(view.props.children[3].props.search).toEqual({ tab: 'signup' });
  });

  test('renders grid results through announcement cards', () => {
    const view = PublicVitrineAnnouncementGrid({
      announcements: [{ id: 'ann-1' }],
      emptyState: 'empty',
      hasIpFallback: false,
      isError: false,
      isGpsFresh: true,
      isLoading: false,
      onContactClick: () => {},
      onRetry: () => {},
      selectedCondo: null,
      visitorCoords: null,
    });

    expect(view.props.children).toHaveLength(1);
    expect(view.props.children[0].props.ad.id).toBe('ann-1');
  });
});
