import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  providerAssignment as assignment,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { appRouter } from '../../../presentation/routers';
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
      role: 'USER',
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
      providerAssignmentId: assignId,
      title: 'Delicious Homemade Cakes',
      subtitle: 'Fresh every day',
      description: 'Order delicious cakes baked fresh daily in block B.',
      priceCents: 2500,
      imageUrl: 'http://localhost:9000/showcase/cake.jpg',
      categoryId: 'cat-alimentacao',
      tags: ['bolo', 'doce', 'artesanal'],
      contact: {
        mode: 'custom',
        custom: { primaryPhone: '5511999999999', callEnabled: false },
      },
      cta: { primary: null, secondary: [] },
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

  test('normalizes tags and price before persisting', async () => {
    const assignId = 'approved-assign-id-6-norm';
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
      providerAssignmentId: assignId,
      title: 'Delicious Homemade Cakes',
      description: 'Order delicious cakes baked fresh daily in block B.',
      // fractional cents must round; messy tags must trim/lowercase/dedupe
      priceCents: 4599.6,
      imageUrl: 'http://localhost:9000/showcase/cake.jpg',
      categoryId: 'cat-alimentacao',
      tags: ['  Bolo ', 'BOLO', 'Café', 'cafe', ''],
      contact: {
        mode: 'custom',
        custom: { primaryPhone: '5511999999999', callEnabled: false },
      },
      cta: { primary: null, secondary: [] },
      showVerifiedBadge: false,
    });

    const [dbAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, res.id))
      .limit(1);

    if (!dbAnn) throw new Error('dbAnn must be defined');
    expect(dbAnn.tags).toEqual(['bolo', 'café']);
    expect(dbAnn.priceCents).toBe(4600);

    await db.delete(assignment);
  });

  test('fails if provider has no assignment for the condominium', async () => {
    expect(
      useCase.execute({
        providerId: testUserId,
        providerAssignmentId: 'non-existing-assign-id-6',
        title: 'Delicious Homemade Cakes',
        description: 'Order delicious cakes baked fresh daily in block B.',
        imageUrl: 'http://localhost:9000/showcase/cake.jpg',
        categoryId: 'cat-alimentacao',
        tags: [],
        contact: {
          mode: 'custom',
          custom: { primaryPhone: '5511999999999', callEnabled: false },
        },
        cta: { primary: null, secondary: [] },
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
        providerAssignmentId: assignId,
        title: 'Delicious Homemade Cakes',
        description: 'Order delicious cakes baked fresh daily in block B.',
        imageUrl: 'http://localhost:9000/showcase/cake.jpg',
        categoryId: 'cat-alimentacao',
        tags: [],
        contact: {
          mode: 'custom',
          custom: { primaryPhone: '5511999999999', callEnabled: false },
        },
        cta: { primary: null, secondary: [] },
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
        providerAssignmentId: 'approved-assign-id-6-val',
        title: 'De', // < 3 chars
        description: 'Order delicious cakes baked fresh daily in block B.',
        imageUrl: 'http://localhost:9000/showcase/cake.jpg',
        categoryId: 'cat-alimentacao',
        tags: [],
        contact: {
          mode: 'custom',
          custom: { primaryPhone: '5511999999999', callEnabled: false },
        },
        cta: { primary: null, secondary: [] },
        showVerifiedBadge: false,
      }),
    ).rejects.toThrow('O título do anúncio deve ter pelo menos 3 caracteres.');

    await db.delete(assignment);
  });

  describe('Create via router — structured inherit/custom contact', () => {
    const assignId = 'approved-assign-contact-id';

    const buildCaller = () =>
      appRouter.createCaller({
        auth: null,
        session: {
          session: {
            id: 'sess-create-contact',
            userId: testUserId,
            token: 'tok-create-contact',
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
            userAgent: null,
            ipAddress: null,
          },
          user: {
            id: testUserId,
            name: 'John Provider',
            email: 'john-provider@example.com',
            emailVerified: true,
            role: 'USER',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });

    const baseInput = {
      providerAssignmentId: assignId,
      title: 'Fresh Garden Vegetables',
      subtitle: null,
      description: 'Locally grown vegetables delivered to your door.',
      priceCents: 1500,
      imageUrl: 'http://localhost:9000/showcase/veg.jpg',
      categoryId: 'cat-alimentacao',
      tags: ['horta'],
      showVerifiedBadge: false,
    };

    beforeEach(async () => {
      await db.delete(announcement);
      await db.delete(assignment);
      await db.insert(assignment).values({
        id: assignId,
        providerId: testUserId,
        condominiumId: testCondoId,
        type: 'RESIDENT',
        status: 'APPROVED',
        unitInfo: 'Block C, Apt 101',
      });
    });

    test('persists inherit mode without a custom payload', async () => {
      const caller = buildCaller();
      const res = await caller.announcement.create({
        ...baseInput,
        contact: { mode: 'inherit', custom: null },
      });

      const [dbAnn] = await db
        .select()
        .from(announcement)
        .where(eq(announcement.id, res.id))
        .limit(1);

      expect(dbAnn?.contactMode).toBe('inherit');
      expect(dbAnn?.contactCustom).toBeNull();
    });

    test('persists custom mode with the normalized baseline number', async () => {
      const caller = buildCaller();
      const res = await caller.announcement.create({
        ...baseInput,
        contact: {
          mode: 'custom',
          custom: { primaryPhone: '+55 (11) 98888-7777', callEnabled: true },
        },
      });

      const [dbAnn] = await db
        .select()
        .from(announcement)
        .where(eq(announcement.id, res.id))
        .limit(1);

      expect(dbAnn?.contactMode).toBe('custom');
      expect(dbAnn?.contactCustom).toEqual({
        primaryPhone: '+5511988887777',
        callEnabled: true,
      });
    });

    test('rejects custom mode without a valid WhatsApp baseline', async () => {
      const caller = buildCaller();
      expect(
        caller.announcement.create({
          ...baseInput,
          contact: {
            mode: 'custom',
            custom: { primaryPhone: '123', callEnabled: false },
          },
        }),
      ).rejects.toThrow(
        'Um número de WhatsApp é obrigatório para o contato do anúncio.',
      );
    });

    test('persists a bounded CTA with primary and secondary targets', async () => {
      const caller = buildCaller();
      const res = await caller.announcement.create({
        ...baseInput,
        contact: { mode: 'inherit', custom: null },
        cta: {
          primary: { type: 'website', value: 'https://menu.example.com' },
          secondary: [
            { type: 'provider_profile', value: null },
            { type: 'whatsapp', value: '+55 (11) 98888-7777' },
          ],
        },
      });

      const [dbAnn] = await db
        .select()
        .from(announcement)
        .where(eq(announcement.id, res.id))
        .limit(1);

      expect(dbAnn?.cta).toEqual({
        primary: { type: 'website', value: 'https://menu.example.com' },
        secondary: [
          { type: 'provider_profile', value: null },
          { type: 'whatsapp', value: '+5511988887777' },
        ],
      });
    });

    test('rejects a CTA target outside the supported value rules', async () => {
      const caller = buildCaller();
      expect(
        caller.announcement.create({
          ...baseInput,
          contact: { mode: 'inherit', custom: null },
          cta: {
            primary: { type: 'website', value: 'not-a-real-url' },
            secondary: [],
          },
        }),
      ).rejects.toThrow('Destino de CTA inválido para o conjunto suportado.');
    });

    test('rejects a CTA exceeding the secondary cap', async () => {
      const caller = buildCaller();
      expect(
        caller.announcement.create({
          ...baseInput,
          contact: { mode: 'inherit', custom: null },
          cta: {
            primary: { type: 'provider_profile', value: null },
            secondary: [
              { type: 'provider_profile', value: null },
              { type: 'provider_profile', value: null },
              { type: 'provider_profile', value: null },
              { type: 'provider_profile', value: null },
            ],
          },
        }),
      ).rejects.toThrow('no máximo');
    });
  });

  describe('Update Announcement Verification Parity & Auto-Revocation', () => {
    let testAnnId: string;
    let assignId: string;

    beforeEach(async () => {
      // Cleanup
      await db.delete(announcement);
      await db.delete(assignment);

      // Create approved assignment
      assignId = 'approved-assign-update-id';
      await db.insert(assignment).values({
        id: assignId,
        providerId: testUserId,
        condominiumId: testCondoId,
        type: 'RESIDENT',
        status: 'APPROVED',
        unitInfo: 'Block B, Apt 302',
      });

      // Create an announcement linked to that assignment with showVerifiedBadge = false
      testAnnId = 'test-ann-update-id';
      await db.insert(announcement).values({
        id: testAnnId,
        providerId: testUserId,
        providerAssignmentId: assignId,
        condominiumId: testCondoId,
        title: 'Tasty Pizza',
        description: 'Fresh pizza baked in our block.',
        imageUrl: 'http://localhost:9000/showcase/pizza.jpg',
        categoryId: 'cat-alimentacao',
        tags: [],
        contactMode: 'custom' as const,
        contactCustom: { primaryPhone: '5511999999999', callEnabled: false },
        showVerifiedBadge: false,
        status: 'DRAFT',
      });
    });

    test('successfully updates announcement to showVerifiedBadge = true when assignment is APPROVED RESIDENT', async () => {
      const caller = appRouter.createCaller({
        auth: null,
        session: {
          session: {
            id: 'sess-update-ok',
            userId: testUserId,
            token: 'tok-update-ok',
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
            userAgent: null,
            ipAddress: null,
          },
          user: {
            id: testUserId,
            name: 'John Provider',
            email: 'john-provider@example.com',
            emailVerified: true,
            role: 'USER',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });

      const res = await caller.announcement.update({
        id: testAnnId,
        title: 'Super Tasty Pizza',
        subtitle: null,
        description: 'Fresh pizza baked in our block.',
        priceCents: 3500,
        imageUrl: 'http://localhost:9000/showcase/pizza.jpg',
        categoryId: 'cat-alimentacao',
        tags: [],
        contactLinks: { whatsapp: '5511999999999' },
        showVerifiedBadge: true,
      });

      expect(res.showVerifiedBadge).toBe(true);

      const [dbAnn] = await db
        .select()
        .from(announcement)
        .where(eq(announcement.id, testAnnId))
        .limit(1);
      expect(dbAnn?.showVerifiedBadge).toBe(true);
    });

    test('fails to update to showVerifiedBadge = true when assignment status is REJECTED', async () => {
      // Reject assignment
      await db
        .update(assignment)
        .set({ status: 'REJECTED' })
        .where(eq(assignment.id, assignId));

      const caller = appRouter.createCaller({
        auth: null,
        session: {
          session: {
            id: 'sess-update-fail',
            userId: testUserId,
            token: 'tok-update-fail',
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
            userAgent: null,
            ipAddress: null,
          },
          user: {
            id: testUserId,
            name: 'John Provider',
            email: 'john-provider@example.com',
            emailVerified: true,
            role: 'USER',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });

      expect(
        caller.announcement.update({
          id: testAnnId,
          title: 'Super Tasty Pizza',
          subtitle: null,
          description: 'Fresh pizza baked in our block.',
          priceCents: 3500,
          imageUrl: 'http://localhost:9000/showcase/pizza.jpg',
          categoryId: 'cat-alimentacao',
          tags: [],
          contactLinks: { whatsapp: '5511999999999' },
          showVerifiedBadge: true,
        }),
      ).rejects.toThrow(
        'Selo de morador verificado está disponível apenas para moradores aprovados.',
      );
    });

    test('auto-revocation cascades verified badge to false when assignment status transitions to REJECTED', async () => {
      // Set badge to true in DB first
      await db
        .update(announcement)
        .set({ showVerifiedBadge: true })
        .where(eq(announcement.id, testAnnId));

      // Call repository updateStatus to reject assignment
      await assignmentRepo.updateStatus(assignId, 'REJECTED');

      // Verify showVerifiedBadge was set to false
      const [dbAnn] = await db
        .select()
        .from(announcement)
        .where(eq(announcement.id, testAnnId))
        .limit(1);
      expect(dbAnn?.showVerifiedBadge).toBe(false);
    });
  });
});
