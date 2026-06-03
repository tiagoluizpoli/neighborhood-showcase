import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { eq } from 'drizzle-orm';
import { UpdateUser } from './update-user';

describe('Update User Name Integration Test', () => {
  const useCase = new UpdateUser();
  const testUserId = 'test-update-user-id';

  beforeAll(async () => {
    // Clear user table for this user ID
    await db.delete(user).where(eq(user.id, testUserId));

    // Insert test user
    await db.insert(user).values({
      id: testUserId,
      name: 'Old Name',
      email: 'update-test@example.com',
      role: 'PROVIDER',
      status: 'ACTIVE',
    });
  });

  test('successfully updates user name', async () => {
    const result = await useCase.execute({
      userId: testUserId,
      name: '  New Premium Name  ',
    });

    expect(result.success).toBe(true);

    const [updatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, testUserId))
      .limit(1);

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.name).toBe('New Premium Name');
    expect(updatedUser?.updatedAt).toBeDefined();
  });

  test('successfully updates user social links and provider visibility', async () => {
    const result = await useCase.execute({
      userId: testUserId,
      socialLinks: {
        whatsapp: '5511999999999',
        instagram: 'https://instagram.com/myprofile',
        website: 'https://mywebsite.com',
      },
      isProviderVisible: false,
    });

    expect(result.success).toBe(true);

    const [updatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, testUserId))
      .limit(1);

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.socialLinks).toEqual({
      whatsapp: '5511999999999',
      instagram: 'https://instagram.com/myprofile',
      website: 'https://mywebsite.com',
    });
    expect(updatedUser?.isProviderVisible).toBe(false);
  });

  test('fails if name is too short', async () => {
    expect(
      useCase.execute({
        userId: testUserId,
        name: 'ab',
      }),
    ).rejects.toThrow('Name must be at least 3 characters long');
  });
});
