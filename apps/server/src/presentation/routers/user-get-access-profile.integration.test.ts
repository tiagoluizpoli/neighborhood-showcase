import { describe, expect, test } from 'bun:test';
import type { GetUserAccessProfileInput } from '../../application/use-cases/user/get-user-access-profile';
import { createUserRouter } from './user';

describe('user.getAccessProfile Router Procedure', () => {
  const userId = 'router-access-profile-user-id';

  const getUserAccessProfileUseCase = {
    execute: async ({ userId: inputUserId }: GetUserAccessProfileInput) => ({
      providerEnabled: inputUserId === userId,
    }),
  };

  const createRouter = () =>
    createUserRouter({
      deleteUserAccountUseCase: {
        execute: async () => {},
      },
      getPublicProviderProfileUseCase: {
        execute: async () => {
          throw new Error('Not used in this test');
        },
      },
      getUserAccessProfileUseCase,
      getUserProfileUseCase: {
        execute: async () => {
          throw new Error('Not used in this test');
        },
      },
      updateUserUseCase: {
        execute: async () => ({ success: true }),
      },
    });

  test('returns the backend-derived providerEnabled flag for the authenticated user', async () => {
    const caller = createRouter().createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-user-access-profile',
          userId,
          token: 'tok-user-access-profile',
          expiresAt: new Date(Date.now() + 3_600_000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: userId,
          name: 'Router Access Profile User',
          email: 'router-access-profile@example.com',
          emailVerified: true,
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          image: null,
          phone: null,
          cpfHash: null,
          deletedAt: null,
        },
      },
    });

    const result = await caller.getAccessProfile();

    expect(result.providerEnabled).toBe(true);
  });
});
