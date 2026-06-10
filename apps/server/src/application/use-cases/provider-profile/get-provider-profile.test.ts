import { describe, expect, test } from 'bun:test';
import { ProviderProfile } from '../../../domain/entities/provider-profile.entity';
import type { ProviderProfileRepository } from '../../../domain/repositories/provider-profile.repository';
import {
  GetProviderProfile,
  ProviderProfileNotFoundError,
} from './get-provider-profile';

describe('GetProviderProfile use case', () => {
  test('throws ProviderProfileNotFoundError when repo returns null', async () => {
    const mockRepo: ProviderProfileRepository = {
      async findByProviderId() {
        return null;
      },
      async upsert() {
        return null as never;
      },
      async delete() {},
    };

    const useCase = new GetProviderProfile(mockRepo);

    await expect(
      useCase.execute({ providerId: 'nonexistent-id' }),
    ).rejects.toThrow(ProviderProfileNotFoundError);
  });

  test('returns the provider profile when found', async () => {
    const fakeProfile = new ProviderProfile(
      {
        displayName: 'Test Provider',
        avatarUrl: null,
        companyName: null,
        tradeName: null,
        logoUrl: null,
        bannerUrl: null,
        publicDescription: null,
        socialLinks: {},
        isProviderVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      'provider-123',
    );

    const mockRepo: ProviderProfileRepository = {
      async findByProviderId(id: string) {
        if (id === 'provider-123') return fakeProfile;
        return null;
      },
      async upsert() {
        return null as never;
      },
      async delete() {},
    };

    const useCase = new GetProviderProfile(mockRepo);

    const result = await useCase.execute({ providerId: 'provider-123' });

    expect(result).toBe(fakeProfile);
    expect(result.displayName).toBe('Test Provider');
  });
});
