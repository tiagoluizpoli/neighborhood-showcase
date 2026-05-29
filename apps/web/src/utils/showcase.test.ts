import { describe, expect, test } from 'bun:test';
import {
  type AnnouncementForSort,
  filterAnnouncements,
  sortAnnouncements,
} from './showcase';

describe('Public Showcase Discovery Helper Logic', () => {
  const mockAds: AnnouncementForSort[] = [
    {
      id: 'ad-1',
      condominiumId: 'condo-a', // Floripa
      condoCity: 'Florianópolis',
      condoState: 'SC',
      title: 'Delicious Pizza',
      subtitle: 'Best in Floripa',
      description: 'Warm pizza in Condo A Floripa',
      category: 'Alimentação',
      showVerifiedBadge: true,
      createdAt: new Date(Date.now() - 20000).toISOString(),
    },
    {
      id: 'ad-2',
      condominiumId: 'condo-b', // Floripa
      condoCity: 'Florianópolis',
      condoState: 'SC',
      title: 'House Cleaner',
      description: 'Professional cleaning services in Condo B',
      category: 'Serviços',
      showVerifiedBadge: false,
      createdAt: new Date(Date.now() - 10000).toISOString(),
    },
    {
      id: 'ad-3',
      condominiumId: 'condo-c', // Curitiba
      condoCity: 'Curitiba',
      condoState: 'PR',
      title: 'Premium Burger',
      subtitle: 'Burgers & Fries',
      description: 'Handmade burger in Condo C Curitiba',
      category: 'Alimentação',
      showVerifiedBadge: true,
      createdAt: new Date().toISOString(),
    },
  ];

  test('sorts announcements with exact condominium match prioritized first, then same city/state', () => {
    // Selected condo is condo-b (Floripa)
    const sorted = sortAnnouncements(mockAds, 'condo-b', 'Florianópolis', 'SC');
    expect(sorted.length).toBe(3);
    // 1st: Condo B match
    expect(sorted[0].id).toBe('ad-2');
    // 2nd: Condo A (Floripa match, same city)
    expect(sorted[1].id).toBe('ad-1');
    // 3rd: Condo C (Curitiba, different city)
    expect(sorted[2].id).toBe('ad-3');
  });

  test('sorts by newest first as fallback when no proximity matches', () => {
    // No geolocated condo/city provided
    const sorted = sortAnnouncements(mockAds);
    expect(sorted.length).toBe(3);
    // ad-3 is the newest
    expect(sorted[0].id).toBe('ad-3');
    // ad-2 is second
    expect(sorted[1].id).toBe('ad-2');
    // ad-1 is third
    expect(sorted[2].id).toBe('ad-1');
  });

  test('filters by category tab', () => {
    const filtered = filterAnnouncements(mockAds, {
      category: 'Alimentação',
      search: '',
      verifiedOnly: false,
    });
    expect(filtered.length).toBe(2);
    expect(filtered.map((x) => x.id)).toContain('ad-1');
    expect(filtered.map((x) => x.id)).toContain('ad-3');
  });

  test('filters by verified only switch', () => {
    const filtered = filterAnnouncements(mockAds, {
      category: 'Todos',
      search: '',
      verifiedOnly: true,
    });
    expect(filtered.length).toBe(2);
    expect(filtered.map((x) => x.id)).toContain('ad-1');
    expect(filtered.map((x) => x.id)).toContain('ad-3');
    expect(filtered.map((x) => x.id)).not.toContain('ad-2');
  });

  test('filters by text search match', () => {
    const filtered = filterAnnouncements(mockAds, {
      category: 'Todos',
      search: 'Cleaner',
      verifiedOnly: false,
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('ad-2');
  });
});
