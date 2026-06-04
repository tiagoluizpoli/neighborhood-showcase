import { beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
  providerLocation,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import {
  AnnouncementUpdateAccessDeniedError,
  UpdateAnnouncement,
  VerifiedBadgeEligibilityError,
} from './update-announcement';

describe('UpdateAnnouncement use case', () => {
  const ownerId = 'update-announcement-owner-id';
  const outsiderId = 'update-announcement-outsider-id';
  const condoId = 'update-announcement-condo-id';
  const assignmentId = 'update-announcement-assignment-id';
  const announcementId = 'update-announcement-id';

  const announcementRepo = new DrizzleAnnouncementRepository();
  const assignmentRepo = new DrizzleAssignmentRepository();
  const updateAnnouncement = new UpdateAnnouncement(
    announcementRepo,
    assignmentRepo,
  );

  beforeEach(async () => {
    await db.delete(announcement);
    await db.delete(providerLocation);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: ownerId,
        name: 'Owner User',
        email: 'update-owner@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
      {
        id: outsiderId,
        name: 'Outsider User',
        email: 'update-outsider@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    ]);

    await db.insert(condominium).values({
      id: condoId,
      name: 'Update Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: ownerId,
      status: 'APPROVED',
    });

    await db.insert(providerLocation).values({
      id: assignmentId,
      providerId: ownerId,
      condominiumId: condoId,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Apto 101',
    });

    await db.insert(announcement).values({
      id: announcementId,
      providerId: ownerId,
      condominiumId: condoId,
      providerLocationId: assignmentId,
      title: 'Old Title',
      subtitle: 'Old Subtitle',
      description: 'Old description with enough length.',
      priceCents: 1200,
      imageUrl: 'https://example.com/old.png',
      categoryId: 'cat-servicos',
      tags: ['old'],
      contactLinks: { whatsapp: '5511999999999' },
      showVerifiedBadge: false,
      flaggedForReview: false,
      status: 'SUSPENDED',
      suspensionReason: 'Need review',
    });
  });

  test('updates owner announcement, reactivates suspended status, and flags for review', async () => {
    const result = await updateAnnouncement.execute({
      actorId: ownerId,
      announcementId,
      title: 'New Title',
      subtitle: null,
      description: 'New description with enough length.',
      priceCents: 2400,
      imageUrl: 'https://example.com/new.png',
      categoryId: 'cat-alimentacao',
      tags: ['new', 'fresh'],
      contactLinks: { instagram: '@newtitle' },
      showVerifiedBadge: true,
    });

    expect(result.title).toBe('New Title');
    expect(result.status).toBe('ACTIVE');
    expect(result.showVerifiedBadge).toBe(true);
    expect(result.flaggedForReview).toBe(true);
    expect(result.suspensionReason).toBeNull();

    const [stored] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, announcementId))
      .limit(1);

    expect(stored?.status).toBe('ACTIVE');
    expect(stored?.flaggedForReview).toBe(true);
    expect(stored?.suspensionReason).toBeNull();
  });

  test('throws AnnouncementUpdateAccessDeniedError for non-owner', async () => {
    await expect(
      updateAnnouncement.execute({
        actorId: outsiderId,
        announcementId,
        title: 'New Title',
        subtitle: null,
        description: 'New description with enough length.',
        priceCents: 2400,
        imageUrl: 'https://example.com/new.png',
        categoryId: 'cat-alimentacao',
        tags: ['new'],
        contactLinks: { whatsapp: '5511999999999' },
        showVerifiedBadge: false,
      }),
    ).rejects.toBeInstanceOf(AnnouncementUpdateAccessDeniedError);
  });

  test('throws VerifiedBadgeEligibilityError when verified badge assignment is no longer approved', async () => {
    await db
      .update(providerLocation)
      .set({ status: 'REJECTED' })
      .where(eq(providerLocation.id, assignmentId));

    await expect(
      updateAnnouncement.execute({
        actorId: ownerId,
        announcementId,
        title: 'New Title',
        subtitle: null,
        description: 'New description with enough length.',
        priceCents: 2400,
        imageUrl: 'https://example.com/new.png',
        categoryId: 'cat-alimentacao',
        tags: ['new'],
        contactLinks: { whatsapp: '5511999999999' },
        showVerifiedBadge: true,
      }),
    ).rejects.toBeInstanceOf(VerifiedBadgeEligibilityError);
  });
});
