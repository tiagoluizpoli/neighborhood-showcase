import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { providerProfile } from '@neighborhood-showcase/db/schema/showcase';

describe('ProviderProfile Router Integration Tests', () => {
  const userAId = 'ppr-user-a-id';
  const userBId = 'ppr-user-b-id';

  beforeAll(async () => {
    // Clean slate
    await db.delete(providerProfile);
    await db.delete(user);

    await db.insert(user).values([
      {
        id: userAId,
        name: 'Provider User A',
        email: 'usera@ppr.test',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: userBId,
        name: 'Provider User B',
        email: 'userb@ppr.test',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
    ]);
  });

  beforeEach(async () => {
    // Reset provider profiles between tests
    await db.delete(providerProfile);
  });

  const createCaller = (userId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { appRouter } = require('./index');
    return appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: `sess-ppr-${userId}`,
          userId,
          token: `tok-ppr-${userId}`,
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: userId,
          name: 'Test User',
          email: `${userId}@ppr.test`,
          emailVerified: true,
          role: 'USER' as const,
          status: 'ACTIVE' as const,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });
  };

  test('(a) logged-in User A can get their own profile after update', async () => {
    const callerA = createCaller(userAId);

    // Upsert first — profile may not exist yet
    await callerA.providerProfile.update({
      displayName: 'Provider A Profile',
      companyName: 'Company A',
      tradeName: 'TradeA',
      publicDescription: 'This is a description for provider A.',
      socialLinks: { whatsapp: '5511999999999', email: 'contact@a.com' },
      isProviderVisible: true,
    });

    const result = await callerA.providerProfile.get();

    expect(result.displayName).toBe('Provider A Profile');
    expect(result.companyName).toBe('Company A');
    expect(result.tradeName).toBe('TradeA');
    expect(result.publicDescription).toBe(
      'This is a description for provider A.',
    );
    expect(result.socialLinks.whatsapp).toBe('5511999999999');
    expect(result.socialLinks.email).toBe('contact@a.com');
    expect(result.isProviderVisible).toBe(true);
  });

  test('(b) logged-in User A can update their profile and changes persist', async () => {
    const callerA = createCaller(userAId);

    await callerA.providerProfile.update({
      displayName: 'First Name',
    });

    const first = await callerA.providerProfile.get();
    expect(first.displayName).toBe('First Name');

    await callerA.providerProfile.update({
      displayName: 'Updated Name',
      publicDescription: 'Updated description text.',
      isProviderVisible: false,
    });

    const second = await callerA.providerProfile.get();
    expect(second.displayName).toBe('Updated Name');
    expect(second.publicDescription).toBe('Updated description text.');
    expect(second.isProviderVisible).toBe(false);
    // Unchanged fields stay intact
    expect(second.companyName).toBeNull();
  });

  test('(c) User A CANNOT read User B profile (cross-tenant check)', async () => {
    const callerA = createCaller(userAId);
    const callerB = createCaller(userBId);

    // User B creates a profile
    await callerB.providerProfile.update({
      displayName: 'User B Profile',
      companyName: 'Company B',
    });

    // User A tries to get User B — but providerProfile.get() uses ctx.session.user.id
    // so User A only ever gets their own. This is enforced by the router design.
    // We verify User A's call fails with NOT_FOUND since their own profile doesn't exist yet
    await expect(callerA.providerProfile.get()).rejects.toThrow(
      expect.objectContaining({ code: 'NOT_FOUND' }),
    );
  });

  test('(d) displayName with length < 3 is rejected', async () => {
    const callerA = createCaller(userAId);

    await expect(
      callerA.providerProfile.update({
        displayName: 'AB', // 2 chars — below minimum
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  test('(e) publicDescription with length > 500 is rejected', async () => {
    const callerA = createCaller(userAId);
    const longDesc = 'A'.repeat(501);

    await expect(
      callerA.providerProfile.update({
        publicDescription: longDesc,
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });
});
