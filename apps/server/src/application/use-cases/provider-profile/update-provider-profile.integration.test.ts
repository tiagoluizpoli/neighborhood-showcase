import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import { providerProfile as providerProfileSchema } from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
import { ProviderProfileRepositoryImpl } from '../../../infrastructure/db/provider-profile-repository';
import {
  InvalidProviderDisplayNameError,
  InvalidProviderPublicDescriptionError,
  UpdateProviderProfile,
} from './update-provider-profile';

describe('UpdateProviderProfile integration', () => {
  const repo = new ProviderProfileRepositoryImpl();
  const useCase = new UpdateProviderProfile(repo);

  const testUserId = 'update-provider-profile-integration-user';

  beforeAll(async () => {
    // Seed a user (provider) — user must exist in auth.user
    await db
      .delete(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, testUserId));
    await db.delete(user).where(eq(user.id, testUserId));

    await db.insert(user).values({
      id: testUserId,
      name: 'Provider Integration Test',
      email: 'provider-integration@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });
  });

  test('upserts all 9 fields on a fresh provider_profile row', async () => {
    await useCase.execute({
      providerId: testUserId,
      displayName: 'Acme Soluções',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
      companyName: 'Acme Tecnologia LTDA',
      tradeName: 'Acme Soluções',
      logoUrl: 'https://cdn.example.com/logo.png',
      bannerUrl: 'https://cdn.example.com/banner.jpg',
      publicDescription: 'Oferecemos soluções completas para condomínios.',
      socialLinks: {
        whatsapp: '5511999999999',
        instagram: 'https://instagram.com/acme',
        website: 'https://acme.example.com',
      },
      isProviderVisible: true,
    });

    const [row] = await db
      .select()
      .from(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, testUserId))
      .limit(1);

    expect(row).not.toBeNull();
    const r = row as NonNullable<typeof row>;
    expect(r.displayName).toBe('Acme Soluções');
    expect(r.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
    expect(r.companyName).toBe('Acme Tecnologia LTDA');
    expect(r.tradeName).toBe('Acme Soluções');
    expect(r.logoUrl).toBe('https://cdn.example.com/logo.png');
    expect(r.bannerUrl).toBe('https://cdn.example.com/banner.jpg');
    expect(r.publicDescription).toBe(
      'Oferecemos soluções completas para condomínios.',
    );
    expect(r.socialLinks).toEqual({
      whatsapp: '5511999999999',
      instagram: 'https://instagram.com/acme',
      website: 'https://acme.example.com',
    });
    expect(r.isProviderVisible).toBe(true);
  });

  test('displayName with 2 chars throws InvalidProviderDisplayNameError', async () => {
    await expect(
      useCase.execute({ providerId: testUserId, displayName: 'ab' }),
    ).rejects.toThrow(InvalidProviderDisplayNameError);
  });

  test('publicDescription with 501 chars throws InvalidProviderPublicDescriptionError', async () => {
    const longDesc = 'a'.repeat(501);
    await expect(
      useCase.execute({ providerId: testUserId, publicDescription: longDesc }),
    ).rejects.toThrow(InvalidProviderPublicDescriptionError);
  });

  test('subsequent update overwrites previous values', async () => {
    await useCase.execute({
      providerId: testUserId,
      displayName: 'Novo Nome',
      isProviderVisible: false,
    });

    const [row] = await db
      .select()
      .from(providerProfileSchema)
      .where(eq(providerProfileSchema.providerId, testUserId))
      .limit(1);

    expect(row).not.toBeNull();
    const r = row as NonNullable<typeof row>;
    expect(r.displayName).toBe('Novo Nome');
    expect(r.isProviderVisible).toBe(false);
    // companyName/logoUrl etc. should be preserved (merged, not overwritten)
    expect(r.companyName).toBe('Acme Tecnologia LTDA');
  });
});
