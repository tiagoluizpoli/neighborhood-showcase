import { beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
  providerLocation,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { DrizzleUserRepository } from '../../../infrastructure/db/user-repository';
import {
  ListReportedAnnouncements,
  ReportQueueAccessDeniedError,
  ReportQueueActorNotFoundError,
} from './list-reported-announcements';

describe('ListReportedAnnouncements use case', () => {
  const adminId = 'reported-uc-admin-id';
  const modAId = 'reported-uc-moda-id';
  const modBId = 'reported-uc-modb-id';
  const providerId = 'reported-uc-provider-id';
  const condoAId = 'reported-uc-condoa-id';
  const condoBId = 'reported-uc-condob-id';
  const annAId = 'reported-uc-anna-id';
  const annBId = 'reported-uc-annb-id';
  const reporterIds = [
    'reported-uc-reporter-1',
    'reported-uc-reporter-2',
    'reported-uc-reporter-3',
    'reported-uc-reporter-4',
    'reported-uc-reporter-5',
    'reported-uc-reporter-6',
  ];

  const announcementRepo = new DrizzleAnnouncementRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const userRepo = new DrizzleUserRepository();
  const listReportedAnnouncements = new ListReportedAnnouncements(
    announcementRepo,
    assignmentRepo,
    userRepo,
  );

  beforeEach(async () => {
    await db.delete(reportSchema);
    await db.delete(announcement);
    await db.delete(providerLocation);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: adminId,
        name: 'Admin User',
        email: 'reported-uc-admin@example.com',
        emailVerified: true,
        role: 'SYSTEM_MANAGER',
        status: 'ACTIVE',
      },
      {
        id: modAId,
        name: 'Moderator A',
        email: 'reported-uc-moda@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
      {
        id: modBId,
        name: 'Moderator B',
        email: 'reported-uc-modb@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
      {
        id: providerId,
        name: 'Mary Provider',
        email: 'reported-uc-provider@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
      ...reporterIds.map((id, index) => ({
        id,
        name: `Reporter ${index + 1}`,
        email: `reported-uc-reporter-${index + 1}@example.com`,
        emailVerified: true,
        role: 'PROVIDER' as const,
        status: 'ACTIVE' as const,
      })),
    ]);

    await db.insert(condominium).values([
      {
        id: condoAId,
        name: 'Condo Alpha',
        city: 'Florianopolis',
        state: 'SC',
        cep: '88000000',
        createdBy: providerId,
        status: 'APPROVED',
      },
      {
        id: condoBId,
        name: 'Condo Beta',
        city: 'Florianopolis',
        state: 'SC',
        cep: '88000001',
        createdBy: providerId,
        status: 'APPROVED',
      },
    ]);

    await db.insert(providerLocation).values([
      {
        id: 'reported-uc-assign-moda',
        providerId: modAId,
        condominiumId: condoAId,
        type: 'MODERATOR',
        status: 'APPROVED',
      },
      {
        id: 'reported-uc-assign-modb',
        providerId: modBId,
        condominiumId: condoBId,
        type: 'MODERATOR',
        status: 'APPROVED',
      },
    ]);

    await db.insert(announcement).values([
      {
        id: annAId,
        providerId,
        condominiumId: condoAId,
        title: 'Queue Announcement A',
        description: 'Queue announcement A description.',
        imageUrl: 'https://example.com/reported-a.png',
        categoryId: 'cat-servicos',
        status: 'ACTIVE',
      },
      {
        id: annBId,
        providerId,
        condominiumId: condoBId,
        title: 'Queue Announcement B',
        description: 'Queue announcement B description.',
        imageUrl: 'https://example.com/reported-b.png',
        categoryId: 'cat-servicos',
        status: 'ACTIVE',
      },
    ]);

    await db.insert(reportSchema).values(
      reporterIds.slice(0, 5).map((id, index) => ({
        id: `reported-uc-a-${index}`,
        reporterId: id,
        announcementId: annAId,
        reason: index % 2 === 0 ? ('FRAUDE_GOLPE' as const) : ('SPAM' as const),
      })),
    );

    await db.insert(reportSchema).values(
      reporterIds.slice(0, 2).map((id, index) => ({
        id: `reported-uc-b-${index}`,
        reporterId: id,
        announcementId: annBId,
        reason: 'SPAM' as const,
      })),
    );
  });

  test('lists spotlighted announcements by actor scope and threshold', async () => {
    const adminResult = await listReportedAnnouncements.execute({
      actorId: adminId,
    });
    expect(adminResult).toHaveLength(1);
    expect(adminResult[0]?.id).toBe(annAId);
    expect(adminResult[0]?.totalReports).toBe(5);
    expect(adminResult[0]?.reasonBreakdown.FRAUDE_GOLPE).toBe(3);
    expect(adminResult[0]?.reasonBreakdown.SPAM).toBe(2);
    expect(adminResult[0]?.reports).toHaveLength(5);

    const adminThresholdTwo = await listReportedAnnouncements.execute({
      actorId: adminId,
      threshold: 2,
    });
    expect(adminThresholdTwo.map((item) => item.id).sort()).toEqual(
      [annAId, annBId].sort(),
    );

    const moderatorAResult = await listReportedAnnouncements.execute({
      actorId: modAId,
    });
    expect(moderatorAResult).toHaveLength(1);
    expect(moderatorAResult[0]?.id).toBe(annAId);

    const moderatorBResult = await listReportedAnnouncements.execute({
      actorId: modBId,
      threshold: 2,
    });
    expect(moderatorBResult).toHaveLength(1);
    expect(moderatorBResult[0]?.id).toBe(annBId);
  });

  test('throws ReportQueueAccessDeniedError for non-moderator provider', async () => {
    await expect(
      listReportedAnnouncements.execute({
        actorId: providerId,
      }),
    ).rejects.toBeInstanceOf(ReportQueueAccessDeniedError);
  });

  test('throws ReportQueueActorNotFoundError for missing actor', async () => {
    await expect(
      listReportedAnnouncements.execute({
        actorId: 'reported-uc-missing-actor',
      }),
    ).rejects.toBeInstanceOf(ReportQueueActorNotFoundError);
  });
});
