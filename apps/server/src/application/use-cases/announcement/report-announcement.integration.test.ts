import { beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
  report as reportSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleReportRepository } from '../../../infrastructure/db/report-repository';
import {
  AnnouncementReportConflictError,
  AnnouncementReportNotFoundError,
  ReportAnnouncement,
} from './report-announcement';

describe('ReportAnnouncement use case', () => {
  const reporterId = 'report-uc-reporter-id';
  const providerId = 'report-uc-provider-id';
  const condoId = 'report-uc-condo-id';
  const announcementId = 'report-uc-announcement-id';
  const deletedAnnouncementId = 'report-uc-deleted-announcement-id';

  const announcementRepo = new DrizzleAnnouncementRepository();
  const reportRepo = new DrizzleReportRepository();
  const reportAnnouncement = new ReportAnnouncement(
    announcementRepo,
    reportRepo,
  );

  beforeEach(async () => {
    await db.delete(reportSchema);
    await db.delete(announcement);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: reporterId,
        name: 'Reporter User',
        email: 'report-uc-reporter@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: providerId,
        name: 'Provider User',
        email: 'report-uc-provider@example.com',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
    ]);

    await db.insert(condominium).values({
      id: condoId,
      name: 'Report UC Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    await db.insert(announcement).values([
      {
        id: announcementId,
        providerId,
        condominiumId: condoId,
        title: 'Active Listing',
        description: 'Active listing report target.',
        imageUrl: 'https://example.com/report-target.png',
        categoryId: 'cat-servicos',
        status: 'ACTIVE',
      },
      {
        id: deletedAnnouncementId,
        providerId,
        condominiumId: condoId,
        title: 'Deleted Listing',
        description: 'Deleted listing report target.',
        imageUrl: 'https://example.com/report-deleted.png',
        categoryId: 'cat-servicos',
        status: 'ACTIVE',
        deletedAt: new Date(),
      },
    ]);
  });

  test('creates a report for an active announcement', async () => {
    await reportAnnouncement.execute({
      reporterId,
      announcementId,
      reason: 'FRAUDE_GOLPE',
    });

    const reports = await db
      .select()
      .from(reportSchema)
      .where(eq(reportSchema.announcementId, announcementId));

    expect(reports).toHaveLength(1);
    expect(reports[0]?.reporterId).toBe(reporterId);
    expect(reports[0]?.reason).toBe('FRAUDE_GOLPE');
  });

  test('throws AnnouncementReportConflictError for duplicate report', async () => {
    await db.insert(reportSchema).values({
      id: 'existing-report-id',
      reporterId,
      announcementId,
      reason: 'SPAM',
    });

    await expect(
      reportAnnouncement.execute({
        reporterId,
        announcementId,
        reason: 'OUTROS',
      }),
    ).rejects.toBeInstanceOf(AnnouncementReportConflictError);
  });

  test('throws AnnouncementReportNotFoundError for missing announcement', async () => {
    await expect(
      reportAnnouncement.execute({
        reporterId,
        announcementId: 'missing-announcement-id',
        reason: 'OUTROS',
      }),
    ).rejects.toBeInstanceOf(AnnouncementReportNotFoundError);
  });

  test('throws AnnouncementReportNotFoundError for deleted announcement', async () => {
    await expect(
      reportAnnouncement.execute({
        reporterId,
        announcementId: deletedAnnouncementId,
        reason: 'OUTROS',
      }),
    ).rejects.toBeInstanceOf(AnnouncementReportNotFoundError);
  });
});
