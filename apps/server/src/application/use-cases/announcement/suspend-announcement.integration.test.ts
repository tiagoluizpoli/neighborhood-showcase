import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@base-fullstack-template/db';
import { user } from '@base-fullstack-template/db/schema/auth';
import {
  announcement,
  assignment,
  condominium,
} from '@base-fullstack-template/db/schema/showcase';
import { SuspendAnnouncement } from './suspend-announcement';
import { ReinstateAnnouncement } from './reinstate-announcement';
import { eq } from 'drizzle-orm';

describe('Suspend and Reinstate Announcement Integration Test', () => {
  const suspendUseCase = new SuspendAnnouncement();
  const reinstateUseCase = new ReinstateAnnouncement();

  const providerId = 'provider-id';
  const moderatorId = 'mod-id';
  const condoId = 'condo-id';
  const annId = 'ann-to-suspend';

  beforeAll(async () => {
    // Clear tables
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert user (provider)
    await db.insert(user).values({
      id: providerId,
      name: 'Provider User',
      email: 'provider@example.com',
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Insert user (moderator)
    await db.insert(user).values({
      id: moderatorId,
      name: 'Mod User',
      email: 'mod@example.com',
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
      id: 'assign-mod',
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
      category: 'Serviços',
      tags: [],
      contactLinks: {},
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
    expect(suspendedAnn!.status).toBe('SUSPENDED');
    expect(suspendedAnn!.suspensionReason).toBe(
      'Contains inappropriate content.',
    );
    expect(suspendedAnn!.flaggedForReview).toBe(false);

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
    expect(reinstatedAnn!.status).toBe('ACTIVE');
    expect(reinstatedAnn!.suspensionReason).toBeNull();
    expect(reinstatedAnn!.flaggedForReview).toBe(false);
  });

  test('fails suspension if moderator is not approved for the condominium', async () => {
    // Insert non-moderator user
    const fakeModId = 'fake-mod-id';
    await db.insert(user).values({
      id: fakeModId,
      name: 'Fake Mod',
      email: 'fake@example.com',
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    expect(
      suspendUseCase.execute({
        announcementId: annId,
        moderatorId: fakeModId,
        reason: 'Bad description',
      }),
    ).rejects.toThrow();
  });
});
