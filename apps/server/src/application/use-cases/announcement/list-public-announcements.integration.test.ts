import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  address,
  announcement,
  providerLocation as assignment,
  condominium,
  payment,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq, sql } from 'drizzle-orm';
import { ListPublicAnnouncements } from './list-public-announcements';

describe('List Public Announcements Integration Test', () => {
  const useCase = new ListPublicAnnouncements();

  const providerId = 'list-provider-id';
  const condoAId = 'condo-a-id'; // Florianópolis, SC
  const condoBId = 'condo-b-id'; // Florianópolis, SC
  const condoCId = 'condo-c-id'; // Curitiba, PR

  beforeAll(async () => {
    // Clear tables
    await db.delete(payment);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert user
    await db.insert(user).values({
      id: providerId,
      name: 'List Provider',
      email: 'list@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Insert condominiums
    await db.insert(condominium).values([
      {
        id: condoAId,
        name: 'Residencial Floripa A',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000001',
        createdBy: providerId,
        status: 'APPROVED',
        latitude: '-27.5965',
        longitude: '-48.5495',
        geog: sql`ST_SetSRID(ST_MakePoint(-48.5495, -27.5965), 4326)::geography`,
      },
      {
        id: condoBId,
        name: 'Residencial Floripa B',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000002',
        createdBy: providerId,
        status: 'APPROVED',
        latitude: '-27.5925',
        longitude: '-48.5495',
        geog: sql`ST_SetSRID(ST_MakePoint(-48.5495, -27.5925), 4326)::geography`,
      },
      {
        id: condoCId,
        name: 'Residencial Curitiba C',
        city: 'Curitiba',
        state: 'PR',
        cep: '80000001',
        createdBy: providerId,
        status: 'APPROVED',
        latitude: '-27.5500',
        longitude: '-48.5495',
        geog: sql`ST_SetSRID(ST_MakePoint(-48.5495, -27.5500), 4326)::geography`,
      },
    ]);

    // Insert active announcements
    await db.insert(announcement).values([
      {
        id: 'ann-pizza-a',
        providerId,
        condominiumId: condoAId,
        title: 'Pizza Floripa',
        description: 'Delicious pizza in Floripa Condo A',
        imageUrl: 'http://localhost/pizza.jpg',
        category: 'Food',
        showVerifiedBadge: true,
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 10000),
      },
      {
        id: 'ann-cleaner-b',
        providerId,
        condominiumId: condoBId,
        title: 'Floripa Cleaner',
        description: 'Condo cleaning services SC',
        imageUrl: 'http://localhost/cleaner.jpg',
        category: 'Services',
        showVerifiedBadge: false,
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 5000),
      },
      {
        id: 'ann-burger-c',
        providerId,
        condominiumId: condoCId,
        title: 'Burger Curitiba',
        description: 'Handmade burger PR',
        imageUrl: 'http://localhost/burger.jpg',
        category: 'Food',
        showVerifiedBadge: true,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
      {
        id: 'ann-draft-a',
        providerId,
        condominiumId: condoAId,
        title: 'Draft Item',
        description: 'Unpublished listing draft',
        imageUrl: 'http://localhost/draft.jpg',
        category: 'Food',
        showVerifiedBadge: false,
        status: 'DRAFT',
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(payment);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);
  });

  test('lists active announcements, omitting drafts', async () => {
    const list = await useCase.execute({});
    expect(list.length).toBe(3);
    const ids = list.map((x) => x.id);
    expect(ids).toContain('ann-pizza-a');
    expect(ids).toContain('ann-cleaner-b');
    expect(ids).toContain('ann-burger-c');
    expect(ids).not.toContain('ann-draft-a');
  });

  test('filters by category', async () => {
    const list = await useCase.execute({ category: 'Food' });
    expect(list.length).toBe(2);
    const ids = list.map((x) => x.id);
    expect(ids).toContain('ann-pizza-a');
    expect(ids).toContain('ann-burger-c');
  });

  test('filters by search term', async () => {
    const list = await useCase.execute({ search: 'Floripa' });
    expect(list.length).toBe(2);
    const ids = list.map((x) => x.id);
    expect(ids).toContain('ann-pizza-a');
    expect(ids).toContain('ann-cleaner-b');
  });

  test('filters by verified status only', async () => {
    const list = await useCase.execute({ verifiedOnly: true });
    expect(list.length).toBe(2);
    const ids = list.map((x) => x.id);
    expect(ids).toContain('ann-pizza-a');
    expect(ids).toContain('ann-burger-c');
  });

  test('sorts by user geolocated/selected condominium proximity (exact condo first, then same city/state)', async () => {
    // Proximity target is Condo B in Florianópolis
    const list = await useCase.execute({ userCondoId: condoBId });
    expect(list.length).toBe(3);

    // First element should be Condo B exact match
    expect(list[0]).toBeDefined();
    expect(list[0]?.id).toBe('ann-cleaner-b');

    // Second element should be Condo A (same city Florianópolis, SC)
    expect(list[1]).toBeDefined();
    expect(list[1]?.id).toBe('ann-pizza-a');

    // Third element should be Condo C (different city Curitiba, PR)
    expect(list[2]).toBeDefined();
    expect(list[2]?.id).toBe('ann-burger-c');
  });

  test('sorts by coordinates when latitude and longitude are provided', async () => {
    const list = await useCase.execute({
      latitude: -27.5969,
      longitude: -48.5495,
    });

    expect(list.length).toBe(3);
    expect(list[0]?.id).toBe('ann-pizza-a');
    expect(list[1]?.id).toBe('ann-cleaner-b');
    expect(list[2]?.id).toBe('ann-burger-c');
  });

  test('includes external provider announcements, sorts by proximity, and handles filters correctly', async () => {
    // 1. Create an address for the external provider
    const addressId = 'ext-address-id';
    await db.insert(address).values({
      id: addressId,
      cep: '88000003',
      street: 'Rua das Ostras',
      neighborhood: 'Coqueiros',
      city: 'Florianópolis',
      state: 'SC',
    });

    // 2. Create provider location (EXTERNAL)
    const extLocationId = 'ext-location-id';
    await db.insert(assignment).values({
      id: extLocationId,
      providerId,
      type: 'EXTERNAL',
      status: 'APPROVED',
      addressId,
      number: '42',
    });

    // 3. Create external announcement
    await db.insert(announcement).values({
      id: 'ann-ext-pizza',
      providerId,
      providerLocationId: extLocationId,
      condominiumId: null,
      title: 'Ext Pizza Delivery',
      description: 'Best pizza delivery in Florianópolis',
      imageUrl: 'http://localhost/ext-pizza.jpg',
      category: 'Food',
      showVerifiedBadge: false,
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    // 4. Retrieve all announcements (no filters)
    const listAll = await useCase.execute({});
    expect(listAll.length).toBe(4);
    const idsAll = listAll.map((x) => x.id);
    expect(idsAll).toContain('ann-ext-pizza');

    // 5. Test proximity sorting matching target condo in Florianópolis (condoBId)
    const listSorted = await useCase.execute({ userCondoId: condoBId });
    expect(listSorted.length).toBe(4);

    // First should be B (exact condo match)
    expect(listSorted[0]?.id).toBe('ann-cleaner-b');
    // Curitiba (different city) should be at the end
    expect(listSorted[3]?.id).toBe('ann-burger-c');

    // 6. Filter by condo A (condoAId) - should exclude the external pizza ad
    const listCondoA = await useCase.execute({ condominiumId: condoAId });
    expect(listCondoA.length).toBe(1);
    expect(listCondoA[0]?.id).toBe('ann-pizza-a');

    // Cleanup
    await db.delete(announcement).where(eq(announcement.id, 'ann-ext-pizza'));
    await db.delete(assignment).where(eq(assignment.id, extLocationId));
    await db.delete(address).where(eq(address.id, addressId));
  });

  test('respects configurable default feed radius and expanded search radius', async () => {
    // 1. Create a condominium 15km away
    const farCondoId = 'condo-far-id';
    await db.insert(condominium).values({
      id: farCondoId,
      name: 'Residencial Far Away',
      city: 'Biguaçu',
      state: 'SC',
      cep: '88123456',
      createdBy: providerId,
      status: 'APPROVED',
      latitude: '-27.4500',
      longitude: '-48.5495',
      geog: sql`ST_SetSRID(ST_MakePoint(-48.5495, -27.4500), 4326)::geography`,
    });

    // 2. Create active announcement for far condo
    await db.insert(announcement).values({
      id: 'ann-far-pizza',
      providerId,
      condominiumId: farCondoId,
      title: 'Far Away Pizza',
      description: 'Pizza delivered from Biguaçu',
      imageUrl: 'http://localhost/far-pizza.jpg',
      category: 'Food',
      showVerifiedBadge: false,
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    // 3. Query near Condo A with default radius (10km) -> should NOT return the far announcement
    const listDefault = await useCase.execute({
      latitude: -27.5965,
      longitude: -48.5495,
    });
    const idsDefault = listDefault.map((x) => x.id);
    expect(idsDefault).not.toContain('ann-far-pizza');

    // 4. Query near Condo A with expanded radius (20km) -> should return the far announcement
    const listExpanded = await useCase.execute({
      latitude: -27.5965,
      longitude: -48.5495,
      radiusKm: 20,
    });
    const idsExpanded = listExpanded.map((x) => x.id);
    expect(idsExpanded).toContain('ann-far-pizza');

    // Cleanup far condo and announcement
    await db.delete(announcement).where(eq(announcement.id, 'ann-far-pizza'));
    await db.delete(condominium).where(eq(condominium.id, farCondoId));
  });

  test('prioritizes own-condominium announcements and boosts verified providers', async () => {
    // We insert a new announcement at Condo B
    await db.insert(announcement).values({
      id: 'ann-boosted-b',
      providerId,
      condominiumId: condoBId,
      title: 'Boosted Cleaner',
      description: 'Super cleaner in Condo B',
      imageUrl: 'http://localhost/boosted.jpg',
      category: 'Services',
      showVerifiedBadge: true,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 2000),
    });

    // 1. Query near Condo A (-27.5965, -48.5495) with userCondoId = condoBId
    // -> Condo B announcements should come first (exact condo match)
    // -> Between Condo B announcements: 'ann-boosted-b' (verified) should come before 'ann-cleaner-b' (unverified)
    const list = await useCase.execute({
      latitude: -27.5965,
      longitude: -48.5495,
      userCondoId: condoBId,
    });

    expect(list[0]?.id).toBe('ann-boosted-b');
    expect(list[1]?.id).toBe('ann-cleaner-b');
    expect(list[2]?.id).toBe('ann-pizza-a');

    // Cleanup
    await db.delete(announcement).where(eq(announcement.id, 'ann-boosted-b'));
  });

  test('filters public feed by city and neighborhood', async () => {
    // Insert a condo address for Condo A with specific city and neighborhood
    const addressId = 'condo-a-address-id';
    await db.insert(address).values({
      id: addressId,
      cep: '88000001',
      street: 'Rua Principal',
      neighborhood: 'Trindade',
      city: 'Florianópolis',
      state: 'SC',
    });

    await db
      .update(condominium)
      .set({ addressId })
      .where(eq(condominium.id, condoAId));

    // 1. Filter by city: Florianópolis -> should return Condo A and Condo B announcements
    const listCity = await useCase.execute({ city: 'Florianópolis' });
    const idsCity = listCity.map((x) => x.id);
    expect(idsCity).toContain('ann-pizza-a');
    expect(idsCity).toContain('ann-cleaner-b');
    expect(idsCity).not.toContain('ann-burger-c');

    // 2. Filter by neighborhood: Trindade -> should only return Condo A announcement
    const listNeigh = await useCase.execute({ neighborhood: 'Trindade' });
    const idsNeigh = listNeigh.map((x) => x.id);
    expect(idsNeigh).toContain('ann-pizza-a');
    expect(idsNeigh).not.toContain('ann-cleaner-b');

    // Cleanup
    await db
      .update(condominium)
      .set({ addressId: null })
      .where(eq(condominium.id, condoAId));
    await db.delete(address).where(eq(address.id, addressId));
  });
});
