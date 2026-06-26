import { describe, expect, test } from 'bun:test';
import { PublicProviderNotFoundError } from '../../application/use-cases/user/get-public-provider-profile';
import { createUserRouter } from './user';

describe('user.getPublicProfile Router Procedure', () => {
  const providerId = 'profile-test-provider-id';
  const otherProviderId = 'profile-test-other-provider-id';

  const getPublicProviderProfileUseCase = {
    execute: async ({ providerId: id }: { providerId: string }) => {
      if (id === otherProviderId) {
        throw new PublicProviderNotFoundError();
      }

      if (id !== providerId) {
        throw new PublicProviderNotFoundError();
      }

      return {
        provider: {
          id: providerId,
          displayName: 'Jane Profile Provider',
          companyName: null,
          tradeName: null,
          logoUrl: null,
          logoOriginalUrl: null,
          bannerUrl: null,
          bannerOriginalUrl: null,
          publicDescription: null,
          socialLinks: {
            whatsapp: '5511999999999',
            instagram: 'jane.provider',
          },
          isVerified: true,
          verifiedCondo: {
            condoId: 'profile-test-condo-id',
            condoName: 'Profile Towers',
          },
        },
        announcements: [
          {
            id: 'profile-test-active-ann-id',
            providerId,
            condominiumId: 'profile-test-condo-id',
            title: 'Expert House Cleaning',
            subtitle: null,
            description: 'Reliable and fast deep cleaning services',
            priceCents: null,
            imageUrl: 'http://localhost/cleaning.jpg',
            categoryId: 'cat-servicos',
            tags: [],
            contact: {
              mode: 'custom' as const,
              custom: { primaryPhone: '5511999999999', callEnabled: false },
            },
            cta: { primary: null, secondary: [] },
            contactLinks: {
              whatsapp: '5511999999999',
            },
            showVerifiedBadge: true,
            status: 'ACTIVE',
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            category: 'Serviços',
            condoName: 'Profile Towers',
            condoCity: 'Curitiba',
            condoState: 'PR',
            providerName: 'Jane Profile Provider',
            providerAvatarUrl: 'http://localhost/jane-avatar.jpg',
          },
        ],
      };
    },
  };

  const createRouter = () =>
    createUserRouter({
      deleteUserAccountUseCase: {
        execute: async () => {},
      },
      getPublicProviderProfileUseCase,
      getUserAccessProfileUseCase: {
        execute: async () => ({
          providerEnabled: false,
        }),
      },
      getUserProfileUseCase: {
        execute: async () => {
          throw new Error('Not used in this test');
        },
      },
      updateUserUseCase: {
        execute: async () => ({ success: true }),
      },
    });

  test('successfully retrieves public profile of an active provider with active announcements', async () => {
    const caller = createRouter().createCaller({
      auth: null,
      session: null,
    });

    const res = await caller.getPublicProfile({ id: providerId });

    expect(res.provider.id).toBe(providerId);
    expect(res.provider.displayName).toBe('Jane Profile Provider');
    expect(res.provider.socialLinks).toEqual({
      whatsapp: '5511999999999',
      instagram: 'jane.provider',
    });
    expect(res.provider.isVerified).toBe(true);

    expect(res.announcements).toHaveLength(1);
    const firstAnn = res.announcements[0];
    expect(firstAnn).toBeDefined();
    if (!firstAnn) throw new Error('Announcement not found');
    expect(firstAnn.id).toBe('profile-test-active-ann-id');
    expect(firstAnn.title).toBe('Expert House Cleaning');
    expect(firstAnn.status).toBe('ACTIVE');
    expect(firstAnn.condoName).toBe('Profile Towers');
    expect(firstAnn.condoCity).toBe('Curitiba');
    expect(firstAnn.condoState).toBe('PR');
  });

  test('throws NOT_FOUND when provider does not exist', async () => {
    const caller = createRouter().createCaller({
      auth: null,
      session: null,
    });

    expect(caller.getPublicProfile({ id: 'non-existent-id' })).rejects.toThrow(
      'Prestador não encontrado',
    );
  });

  test('throws NOT_FOUND when provider is banned', async () => {
    const caller = createRouter().createCaller({
      auth: null,
      session: null,
    });

    expect(caller.getPublicProfile({ id: otherProviderId })).rejects.toThrow(
      'Prestador não encontrado',
    );
  });
});
