import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { appRouter } from './index';

describe('report Announcement Router Procedure', () => {
  const reporterId = 'report-test-reporter-id';
  const providerId = 'report-test-provider-id';
  const condoId = 'report-test-condo-id';
  const testAnnId = 'report-test-ann-id';
  const deletedAnnId = 'report-test-deleted-ann-id';

  beforeAll(async () => {
    // Clear tables
    await db.delete(reportSchema);
    await db.delete(announcement);
    await db.delete(condominium);
    await db.delete(user);

    // Insert users
    await db.insert(user).values([
      {
        id: reporterId,
        name: 'John Reporter',
        email: 'john-reporter@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
      {
        id: providerId,
        name: 'Mary Provider',
        email: 'mary-provider@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    ]);

    // Insert condo
    await db.insert(condominium).values({
      id: condoId,
      name: 'Report Towers',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    // Insert announcements
    await db.insert(announcement).values([
      {
        id: testAnnId,
        providerId,
        condominiumId: condoId,
        title: 'Delicious Bread',
        description: 'Fresh warm bread every morning.',
        imageUrl: 'http://localhost:9000/showcase/bread.jpg',
        categoryId: 'cat-alimentacao',
        status: 'ACTIVE',
      },
      {
        id: deletedAnnId,
        providerId,
        condominiumId: condoId,
        title: 'Old Bread',
        description: 'Hard warm bread from last week.',
        imageUrl: 'http://localhost:9000/showcase/bread.jpg',
        categoryId: 'cat-alimentacao',
        status: 'ACTIVE',
        deletedAt: new Date(),
      },
    ]);
  });

  const createTestCaller = (userId: string) => {
    return appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-test-report',
          userId,
          token: 'tok-test-report',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: userId,
          name: 'Test User',
          email: 'test-user@example.com',
          emailVerified: true,
          role: 'PROVIDER',
          status: 'ACTIVE',
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });
  };

  test('successfully submits a report on an active announcement', async () => {
    const caller = createTestCaller(reporterId);

    const result = await caller.announcement.report({
      announcementId: testAnnId,
      reason: 'FRAUDE_GOLPE',
    });

    expect(result.success).toBe(true);

    // Verify report is saved in database
    const reports = await db
      .select()
      .from(reportSchema)
      .where(eq(reportSchema.announcementId, testAnnId));
    expect(reports.length).toBe(1);
    expect(reports[0]).toBeDefined();
    expect(reports[0]?.reporterId).toBe(reporterId);
    expect(reports[0]?.reason).toBe('FRAUDE_GOLPE');
  });

  test('throws CONFLICT TRPCError when attempting a duplicate report', async () => {
    const caller = createTestCaller(reporterId);

    // Reporter already submitted a report on testAnnId in the previous test
    expect(
      caller.announcement.report({
        announcementId: testAnnId,
        reason: 'SPAM',
      }),
    ).rejects.toThrow('Você já denunciou este anúncio.');
  });

  test('throws NOT_FOUND when announcement does not exist', async () => {
    const caller = createTestCaller(reporterId);

    expect(
      caller.announcement.report({
        announcementId: 'non-existent-id',
        reason: 'OUTROS',
      }),
    ).rejects.toThrow('Anúncio não encontrado.');
  });

  test('throws NOT_FOUND when announcement is deleted', async () => {
    const caller = createTestCaller(reporterId);

    expect(
      caller.announcement.report({
        announcementId: deletedAnnId,
        reason: 'ASSEDIO_OFENSIVO',
      }),
    ).rejects.toThrow('Anúncio não encontrado.');
  });

  test('throws Validation Error for invalid reason enum', async () => {
    const caller = createTestCaller(reporterId);

    expect(
      caller.announcement.report({
        announcementId: testAnnId,
        // @ts-expect-error - testing invalid enum injection
        reason: 'INVALID_REASON',
      }),
    ).rejects.toThrow();
  });
});
