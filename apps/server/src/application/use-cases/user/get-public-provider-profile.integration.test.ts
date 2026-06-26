import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  condominium,
  providerAssignment,
  providerProfile,
  provider as providerSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import type {
  AssignmentStatus,
  AssignmentType,
} from '../../../domain/entities/assignment.entity';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { DrizzleAssignmentRepository } from '../../../infrastructure/db/assignment-repository';
import { DrizzleUserRepository } from '../../../infrastructure/db/user-repository';
import {
  GetPublicProviderProfile,
  PublicProviderNotFoundError,
} from './get-public-provider-profile';

describe('GetPublicProviderProfile use case', () => {
  const ownerUserId = 'public-provider-profile-owner-user';
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

  const seedAssignment = async (input?: {
    status?: AssignmentStatus;
    type?: AssignmentType;
  }) => {
    await db
      .delete(providerAssignment)
      .where(eq(providerAssignment.id, assignmentId));

    await db.insert(providerAssignment).values({
      id: assignmentId,
      providerId,
      condominiumId: condoId,
      type: input?.type ?? 'RESIDENT',
      status: input?.status ?? 'APPROVED',
    });
  };

  const seedAnnouncement = async () => {
    await db.delete(announcement).where(eq(announcement.id, announcementId));

    await db.insert(announcement).values({
      id: announcementId,
      providerId,
      providerAssignmentId: assignmentId,
      condominiumId: condoId,
      title: 'Encanador 24h',
      description: 'Atendimento rápido e confiável',
      imageUrl: 'https://cdn.example.com/encanador.jpg',
      categoryId,
      contactMode: 'custom' as const,
      contactCustom: { primaryPhone: '5511999999999', callEnabled: false },
      showVerifiedBadge: true,
      status: 'ACTIVE',
    });
  };

  beforeAll(async () => {
    await db.delete(announcement).where(eq(announcement.id, announcementId));
    await db
      .delete(providerProfile)
      .where(eq(providerProfile.providerId, providerId));
    await db
      .delete(providerAssignment)
      .where(eq(providerAssignment.id, assignmentId));
    await db.delete(providerSchema).where(eq(providerSchema.id, providerId));
    await db.delete(condominium).where(eq(condominium.id, condoId));
    await db.delete(user).where(eq(user.id, ownerUserId));

    await db.insert(user).values({
      id: ownerUserId,
      name: 'Auth Identity Name',
      email: 'public-profile-owner@example.com',
      emailVerified: true,
      image: 'https://cdn.example.com/auth-avatar.jpg',
      role: 'USER',
      status: 'ACTIVE',
    });

    await db.insert(providerSchema).values({
      id: providerId,
      ownerId: ownerUserId,
    });

    await db.insert(condominium).values({
      id: condoId,
      name: 'Condomínio Central',
      city: 'Curitiba',
      state: 'PR',
      cep: '80000000',
      createdBy: ownerUserId,
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
      contactMode: 'custom' as const,
      contactCustom: { primaryPhone: '5511999999999', callEnabled: false },
      showVerifiedBadge: true,
      status: 'ACTIVE',
    });
  });

  beforeEach(async () => {
    await db
      .update(user)
      .set({ status: 'ACTIVE' })
      .where(eq(user.id, ownerUserId));
    await db
      .update(providerSchema)
      .set({ deletedAt: null })
      .where(eq(providerSchema.id, providerId));
    await db
      .delete(providerProfile)
      .where(eq(providerProfile.providerId, providerId));
    await seedAssignment();
    await seedAnnouncement();

    await db.insert(providerProfile).values({
      providerId,
      displayName: 'Provider Branding Name',
      primaryPhone: '5511999999999',
      contactMetadata: { instagram: 'provider-branding' },
      isProviderVisible: true,
    });
  });

  test('reads public provider data from provider_profile resolved by provider.id via owner identity', async () => {
    const result = await useCase.execute({ providerId });

    expect(result.provider.id).toBe(providerId);
    expect(result.provider.displayName).toBe('Provider Branding Name');
    expect(result.provider.socialLinks).toEqual({
      whatsapp: '5511999999999',
      instagram: 'provider-branding',
    });
    expect(result.provider.isVerified).toBe(true);
    expect(result.provider.verifiedCondo).toEqual({
      condoId,
      condoName: 'Condomínio Central',
    });
    expect(result.announcements[0]?.providerName).toBe(
      'Provider Branding Name',
    );
    expect(result.announcements[0]?.providerAvatarUrl).toBe(
      'https://cdn.example.com/auth-avatar.jpg',
    );
  });

  test('returns auth fallback data when no provider_profile exists without creating one', async () => {
    await db
      .delete(providerProfile)
      .where(eq(providerProfile.providerId, providerId));

    const result = await useCase.execute({ providerId });

    expect(result.provider.displayName).toBe('Auth Identity Name');
    expect(result.provider.socialLinks).toEqual({});
    expect(result.provider.verifiedCondo).toEqual({
      condoId,
      condoName: 'Condomínio Central',
    });
    expect(result.announcements[0]?.providerName).toBe('Auth Identity Name');
    expect(result.announcements[0]?.providerAvatarUrl).toBe(
      'https://cdn.example.com/auth-avatar.jpg',
    );

    const [profileRow] = await db
      .select()
      .from(providerProfile)
      .where(eq(providerProfile.providerId, providerId))
      .limit(1);

    expect(profileRow).toBeUndefined();
  });

  test('returns null verifiedCondo for EXTERNAL assignments', async () => {
    await seedAssignment({ type: 'EXTERNAL' });

    const result = await useCase.execute({ providerId });

    expect(result.provider.isVerified).toBe(false);
    expect(result.provider.verifiedCondo).toBeNull();
  });

  test('returns null verifiedCondo for MODERATOR assignments', async () => {
    await seedAssignment({ type: 'MODERATOR' });

    const result = await useCase.execute({ providerId });

    expect(result.provider.isVerified).toBe(false);
    expect(result.provider.verifiedCondo).toBeNull();
  });

  test('returns null verifiedCondo for pending resident assignments', async () => {
    await seedAssignment({ status: 'PENDING' });

    const result = await useCase.execute({ providerId });

    expect(result.provider.isVerified).toBe(false);
    expect(result.provider.verifiedCondo).toBeNull();
  });

  test('returns null verifiedCondo for rejected resident assignments', async () => {
    await seedAssignment({ status: 'REJECTED' });

    const result = await useCase.execute({ providerId });

    expect(result.provider.isVerified).toBe(false);
    expect(result.provider.verifiedCondo).toBeNull();
  });

  test('returns null verifiedCondo when the provider has no assignment', async () => {
    await db
      .delete(providerAssignment)
      .where(eq(providerAssignment.id, assignmentId));

    const result = await useCase.execute({ providerId });

    expect(result.provider.isVerified).toBe(false);
    expect(result.provider.verifiedCondo).toBeNull();
  });

  test('throws not found for banned providers', async () => {
    await db
      .update(user)
      .set({ status: 'BANNED' })
      .where(eq(user.id, ownerUserId));

    await expect(useCase.execute({ providerId })).rejects.toBeInstanceOf(
      PublicProviderNotFoundError,
    );
  });

  test('throws not found for hidden providers', async () => {
    await db
      .update(providerProfile)
      .set({ isProviderVisible: false })
      .where(eq(providerProfile.providerId, providerId));

    await expect(useCase.execute({ providerId })).rejects.toBeInstanceOf(
      PublicProviderNotFoundError,
    );
  });

  test('throws not found for soft-deleted providers', async () => {
    await db
      .update(providerSchema)
      .set({ deletedAt: new Date() })
      .where(eq(providerSchema.id, providerId));

    await expect(useCase.execute({ providerId })).rejects.toBeInstanceOf(
      PublicProviderNotFoundError,
    );
  });
});
