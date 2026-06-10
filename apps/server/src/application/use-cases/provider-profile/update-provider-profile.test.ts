import { describe, expect, test } from 'bun:test';
import type { ProviderProfileRepository } from '../../../domain/repositories/provider-profile.repository';
import {
  InvalidProviderDisplayNameError,
  InvalidProviderPublicDescriptionError,
  UpdateProviderProfile,
} from './update-provider-profile';

describe('UpdateProviderProfile use case', () => {
  const mockRepo: ProviderProfileRepository = {
    async findByProviderId() {
      return null;
    },
    async upsert() {
      return null as never;
    },
    async delete() {},
  };

  const useCase = new UpdateProviderProfile(mockRepo);

  test('displayName shorter than 3 chars throws InvalidProviderDisplayNameError', async () => {
    await expect(
      useCase.execute({ providerId: 'p1', displayName: 'ab' }),
    ).rejects.toThrow(InvalidProviderDisplayNameError);
  });

  test('displayName of exactly 2 non-whitespace chars throws', async () => {
    await expect(
      useCase.execute({ providerId: 'p1', displayName: 'ab' }),
    ).rejects.toThrow(InvalidProviderDisplayNameError);
  });

  test('displayName of 3+ chars does not throw', async () => {
    await expect(
      useCase.execute({ providerId: 'p1', displayName: 'abc' }),
    ).resolves.toBeUndefined();
  });

  test('publicDescription over 500 chars throws InvalidProviderPublicDescriptionError', async () => {
    const longDesc = 'a'.repeat(501);
    await expect(
      useCase.execute({ providerId: 'p1', publicDescription: longDesc }),
    ).rejects.toThrow(InvalidProviderPublicDescriptionError);
  });

  test('publicDescription of 500 chars does not throw', async () => {
    await expect(
      useCase.execute({
        providerId: 'p1',
        publicDescription: 'a'.repeat(500),
      }),
    ).resolves.toBeUndefined();
  });

  test('null publicDescription does not throw', async () => {
    await expect(
      useCase.execute({ providerId: 'p1', publicDescription: null }),
    ).resolves.toBeUndefined();
  });

  test('undefined displayName does not throw validation', async () => {
    await expect(
      useCase.execute({ providerId: 'p1' }),
    ).resolves.toBeUndefined();
  });

  test('whitespace-only displayName throws', async () => {
    await expect(
      useCase.execute({ providerId: 'p1', displayName: '   ' }),
    ).rejects.toThrow(InvalidProviderDisplayNameError);
  });
});
