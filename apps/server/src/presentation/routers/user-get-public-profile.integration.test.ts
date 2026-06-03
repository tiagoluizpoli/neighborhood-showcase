import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  assignment,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { appRouter } from './index';

describe('user.getPublicProfile Router Procedure', () => {
  const providerId = 'profile-test-provider-id';
  const otherProviderId = 'profile-test-other-provider-id';
  const condoId = 'profile-test-condo-id';
  const activeAnnId = 'profile-test-active-ann-id';
  const draftAnnId = 'profile-test-draft-ann-id';

  beforeAll(async () => {
    // Clear tables
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert main provider
    await db.insert(user).values({
      id: providerId,
      name: 'Jane Profile Provider',
      email: 'jane-profile@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
      image: 'http://localhost/jane-avatar.jpg',
      socialLinks: {
        whatsapp: '5511999999999',
        instagram: 'jane.provider',
      },
    });

    // Insert other provider
    await db.insert(user).values({
      id: otherProviderId,
      name: 'Banned Provider',
      email: 'banned@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'BANNED',
      image: null,
      socialLinks: {},
    });

    // Insert condo
    await db.insert(condominium).values({
      id: condoId,
      name: 'Profile Towers',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    // Insert approved RESIDENT assignment for main provider to make them verified
    await db.insert(assignment).values({
      id: 'profile-test-assignment-id',
      providerId,
      condominiumId: condoId,
      type: 'RESIDENT',
      status: 'APPROVED',
      unitInfo: 'Apt 101',
    });

    // Insert active announcement
    await db.insert(announcement).values({
      id: activeAnnId,
      providerId,
      condominiumId: condoId,
      title: 'Expert House Cleaning',
      description: 'Reliable and fast deep cleaning services',
      imageUrl: 'http://localhost/cleaning.jpg',
      category: 'Serviços',
      status: 'ACTIVE',
      contactLinks: {
        whatsapp: '5511999999999',
      },
      showVerifiedBadge: true,
    });

    // Insert draft announcement (should not be returned in public list)
    await db.insert(announcement).values({
      id: draftAnnId,
      providerId,
      condominiumId: condoId,
      title: 'Car Wash',
      description: 'Premium car wash service',
      imageUrl: 'http://localhost/carwash.jpg',
      category: 'Serviços',
      status: 'DRAFT',
      contactLinks: {},
      showVerifiedBadge: false,
    });
  });

  test('successfully retrieves public profile of an active provider with active announcements', async () => {
    const caller = appRouter.createCaller({
      auth: null,
      session: null,
    });

    const res = await caller.user.getPublicProfile({ id: providerId });

    expect(res.provider.id).toBe(providerId);
    expect(res.provider.name).toBe('Jane Profile Provider');
    expect(res.provider.avatarUrl).toBe('http://localhost/jane-avatar.jpg');
    expect(res.provider.socialLinks).toEqual({
      whatsapp: '5511999999999',
      instagram: 'jane.provider',
    });
    expect(res.provider.isVerified).toBe(true);

    // Should only contain the active announcement
    expect(res.announcements).toHaveLength(1);
    const firstAnn = res.announcements[0];
    expect(firstAnn).toBeDefined();
    if (!firstAnn) throw new Error('Announcement not found');
    expect(firstAnn.id).toBe(activeAnnId);
    expect(firstAnn.title).toBe('Expert House Cleaning');
    expect(firstAnn.status).toBe('ACTIVE');
    expect(firstAnn.condoName).toBe('Profile Towers');
    expect(firstAnn.condoCity).toBe('Curitiba');
    expect(firstAnn.condoState).toBe('PR');
  });

  test('throws NOT_FOUND when provider does not exist', async () => {
    const caller = appRouter.createCaller({
      auth: null,
      session: null,
    });

    expect(
      caller.user.getPublicProfile({ id: 'non-existent-id' }),
    ).rejects.toThrow('Prestador não encontrado');
  });

  test('throws NOT_FOUND when provider is banned', async () => {
    const caller = appRouter.createCaller({
      auth: null,
      session: null,
    });

    expect(
      caller.user.getPublicProfile({ id: otherProviderId }),
    ).rejects.toThrow('Prestador não encontrado');
  });
});
