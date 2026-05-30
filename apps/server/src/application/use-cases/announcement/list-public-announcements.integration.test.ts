import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@base-fullstack-template/db';
import { user } from '@base-fullstack-template/db/schema/auth';
import {
  announcement,
  providerLocation as assignment,
  condominium,
  payment,
} from '@base-fullstack-template/db/schema/showcase';
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
      },
      {
        id: condoBId,
        name: 'Residencial Floripa B',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000002',
        createdBy: providerId,
        status: 'APPROVED',
      },
      {
        id: condoCId,
        name: 'Residencial Curitiba C',
        city: 'Curitiba',
        state: 'PR',
        cep: '80000001',
        createdBy: providerId,
        status: 'APPROVED',
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
});
