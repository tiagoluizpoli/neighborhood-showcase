import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { providerProfile as providerProfileSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { ProviderProfileRepositoryImpl } from '../../../infrastructure/db/provider-profile-repository';
import {
  GetProviderProfile,
  ProviderProfileNotFoundError,
} from './get-provider-profile';

describe('GetProviderProfile integration', () => {
  const repo = new ProviderProfileRepositoryImpl();
  const useCase = new GetProviderProfile(repo);

  const testUserId = 'get-provider-profile-integration-user';

  beforeAll(async () => {
    // Clean up and seed user
    await db
      .delete(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, testUserId));
    await db.delete(user).where(eq(user.id, testUserId));

    await db.insert(user).values({
      id: testUserId,
      name: 'Get Provider Profile Test',
      email: 'get-provider-profile@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });
  });

  test('throws ProviderProfileNotFoundError when no profile exists', async () => {
    await expect(useCase.execute({ providerId: testUserId })).rejects.toThrow(
      ProviderProfileNotFoundError,
    );
  });

  test('returns profile after it has been upserted', async () => {
    // First upsert a profile via the repository directly
    const { UpdateProviderProfile } = await import('./update-provider-profile');
    const updateUseCase = new UpdateProviderProfile(repo);
    await updateUseCase.execute({
      providerId: testUserId,
      displayName: 'Found Provider Profile',
      companyName: 'Found Company',
      publicDescription: 'This profile exists now.',
      socialLinks: { website: 'https://found.example.com' },
    });

    const profile = await useCase.execute({ providerId: testUserId });

    expect(profile).toBeDefined();
    expect(profile.displayName).toBe('Found Provider Profile');
    expect(profile.companyName).toBe('Found Company');
    expect(profile.publicDescription).toBe('This profile exists now.');
    expect(profile.socialLinks.website).toBe('https://found.example.com');
  });
});
