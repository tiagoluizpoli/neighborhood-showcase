import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  providerLocation as assignment,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { appRouter } from './index';

describe('getPublic Announcement Router Procedure', () => {
  const providerId = 'public-test-provider-id';
  const condoId = 'public-test-condo-id';
  const testAnnId = 'public-test-ann-id';

  beforeAll(async () => {
    // Clear tables
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert user
    await db.insert(user).values({
      id: providerId,
      name: 'John Public Provider',
      email: 'john-public@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
      image: 'http://localhost/avatar.jpg',
    });

    // Insert condo
    await db.insert(condominium).values({
      id: condoId,
      name: 'Public Towers',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    // Insert active announcement
    await db.insert(announcement).values({
      id: testAnnId,
      providerId,
      condominiumId: condoId,
      title: 'Delicious Pizza',
      description: 'Warm and tasty pizza delivered right to your apartment',
      imageUrl: 'http://localhost:9000/showcase/pizza.jpg',
      categoryId: 'cat-alimentacao',
      status: 'ACTIVE',
    });
  });

  test('successfully retrieves announcement with provider details', async () => {
    const caller = appRouter.createCaller({
      auth: null,
      session: null,
    });

    const res = await caller.announcement.getPublic({ id: testAnnId });

    expect(res.id).toBe(testAnnId);
    expect(res.title).toBe('Delicious Pizza');
    expect(res.providerName).toBe('John Public Provider');
    expect(res.providerAvatarUrl).toBe('http://localhost/avatar.jpg');
  });
});
