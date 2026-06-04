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
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { DrizzleReportRepository } from '../../../infrastructure/db/report-repository';
import { DrizzleUserRepository } from '../../../infrastructure/db/user-repository';
import {
  DismissReports,
  DismissReportsAccessDeniedError,
} from './dismiss-reports';
import {
  ReinstateAnnouncement,
  ReinstateAnnouncementAccessDeniedError,
} from './reinstate-announcement';
import {
  SuspendAnnouncement,
  SuspendAnnouncementAccessDeniedError,
} from './suspend-announcement';

describe('Suspend and Reinstate Announcement Integration Test', () => {
  const announcementRepo = new DrizzleAnnouncementRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const userRepo = new DrizzleUserRepository();
  const reportRepo = new DrizzleReportRepository();

  const suspendUseCase = new SuspendAnnouncement(
    announcementRepo,
    assignmentRepo,
    userRepo,
  );
  const reinstateUseCase = new ReinstateAnnouncement(
    announcementRepo,
    assignmentRepo,
    userRepo,
  );
  const dismissReportsUseCase = new DismissReports(
    announcementRepo,
    assignmentRepo,
    reportRepo,
    userRepo,
  );

  const providerId = 'susp-provider-id';
  const moderatorId = 'susp-mod-id';
  const condoId = 'susp-condo-id';
  const annId = 'susp-ann-id';

  beforeAll(async () => {
    // Clear tables
    await db.delete(reportSchema);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert user (provider)
    await db.insert(user).values({
      id: providerId,
      name: 'Provider User',
      email: 'susp-provider@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Insert user (moderator)
    await db.insert(user).values({
      id: moderatorId,
      name: 'Mod User',
      email: 'susp-mod@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Insert condo
    await db.insert(condominium).values({
      id: condoId,
      name: 'Condo Alpha',
      city: 'Florianópolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    // Insert moderator assignment
    await db.insert(assignment).values({
      id: 'susp-assign-mod',
      providerId: moderatorId,
      condominiumId: condoId,
      type: 'MODERATOR',
      status: 'APPROVED',
    });

    // Insert active announcement
    await db.insert(announcement).values({
      id: annId,
      providerId,
      condominiumId: condoId,
      title: 'Active Service',
      description: 'Clean coding services.',
      imageUrl: 'https://example.com/img.png',
      categoryId: 'cat-servicos',
      tags: [],
      contactLinks: { whatsapp: '5511999999999' },
      status: 'ACTIVE',
      flaggedForReview: false,
    });
  });

  test('successfully suspends an active announcement and reinstates it back to active', async () => {
    // 1. Suspend the announcement
    await suspendUseCase.execute({
      announcementId: annId,
      moderatorId,
      reason: 'Contains inappropriate content.',
    });

    const [suspendedAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, annId))
      .limit(1);

    expect(suspendedAnn).toBeDefined();
    expect(suspendedAnn?.status).toBe('SUSPENDED');
    expect(suspendedAnn?.suspensionReason).toBe(
      'Contains inappropriate content.',
    );
    expect(suspendedAnn?.flaggedForReview).toBe(false);

    // 2. Reinstate the announcement
    await reinstateUseCase.execute({
      announcementId: annId,
      moderatorId,
    });

    const [reinstatedAnn] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, annId))
      .limit(1);

    expect(reinstatedAnn).toBeDefined();
    expect(reinstatedAnn?.status).toBe('ACTIVE');
    expect(reinstatedAnn?.suspensionReason).toBeNull();
    expect(reinstatedAnn?.flaggedForReview).toBe(false);
  });

  test('fails suspension if moderator is not approved for the condominium', async () => {
    const fakeModId = 'susp-fake-mod-id';
    await db.insert(user).values({
      id: fakeModId,
      name: 'Fake Mod',
      email: 'susp-fake@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    await expect(
      suspendUseCase.execute({
        announcementId: annId,
        moderatorId: fakeModId,
        reason: 'Bad description',
      }),
    ).rejects.toBeInstanceOf(SuspendAnnouncementAccessDeniedError);
  });

  test('fails reinstatement if moderator is not approved for the condominium', async () => {
    const fakeModId = 'susp-fake-mod2-id';
    await db.insert(user).values({
      id: fakeModId,
      name: 'Fake Mod 2',
      email: 'susp-fake2@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    await expect(
      reinstateUseCase.execute({
        announcementId: annId,
        moderatorId: fakeModId,
      }),
    ).rejects.toBeInstanceOf(ReinstateAnnouncementAccessDeniedError);
  });

  test('dismissReports deletes all reports for an announcement', async () => {
    // Insert a report to dismiss
    await db.insert(reportSchema).values({
      id: 'susp-report-1',
      reporterId: providerId,
      announcementId: annId,
      reason: 'SPAM',
    });

    await dismissReportsUseCase.execute({
      announcementId: annId,
      moderatorId,
    });

    const remaining = await db
      .select()
      .from(reportSchema)
      .where(eq(reportSchema.announcementId, annId));

    expect(remaining).toHaveLength(0);
  });

  test('dismissReports fails if moderator is not approved for the condominium', async () => {
    const fakeModId = 'susp-fake-mod3-id';
    await db.insert(user).values({
      id: fakeModId,
      name: 'Fake Mod 3',
      email: 'susp-fake3@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    await expect(
      dismissReportsUseCase.execute({
        announcementId: annId,
        moderatorId: fakeModId,
      }),
    ).rejects.toBeInstanceOf(DismissReportsAccessDeniedError);
  });
});
