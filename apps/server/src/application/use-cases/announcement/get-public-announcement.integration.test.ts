import { beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import {
  AnnouncementNotFoundError,
  GetPublicAnnouncement,
} from './get-public-announcement';

describe('GetPublicAnnouncement use case', () => {
  const providerId = 'public-announcement-provider-id';
  const condoId = 'public-announcement-condo-id';
  const activeAnnouncementId = 'public-announcement-active-id';
  const suspendedAnnouncementId = 'public-announcement-suspended-id';

  const announcementRepo = new DrizzleAnnouncementRepository();
  const getPublicAnnouncement = new GetPublicAnnouncement(announcementRepo);

  beforeEach(async () => {
    await db.delete(announcement);
    await db.delete(condominium);
    await db.delete(user);

    await db.insert(user).values({
      id: providerId,
      name: 'Public Provider',
      email: 'public-provider@example.com',
      image: 'https://example.com/avatar.png',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    await db.insert(condominium).values({
      id: condoId,
      name: 'Public Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    await db.insert(announcement).values([
      {
        id: activeAnnouncementId,
        providerId,
        condominiumId: condoId,
        title: 'Active Listing',
        subtitle: 'Open now',
        description: 'Public active listing description',
        imageUrl: 'https://example.com/public.png',
        categoryId: 'cat-servicos',
        tags: ['cleaning'],
        contactLinks: { whatsapp: '5511999999999' },
        showVerifiedBadge: true,
        status: 'ACTIVE',
      },
      {
        id: suspendedAnnouncementId,
        providerId,
        condominiumId: condoId,
        title: 'Suspended Listing',
        description: 'Suspended listing description',
        imageUrl: 'https://example.com/suspended.png',
        categoryId: 'cat-servicos',
        status: 'SUSPENDED',
      },
    ]);
  });

  test('returns enriched public DTO for active announcement', async () => {
    const result = await getPublicAnnouncement.execute({
      id: activeAnnouncementId,
    });

    expect(result.id).toBe(activeAnnouncementId);
    expect(result.title).toBe('Active Listing');
    expect(result.category).toBe('Serviços');
    expect(result.condoName).toBe('Public Condo');
    expect(result.condoCity).toBe('Florianopolis');
    expect(result.condoState).toBe('SC');
    expect(result.providerName).toBe('Public Provider');
    expect(result.providerAvatarUrl).toBe('https://example.com/avatar.png');
  });

  test('throws AnnouncementNotFoundError for suspended announcement', async () => {
    await expect(
      getPublicAnnouncement.execute({
        id: suspendedAnnouncementId,
      }),
    ).rejects.toBeInstanceOf(AnnouncementNotFoundError);
  });

  test('throws AnnouncementNotFoundError for missing announcement', async () => {
    await expect(
      getPublicAnnouncement.execute({
        id: 'missing-public-announcement-id',
      }),
    ).rejects.toBeInstanceOf(AnnouncementNotFoundError);
  });
});
