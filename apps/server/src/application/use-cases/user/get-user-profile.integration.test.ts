import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { providerProfile } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { DrizzleUserRepository } from '../../../infrastructure/db/user-repository';
import { GetUserProfile } from './get-user-profile';

describe('GetUserProfile use case', () => {
  const userId = 'get-user-profile-provider-id';
  const useCase = new GetUserProfile(new DrizzleUserRepository());

  beforeAll(async () => {
    await db
      .delete(providerProfile)
      .where(eq(providerProfile.providerId, userId));
    await db.delete(user).where(eq(user.id, userId));

    await db.insert(user).values({
      id: userId,
      name: 'Auth Identity Name',
      email: 'get-user-profile@example.com',
      phone: '5511999999999',
      emailVerified: true,
      image: 'https://cdn.example.com/auth-avatar.jpg',
      role: 'USER',
      status: 'ACTIVE',
    });
  });

  test('returns fallback profile defaults without creating provider_profile rows', async () => {
    const result = await useCase.execute({ userId });

    expect(result).toEqual({
      id: userId,
      name: 'Auth Identity Name',
      email: 'get-user-profile@example.com',
      phone: '5511999999999',
      socialLinks: {},
      isProviderVisible: true,
    });

    const [profileRow] = await db
      .select()
      .from(providerProfile)
      .where(eq(providerProfile.providerId, userId))
      .limit(1);

    expect(profileRow).toBeUndefined();
  });
});
