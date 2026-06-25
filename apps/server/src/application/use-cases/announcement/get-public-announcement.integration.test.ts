import { beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
  provider,
  providerProfile,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import {
  AnnouncementNotFoundError,
  GetPublicAnnouncement,
} from './get-public-announcement';

describe('GetPublicAnnouncement use case', () => {
  const userId = 'public-announcement-user-id';
  const providerId = 'public-announcement-provider-id';
  const condoId = 'public-announcement-condo-id';
  const activeAnnouncementId = 'public-announcement-active-id';
  const suspendedAnnouncementId = 'public-announcement-suspended-id';
  const ctaValidId = 'public-announcement-cta-valid-id';
  const ctaWhatsappId = 'public-announcement-cta-whatsapp-id';
  const ctaInvalidId = 'public-announcement-cta-invalid-id';

  const announcementRepo = new DrizzleAnnouncementRepository();
  const getPublicAnnouncement = new GetPublicAnnouncement(announcementRepo);

  beforeEach(async () => {
    await db.delete(announcement);
    await db.delete(providerProfile);
    await db.delete(condominium);
    await db.delete(provider);
    await db.delete(user);

    await db.insert(user).values({
      id: userId,
      name: 'Auth Identity Provider',
      email: 'public-provider@example.com',
      image: 'https://example.com/avatar.png',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
    });

    await db.insert(provider).values({
      id: providerId,
      ownerId: userId,
    });

    await db.insert(providerProfile).values({
      providerId,
      displayName: 'Provider Profile Brand',
      isProviderVisible: true,
    });

    await db.insert(condominium).values({
      id: condoId,
      name: 'Public Condo',
      city: 'Florianopolis',
      state: 'SC',
      cep: '88000000',
      createdBy: userId,
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
        contactMode: 'custom' as const,
        contactCustom: { primaryPhone: '5511999999999', callEnabled: false },
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
      {
        id: ctaValidId,
        providerId,
        condominiumId: condoId,
        title: 'CTA Valid Listing',
        description: 'Listing with a valid bounded CTA',
        imageUrl: 'https://example.com/cta-valid.png',
        categoryId: 'cat-servicos',
        contactMode: 'custom' as const,
        contactCustom: { primaryPhone: '5511999999999', callEnabled: false },
        cta: {
          primary: { type: 'website', value: 'https://menu.example.com' },
          secondary: [{ type: 'provider_profile', value: null }],
        },
        status: 'ACTIVE',
      },
      {
        id: ctaWhatsappId,
        providerId,
        condominiumId: condoId,
        title: 'CTA WhatsApp Listing',
        description:
          'Listing with a WhatsApp deep-link CTA without explicit value',
        imageUrl: 'https://example.com/cta-whatsapp.png',
        categoryId: 'cat-servicos',
        contactMode: 'custom' as const,
        contactCustom: { primaryPhone: '5511977776666', callEnabled: true },
        cta: {
          primary: { type: 'whatsapp', value: null },
          secondary: [],
        },
        status: 'ACTIVE',
      },
      {
        id: ctaInvalidId,
        providerId,
        condominiumId: condoId,
        title: 'CTA Invalid Listing',
        description: 'Listing with stale/invalid CTA data that must fall back',
        imageUrl: 'https://example.com/cta-invalid.png',
        categoryId: 'cat-servicos',
        contactMode: 'custom' as const,
        contactCustom: { primaryPhone: '5511955554444', callEnabled: false },
        cta: {
          primary: { type: 'website', value: 'broken' },
          secondary: [],
        },
        status: 'ACTIVE',
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
    expect(result.providerName).toBe('Provider Profile Brand');
    expect(result.providerAvatarUrl).toBe('https://example.com/avatar.png');
  });

  test('absent CTA leaves the DTO primary empty for contact fallback', async () => {
    const result = await getPublicAnnouncement.execute({
      id: activeAnnouncementId,
    });

    expect(result.cta.primary).toBeNull();
    expect(result.cta.secondary).toEqual([]);
    // Contact fallback path stays available.
    expect(result.contactLinks.whatsapp).toBe('5511999999999');
  });

  test('present CTA surfaces primary and secondary targets', async () => {
    const result = await getPublicAnnouncement.execute({ id: ctaValidId });

    expect(result.cta.primary).toEqual({
      type: 'website',
      value: 'https://menu.example.com',
      label: null,
    });
    expect(result.cta.secondary).toEqual([
      { type: 'provider_profile', value: null, label: null },
    ]);
  });

  test('whatsapp CTA without value stays resolvable against the contact number', async () => {
    const result = await getPublicAnnouncement.execute({ id: ctaWhatsappId });

    expect(result.cta.primary).toEqual({
      type: 'whatsapp',
      value: null,
      label: null,
    });
  });

  test('invalid CTA data is dropped so the DTO falls back to contact', async () => {
    const result = await getPublicAnnouncement.execute({ id: ctaInvalidId });

    expect(result.cta.primary).toBeNull();
    expect(result.contactLinks.whatsapp).toBe('5511955554444');
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

  test('throws AnnouncementNotFoundError when provider is soft-deleted', async () => {
    await db
      .update(provider)
      .set({ deletedAt: new Date() })
      .where(eq(provider.id, providerId));

    try {
      await expect(
        getPublicAnnouncement.execute({ id: activeAnnouncementId }),
      ).rejects.toBeInstanceOf(AnnouncementNotFoundError);
    } finally {
      await db
        .update(provider)
        .set({ deletedAt: null })
        .where(eq(provider.id, providerId));
    }
  });
});
