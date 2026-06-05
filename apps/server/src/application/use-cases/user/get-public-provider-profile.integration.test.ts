import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
  providerAssignment,
  providerProfile,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { DrizzleUserRepository } from '../../../infrastructure/db/user-repository';
import {
  GetPublicProviderProfile,
  PublicProviderNotFoundError,
} from './get-public-provider-profile';

describe('GetPublicProviderProfile use case', () => {
  const providerId = 'public-provider-profile-provider-id';
  const categoryId = 'cat-servicos';
  const condoId = 'public-provider-profile-condo-id';
  const assignmentId = 'public-provider-profile-assignment-id';
  const announcementId = 'public-provider-profile-announcement-id';

  const useCase = new GetPublicProviderProfile(
    new DrizzleUserRepository(),
    new DrizzleAssignmentRepository(),
    new DrizzleAnnouncementRepository(),
  );

  beforeAll(async () => {
    await db.delete(announcement).where(eq(announcement.id, announcementId));
    await db
      .delete(providerProfile)
      .where(eq(providerProfile.providerId, providerId));
    await db
      .delete(providerAssignment)
      .where(eq(providerAssignment.id, assignmentId));
    await db.delete(condominium).where(eq(condominium.id, condoId));
    await db.delete(user).where(eq(user.id, providerId));

    await db.insert(user).values({
      id: providerId,
      name: 'Auth Identity Name',
      email: 'public-profile@example.com',
      emailVerified: true,
      image: 'https://cdn.example.com/auth-avatar.jpg',
      role: 'USER',
      status: 'ACTIVE',
    });

    await db.insert(providerProfile).values({
      providerId,
      displayName: 'Provider Branding Name',
      avatarUrl: 'https://cdn.example.com/provider-avatar.jpg',
      socialLinks: {
        whatsapp: '5511999999999',
        instagram: 'provider-branding',
      },
      isProviderVisible: true,
    });

    await db.insert(condominium).values({
      id: condoId,
      name: 'Condomínio Central',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    await db.insert(providerAssignment).values({
      id: assignmentId,
      providerId,
      condominiumId: condoId,
      type: 'RESIDENT',
      status: 'APPROVED',
    });

    await db.insert(announcement).values({
      id: announcementId,
      providerId,
      providerAssignmentId: assignmentId,
      condominiumId: condoId,
      title: 'Encanador 24h',
      description: 'Atendimento rápido e confiável',
      imageUrl: 'https://cdn.example.com/encanador.jpg',
      categoryId,
      contactLinks: {
        whatsapp: '5511999999999',
      },
      showVerifiedBadge: true,
      status: 'ACTIVE',
    });
  });

  test('reads public provider data from provider_profile instead of auth identity fields', async () => {
    const result = await useCase.execute({ providerId });

    expect(result.provider.name).toBe('Provider Branding Name');
    expect(result.provider.avatarUrl).toBe(
      'https://cdn.example.com/provider-avatar.jpg',
    );
    expect(result.provider.socialLinks).toEqual({
      whatsapp: '5511999999999',
      instagram: 'provider-branding',
    });
    expect(result.provider.isVerified).toBe(true);
    expect(result.announcements[0]?.providerName).toBe(
      'Provider Branding Name',
    );
    expect(result.announcements[0]?.providerAvatarUrl).toBe(
      'https://cdn.example.com/provider-avatar.jpg',
    );
  });

  test('throws not found for banned providers', async () => {
    await db
      .update(user)
      .set({ status: 'BANNED' })
      .where(eq(user.id, providerId));

    expect(useCase.execute({ providerId })).rejects.toBeInstanceOf(
      PublicProviderNotFoundError,
    );

    await db
      .update(user)
      .set({ status: 'ACTIVE' })
      .where(eq(user.id, providerId));
  });
});
