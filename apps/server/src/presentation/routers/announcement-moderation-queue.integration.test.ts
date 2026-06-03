import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  providerLocation as assignment,
  condominium,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { appRouter } from './index';

describe('Announcement Moderation Queue Router Procedures', () => {
  const adminId = 'mod-test-admin-id';
  const modAId = 'mod-test-moda-id';
  const modBId = 'mod-test-modb-id';
  const providerId = 'mod-test-provider-id';
  const condoAId = 'mod-test-condoa-id';
  const condoBId = 'mod-test-condob-id';
  const annAId = 'mod-test-anna-id';
  const annBId = 'mod-test-annb-id';

  const reporterIds = [
    'reporter-1',
    'reporter-2',
    'reporter-3',
    'reporter-4',
    'reporter-5',
    'reporter-6',
  ];

  beforeAll(async () => {
    // Clear tables
    await db.delete(reportSchema);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert users
    await db.insert(user).values([
      {
        id: adminId,
        name: 'Admin User',
        email: 'admin@example.com',
        emailVerified: true,
        role: 'SYSTEM_MANAGER',
        status: 'ACTIVE',
        cpfHash: 'hash-admin',
      },
      {
        id: modAId,
        name: 'Mod A',
        email: 'moda@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
        cpfHash: 'hash-moda',
      },
      {
        id: modBId,
        name: 'Mod B',
        email: 'modb@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
        cpfHash: 'hash-modb',
      },
      {
        id: providerId,
        name: 'Mary Provider',
        email: 'mary-provider@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
        cpfHash: 'hash-provider',
      },
      ...reporterIds.map((id, index) => ({
        id,
        name: `Reporter ${index + 1}`,
        email: `reporter-${index + 1}@example.com`,
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
        cpfHash: `hash-rep-${index + 1}`,
      })),
    ]);

    // Insert condos
    await db.insert(condominium).values([
      {
        id: condoAId,
        name: 'Condo Alpha',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000000',
        createdBy: providerId,
        status: 'APPROVED',
      },
      {
        id: condoBId,
        name: 'Condo Beta',
        city: 'Florianópolis',
        state: 'SC',
        cep: '88000001',
        createdBy: providerId,
        status: 'APPROVED',
      },
    ]);

    // Insert moderator assignments
    await db.insert(assignment).values([
      {
        id: 'assign-moda',
        providerId: modAId,
        condominiumId: condoAId,
        type: 'MODERATOR',
        status: 'APPROVED',
      },
      {
        id: 'assign-modb',
        providerId: modBId,
        condominiumId: condoBId,
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ]);

    // Insert announcements
    await db.insert(announcement).values([
      {
        id: annAId,
        providerId,
        condominiumId: condoAId,
        title: 'Fresh warm bread condo A',
        description: 'Bread condo A description.',
        imageUrl: 'http://localhost:9000/showcase/bread.jpg',
        category: 'Alimentação',
        status: 'ACTIVE',
      },
      {
        id: annBId,
        providerId,
        condominiumId: condoBId,
        title: 'Fresh warm bread condo B',
        description: 'Bread condo B description.',
        imageUrl: 'http://localhost:9000/showcase/bread.jpg',
        category: 'Alimentação',
        status: 'ACTIVE',
      },
    ]);

    // Report announcement A (5 times -> meets threshold)
    await db.insert(reportSchema).values(
      reporterIds.slice(0, 5).map((id, index) => ({
        id: `rep-a-${index}`,
        reporterId: id,
        announcementId: annAId,
        reason: index % 2 === 0 ? 'FRAUDE_GOLPE' : 'SPAM',
      })),
    );

    // Report announcement B (2 times -> below threshold 5, but meets threshold 2)
    await db.insert(reportSchema).values(
      reporterIds.slice(0, 2).map((id, index) => ({
        id: `rep-b-${index}`,
        reporterId: id,
        announcementId: annBId,
        reason: 'SPAM',
      })),
    );
  });

  const createTestCaller = (
    userId: string,
    role: 'SYSTEM_MANAGER' | 'PROVIDER' = 'PROVIDER',
  ) => {
    return appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: `sess-test-${userId}`,
          userId,
          token: `tok-test-${userId}`,
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
          role,
          status: 'ACTIVE',
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });
  };

  test('listReported threshold default filtering and authorization', async () => {
    const adminCaller = createTestCaller(adminId, 'SYSTEM_MANAGER');
    const modACaller = createTestCaller(modAId, 'PROVIDER');
    const modBCaller = createTestCaller(modBId, 'PROVIDER');
    const providerCaller = createTestCaller(providerId, 'PROVIDER');

    // 1. Admin caller lists spotlighted (threshold default = 5)
    // Only annAId has 5 reports, annBId has 2.
    const spotlightedAdmin = await adminCaller.announcement.listReported({});
    expect(spotlightedAdmin.length).toBe(1);
    expect(spotlightedAdmin[0]?.id).toBe(annAId);
    expect(spotlightedAdmin[0]?.totalReports).toBe(5);
    expect(spotlightedAdmin[0]?.reasonBreakdown.FRAUDE_GOLPE).toBe(3);
    expect(spotlightedAdmin[0]?.reasonBreakdown.SPAM).toBe(2);
    expect(spotlightedAdmin[0]?.reports.length).toBe(5);

    // 2. Admin caller lists spotlighted with custom threshold 2
    // Both annAId and annBId have >= 2 reports.
    const spotlightedAdminTh2 = await adminCaller.announcement.listReported({
      threshold: 2,
    });
    expect(spotlightedAdminTh2.length).toBe(2);

    // 3. Moderator A lists spotlighted (threshold default = 5)
    // Since Moderator A moderates condoA, they see annAId.
    const spotlightedModA = await modACaller.announcement.listReported({});
    expect(spotlightedModA.length).toBe(1);
    expect(spotlightedModA[0]?.id).toBe(annAId);

    // 4. Moderator B lists spotlighted (threshold default = 5)
    // Since Moderator B moderates condoB (which has only 2 reports), they see nothing.
    const spotlightedModB = await modBCaller.announcement.listReported({});
    expect(spotlightedModB.length).toBe(0);

    // 5. Moderator B lists spotlighted with threshold 2
    // Moderator B should now see annBId.
    const spotlightedModBTh2 = await modBCaller.announcement.listReported({
      threshold: 2,
    });
    expect(spotlightedModBTh2.length).toBe(1);
    expect(spotlightedModBTh2[0]?.id).toBe(annBId);

    // 6. Normal provider lists spotlighted -> FORBIDDEN
    expect(providerCaller.announcement.listReported({})).rejects.toThrow(
      'Acesso negado.',
    );
  });

  test('dismissReports clears reports and de-spotlights announcement', async () => {
    const adminCaller = createTestCaller(adminId, 'SYSTEM_MANAGER');
    const modACaller = createTestCaller(modAId, 'PROVIDER');
    const modBCaller = createTestCaller(modBId, 'PROVIDER');

    // 1. Moderator B tries to dismiss condo A -> FORBIDDEN
    expect(
      modBCaller.announcement.dismissReports({ announcementId: annAId }),
    ).rejects.toThrow('Acesso negado.');

    // 2. Moderator A dismisses condo A reports
    const dismissResult = await modACaller.announcement.dismissReports({
      announcementId: annAId,
    });
    expect(dismissResult.success).toBe(true);

    // 3. Verify reports are deleted in database
    const dbReports = await db
      .select()
      .from(reportSchema)
      .where(eq(reportSchema.announcementId, annAId));
    expect(dbReports.length).toBe(0);

    // 4. Verify listReported no longer returns it
    const spotlightedAdmin = await adminCaller.announcement.listReported({});
    expect(spotlightedAdmin.length).toBe(0);
  });

  test('suspend is bypassed by SYSTEM_MANAGER', async () => {
    const adminCaller = createTestCaller(adminId, 'SYSTEM_MANAGER');

    // Suspend annBId using Admin caller (who is NOT mod of condo B)
    const suspendResult = await adminCaller.announcement.suspend({
      id: annBId,
      reason: 'Bypassed by admin',
    });
    expect(suspendResult.success).toBe(true);

    // Verify it is suspended in database
    const [suspendedAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, annBId))
      .limit(1);
    expect(suspendedAnn?.status).toBe('SUSPENDED');
    expect(suspendedAnn?.suspensionReason).toBe('Bypassed by admin');
  });

  test('banProvider suspends announcements and blacklists CPF', async () => {
    const adminCaller = createTestCaller(adminId, 'SYSTEM_MANAGER');

    // Seed another active announcement for providerId
    const annCId = 'mod-test-annc-id';
    await db.insert(announcement).values({
      id: annCId,
      providerId,
      condominiumId: condoAId,
      title: 'Active announcement before ban',
      description: 'To be suspended',
      imageUrl: 'http://localhost:9000/showcase/img.jpg',
      category: 'Serviços',
      status: 'ACTIVE',
    });

    // Ban the provider
    const banResult = await adminCaller.admin.banProvider({
      id: providerId,
      reason: 'Repeated spam reported in queue',
    });
    expect(banResult.success).toBe(true);

    // Verify announcements status changed to SUSPENDED
    const [suspendedAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, annCId))
      .limit(1);
    expect(suspendedAnn?.status).toBe('SUSPENDED');
    expect(suspendedAnn?.suspensionReason).toContain('Banido globalmente');
  });
});
