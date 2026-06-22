import { describe, expect, test } from 'bun:test';
import {
  allPublicVitrineCategoriesId,
  buildPublicAnnouncementQueryInput,
  hasPublicVitrineIpFallback,
} from '@/routes/portal/-public-vitrine-filters';

describe('public vitrine filters', () => {
  test('builds public announcement query input from browsing state', () => {
    expect(
      buildPublicAnnouncementQueryInput({
        coords: { latitude: -27.59, longitude: -48.55 },
        filters: {
          categoryId: allPublicVitrineCategoriesId,
          filterByCondo: true,
          search: 'pizza',
          verifiedOnly: true,
        },
        geoPreference: 'granted',
        ipLocation: { city: 'Florianopolis', state: 'SC' },
        isGpsFresh: true,
        radiusKm: 25,
        selectedCondo: {
          id: 'condo-1',
          name: 'Residencial Azul',
          city: 'Florianopolis',
          state: 'SC',
          cep: '88000-000',
        },
        selectedRegion: { city: 'Florianopolis', neighborhood: 'Centro' },
      }),
    ).toEqual({
      latitude: -27.59,
      longitude: -48.55,
      condominiumId: 'condo-1',
      categoryId: undefined,
      search: 'pizza',
      verifiedOnly: true,
      userCondoId: 'condo-1',
      radiusKm: 25,
      city: 'Florianopolis',
      neighborhood: 'Centro',
      ipCity: 'Florianopolis',
      ipState: 'SC',
    });
  });

  test('drops condo and radius filters when they are not active', () => {
    expect(
      buildPublicAnnouncementQueryInput({
        coords: null,
        filters: {
          categoryId: 'cat-1',
          filterByCondo: false,
          search: '',
          verifiedOnly: false,
        },
        geoPreference: 'unset',
        ipLocation: null,
        isGpsFresh: false,
        radiusKm: 10,
        selectedCondo: {
          id: 'condo-1',
          name: 'Residencial Azul',
          city: 'Florianopolis',
          state: 'SC',
          cep: '88000-000',
        },
        selectedRegion: { city: 'Florianopolis' },
      }),
    ).toEqual({
      latitude: undefined,
      longitude: undefined,
      condominiumId: undefined,
      categoryId: 'cat-1',
      search: '',
      verifiedOnly: false,
      userCondoId: 'condo-1',
      radiusKm: undefined,
      city: 'Florianopolis',
      neighborhood: undefined,
      ipCity: undefined,
      ipState: undefined,
    });
  });

  test('reports ip fallback only when gps is not the active source', () => {
    expect(
      hasPublicVitrineIpFallback({
        coords: null,
        geoPreference: 'unset',
        ipLocation: { city: 'Florianopolis', state: 'SC' },
      }),
    ).toBe(true);

    expect(
      hasPublicVitrineIpFallback({
        coords: { latitude: -27.59, longitude: -48.55 },
        geoPreference: 'granted',
        ipLocation: { city: 'Florianopolis', state: 'SC' },
      }),
    ).toBe(false);
  });
});
