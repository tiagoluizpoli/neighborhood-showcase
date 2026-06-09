import { beforeEach, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  announcement,
  category,
  providerProfile,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleSpectrumRepository } from '../../../infrastructure/db/spectrum-repository/spectrum-repository';
import { GetSpectrumOverview } from './get-spectrum-overview';

describe('GetSpectrumOverview use case', () => {
  const spectrumRepo = new DrizzleSpectrumRepository();
  const getSpectrumOverview = new GetSpectrumOverview(spectrumRepo);

  beforeEach(async () => {
    // Clean up test data
    await db.delete(announcement);
    await db.delete(providerProfile);
    await db.delete(user);
    await db.delete(category);

    // Seed test category
    await db.insert(category).values({
      id: 'spectrum-test-category',
      slug: 'test-category',
      name: 'Test Category',
      description: null,
      icon: null,
      displayOrder: 1,
      isActive: true,
    });

    // Seed test users
    await db.insert(user).values({
      id: 'spectrum-test-provider-1',
      email: 'provider1@test.com',
      name: 'Provider One',
      role: 'USER',
      status: 'ACTIVE',
    });
    await db.insert(user).values({
      id: 'spectrum-test-user-1',
      email: 'user1@test.com',
      name: 'New User',
      role: 'USER',
      status: 'ACTIVE',
    });

    // Seed provider profiles
    await db.insert(providerProfile).values({
      providerId: 'spectrum-test-provider-1',
      displayName: 'Provider One',
      socialLinks: {},
      isProviderVisible: true,
    });

    // Seed announcements
    await db.insert(announcement).values({
      id: 'spectrum-test-active-1',
      providerId: 'spectrum-test-provider-1',
      title: 'Active Announcement 1',
      description: 'Test description for active announcement 1',
      imageUrl: 'https://example.com/image1.jpg',
      categoryId: 'spectrum-test-category',
      tags: [],
      contactLinks: { whatsapp: '11999999999' },
      showVerifiedBadge: false,
      flaggedForReview: false,
      status: 'ACTIVE',
    });
  });

  test('returns overview with positive counts for active providers and announcements', async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const result = await getSpectrumOverview.execute({
      periodStart: thirtyDaysAgo,
      periodEnd: thirtyDaysFromNow,
    });

    expect(result.activeProviders).toBeGreaterThanOrEqual(1);
    expect(result.totalAnnouncements).toBeGreaterThanOrEqual(1);
  });

  test('returns entity with correct period dates', async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const result = await getSpectrumOverview.execute({
      periodStart: thirtyDaysAgo,
      periodEnd: thirtyDaysFromNow,
    });

    expect(result.periodStart.getTime()).toBe(thirtyDaysAgo.getTime());
    expect(result.periodEnd.getTime()).toBe(thirtyDaysFromNow.getTime());
  });
});
