import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  providerProfile as providerProfileSchema,
  provider as providerSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { ProviderProfileRepositoryImpl } from '../../../infrastructure/db/provider-profile-repository';
import {
  GetProviderProfile,
  ProviderProfileNotFoundError,
} from './get-provider-profile';

describe('GetProviderProfile integration', () => {
  const repo = new ProviderProfileRepositoryImpl();
  const useCase = new GetProviderProfile(repo);

  const ownerUserId = 'get-provider-profile-owner-user';
  const providerId = 'get-provider-profile-provider';

  beforeAll(async () => {
    await db
      .delete(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, providerId));
    await db.delete(providerSchema).where(eq(providerSchema.id, providerId));
    await db.delete(user).where(eq(user.id, ownerUserId));

    await db.insert(user).values({
      id: ownerUserId,
      name: 'Get Provider Profile Owner',
      email: 'get-provider-profile-owner@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });

    await db.insert(providerSchema).values({
      id: providerId,
      ownerId: ownerUserId,
    });
  });

  beforeEach(async () => {
    await db
      .delete(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, providerId));
    await db
      .update(providerSchema)
      .set({ deletedAt: null })
      .where(eq(providerSchema.id, providerId));
  });

  test('throws ProviderProfileNotFoundError when no profile exists for the provider id', async () => {
    await expect(useCase.execute({ providerId })).rejects.toThrow(
      ProviderProfileNotFoundError,
    );
  });

  test('returns profile after it has been upserted for provider.id', async () => {
    const { UpdateProviderProfile } = await import('./update-provider-profile');
    const updateUseCase = new UpdateProviderProfile(repo);

    await updateUseCase.execute({
      providerId,
      displayName: 'Found Provider Profile',
      companyName: 'Found Company',
      publicDescription: 'This profile exists now.',
      contactMetadata: { website: 'https://found.example.com' },
    });

    const profile = await useCase.execute({ providerId });

    expect(profile).toBeDefined();
    expect(profile.displayName).toBe('Found Provider Profile');
    expect(profile.companyName).toBe('Found Company');
    expect(profile.publicDescription).toBe('This profile exists now.');
    expect(profile.contactMetadata.website).toBe('https://found.example.com');
  });

  test('read contract returns original-source references alongside cropped URLs', async () => {
    const { UpdateProviderProfile } = await import('./update-provider-profile');
    const updateUseCase = new UpdateProviderProfile(repo);

    await updateUseCase.execute({
      providerId,
      displayName: 'Found Provider With Originals',
      logoUrl: 'https://cdn.example.com/logo-crop.png',
      logoOriginalUrl: 'https://cdn.example.com/logo-original.png',
      bannerUrl: 'https://cdn.example.com/banner-crop.jpg',
      bannerOriginalUrl: 'https://cdn.example.com/banner-original.jpg',
    });

    const profile = await useCase.execute({ providerId });

    expect(profile.logoUrl).toBe('https://cdn.example.com/logo-crop.png');
    expect(profile.logoOriginalUrl).toBe(
      'https://cdn.example.com/logo-original.png',
    );
    expect(profile.bannerUrl).toBe('https://cdn.example.com/banner-crop.jpg');
    expect(profile.bannerOriginalUrl).toBe(
      'https://cdn.example.com/banner-original.jpg',
    );
  });

  test('excludes soft-deleted providers from panel profile reads', async () => {
    const { UpdateProviderProfile } = await import('./update-provider-profile');
    const updateUseCase = new UpdateProviderProfile(repo);

    await updateUseCase.execute({
      providerId,
      displayName: 'Soft Deleted Provider',
    });

    await db
      .update(providerSchema)
      .set({ deletedAt: new Date() })
      .where(eq(providerSchema.id, providerId));

    await expect(useCase.execute({ providerId })).rejects.toThrow(
      ProviderProfileNotFoundError,
    );
  });
});
