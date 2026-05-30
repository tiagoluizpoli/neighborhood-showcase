import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@base-fullstack-template/db';
import { user } from '@base-fullstack-template/db/schema/auth';
import {
  announcement,
  providerLocation as assignment,
  condominium,
} from '@base-fullstack-template/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { CreateAnnouncement } from './create-announcement';

describe('Create Announcement Integration Test', () => {
  const announcementRepo = new DrizzleAnnouncementRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const useCase = new CreateAnnouncement(announcementRepo, assignmentRepo);

  const testUserId = 'test-provider-id-6';
  const testCondoId = 'test-condo-id-6';

  beforeAll(async () => {
    // Clear tables
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Create user
    await db.insert(user).values({
      id: testUserId,
      name: 'John Provider',
      email: 'john-provider@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Create condo
    await db.insert(condominium).values({
      id: testCondoId,
      name: 'Grand Horizon Condominium',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: testUserId,
      status: 'APPROVED',
    });
  });

  afterAll(async () => {
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);
  });

  test('successfully creates a draft announcement when provider has an approved assignment', async () => {
    // Create approved assignment
    const assignId = 'approved-assign-id-6';
    await db.insert(assignment).values({
      id: assignId,
      providerId: testUserId,
      condominiumId: testCondoId,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Block B, Apt 302',
    });

    const res = await useCase.execute({
      providerId: testUserId,
      providerLocationId: assignId,
      title: 'Delicious Homemade Cakes',
      subtitle: 'Fresh every day',
      description: 'Order delicious cakes baked fresh daily in block B.',
      priceCents: 2500,
      imageUrl: 'http://localhost:9000/showcase/cake.jpg',
      category: 'Alimentação',
      tags: ['bolo', 'doce', 'artesanal'],
      contactLinks: {
        whatsapp: '5511999999999',
        instagram: '@cake_palace',
      },
      showVerifiedBadge: true,
    });

    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.status).toBe('DRAFT');
    expect(res.title).toBe('Delicious Homemade Cakes');
    expect(res.showVerifiedBadge).toBe(true);

    // Verify DB
    const [dbAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, res.id))
      .limit(1);

    expect(dbAnn).toBeDefined();
    if (!dbAnn) throw new Error('dbAnn must be defined');
    expect(dbAnn.status).toBe('DRAFT');
    expect(dbAnn.title).toBe('Delicious Homemade Cakes');
    expect(dbAnn.priceCents).toBe(2500);

    // Cleanup assignment for other tests
    await db.delete(assignment);
  });

  test('fails if provider has no assignment for the condominium', async () => {
    expect(
      useCase.execute({
        providerId: testUserId,
        providerLocationId: 'non-existing-assign-id-6',
        title: 'Delicious Homemade Cakes',
        description: 'Order delicious cakes baked fresh daily in block B.',
        imageUrl: 'http://localhost:9000/showcase/cake.jpg',
        category: 'Alimentação',
        tags: [],
        contactLinks: { whatsapp: '5511999999999' },
        showVerifiedBadge: false,
      }),
    ).rejects.toThrow(
      'Você precisa ter uma localização aprovada para criar anúncios.',
    );
  });

  test('fails if provider assignment is pending', async () => {
    // Create pending assignment
    const assignId = 'pending-assign-id-6';
    await db.insert(assignment).values({
      id: assignId,
      providerId: testUserId,
      condominiumId: testCondoId,
      type: 'RESIDENT',
      status: 'PENDING',
      unitInfo: 'Block B, Apt 302',
    });

    expect(
      useCase.execute({
        providerId: testUserId,
        providerLocationId: assignId,
        title: 'Delicious Homemade Cakes',
        description: 'Order delicious cakes baked fresh daily in block B.',
        imageUrl: 'http://localhost:9000/showcase/cake.jpg',
        category: 'Alimentação',
        tags: [],
        contactLinks: { whatsapp: '5511999999999' },
        showVerifiedBadge: false,
      }),
    ).rejects.toThrow(
      'Você precisa ter uma localização aprovada para criar anúncios.',
    );

    await db.delete(assignment);
  });

  test('fails if request validation fails (e.g. title too short)', async () => {
    // Setup approved assignment
    await db.insert(assignment).values({
      id: 'approved-assign-id-6-val',
      providerId: testUserId,
      condominiumId: testCondoId,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Block B, Apt 302',
    });

    expect(
      useCase.execute({
        providerId: testUserId,
        providerLocationId: 'approved-assign-id-6-val',
        title: 'De', // < 3 chars
        description: 'Order delicious cakes baked fresh daily in block B.',
        imageUrl: 'http://localhost:9000/showcase/cake.jpg',
        category: 'Alimentação',
        tags: [],
        contactLinks: { whatsapp: '5511999999999' },
        showVerifiedBadge: false,
      }),
    ).rejects.toThrow('O título do anúncio deve ter pelo menos 3 caracteres.');

    await db.delete(assignment);
  });
});
