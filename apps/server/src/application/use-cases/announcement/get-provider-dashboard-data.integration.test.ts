import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  analyticsEvent,
  announcement,
  providerLocation as assignment,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { DrizzleAnalyticsRepository } from '../../../infrastructure/db/analytics-repository';
import { DrizzleAnnouncementRepository } from '../../../infrastructure/db/announcement-repository';
import { GetProviderDashboardData } from './get-provider-dashboard-data';

describe('Get Provider Dashboard Data Integration Test', () => {
  const useCase = new GetProviderDashboardData(
    new DrizzleAnnouncementRepository(),
    new DrizzleAnalyticsRepository(),
  );

  const providerId = 'dash-provider-id';
  const condoId = 'dash-condo-id';

  beforeAll(async () => {
    // Clear tables
    await db.delete(analyticsEvent);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert user
    await db.insert(user).values({
      id: providerId,
      name: 'Dash Provider',
      email: 'dash@example.com',
      emailVerified: true,
      role: 'PROVIDER',
      status: 'ACTIVE',
    });

    // Insert condo
    await db.insert(condominium).values({
      id: condoId,
      name: 'Residencial Dashboard',
      city: 'Joinville',
      state: 'SC',
      cep: '89200000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    // Insert announcements
    await db.insert(announcement).values([
      {
        id: 'ann-active',
        providerId,
        condominiumId: condoId,
        title: 'Active Service',
        description: 'Clean coding services.',
        imageUrl: 'https://example.com/img.png',
        categoryId: 'cat-servicos',
        tags: [],
        contactLinks: {},
        status: 'ACTIVE',
      },
      {
        id: 'ann-draft',
        providerId,
        condominiumId: condoId,
        title: 'Draft Service',
        description: 'Clean coding services.',
        imageUrl: 'https://example.com/img.png',
        categoryId: 'cat-servicos',
        tags: [],
        contactLinks: {},
        status: 'DRAFT',
      },
      {
        id: 'ann-pending',
        providerId,
        condominiumId: condoId,
        title: 'Pending Payment Service',
        description: 'Clean coding services.',
        imageUrl: 'https://example.com/img.png',
        categoryId: 'cat-servicos',
        tags: [],
        contactLinks: {},
        status: 'PENDING_PAYMENT',
      },
      {
        id: 'ann-expired',
        providerId,
        condominiumId: condoId,
        title: 'Expired Service',
        description: 'Clean coding services.',
        imageUrl: 'https://example.com/img.png',
        categoryId: 'cat-servicos',
        tags: [],
        contactLinks: {},
        status: 'EXPIRED',
      },
      {
        id: 'ann-suspended',
        providerId,
        condominiumId: condoId,
        title: 'Suspended Service',
        description: 'Clean coding services.',
        imageUrl: 'https://example.com/img.png',
        categoryId: 'cat-servicos',
        tags: [],
        contactLinks: {},
        status: 'SUSPENDED',
        suspensionReason: 'Violou diretrizes da comunidade.',
      },
    ]);

    // Insert analytics events
    // Let's create 6 impressions and 2 contact clicks across our announcements
    await db.insert(analyticsEvent).values([
      { id: 'ev-1', announcementId: 'ann-active', eventType: 'IMPRESSION' },
      { id: 'ev-2', announcementId: 'ann-active', eventType: 'IMPRESSION' },
      { id: 'ev-3', announcementId: 'ann-active', eventType: 'IMPRESSION' },
      { id: 'ev-4', announcementId: 'ann-active', eventType: 'IMPRESSION' },
      {
        id: 'ev-5',
        announcementId: 'ann-active',
        eventType: 'CONTACT_CLICK',
      },

      {
        id: 'ev-6',
        announcementId: 'ann-suspended',
        eventType: 'IMPRESSION',
      },
      {
        id: 'ev-7',
        announcementId: 'ann-suspended',
        eventType: 'IMPRESSION',
      },
      {
        id: 'ev-8',
        announcementId: 'ann-suspended',
        eventType: 'CONTACT_CLICK',
      },
    ]);
  });

  test('correctly calculates metrics and groups announcements by status', async () => {
    const result = await useCase.execute({ providerId });

    // Total impressions: 4 on active, 2 on suspended = 6
    // Total interactions: 1 on active, 1 on suspended = 2
    // Conversion rate: (2 / 6) * 100 = 33.33%
    expect(result.stats.totalImpressions).toBe(6);
    expect(result.stats.totalInteractions).toBe(2);
    expect(result.stats.conversionRate).toBe(33.33);

    // Active
    expect(result.announcements.active).toHaveLength(1);
    const activeAd = result.announcements.active[0];
    expect(activeAd).toBeDefined();
    if (!activeAd) throw new Error('Expected active ad');
    expect(activeAd.id).toBe('ann-active');
    expect(activeAd.condoName).toBe('Residencial Dashboard');

    // Draft
    expect(result.announcements.draft).toHaveLength(2);
    const draftIds = result.announcements.draft.map((a) => a.id);
    expect(draftIds).toContain('ann-draft');
    expect(draftIds).toContain('ann-pending');

    // Expired
    expect(result.announcements.expired).toHaveLength(1);
    const expiredAd = result.announcements.expired[0];
    expect(expiredAd).toBeDefined();
    if (!expiredAd) throw new Error('Expected expired ad');
    expect(expiredAd.id).toBe('ann-expired');

    // Suspended
    expect(result.announcements.suspended).toHaveLength(1);
    const suspendedAd = result.announcements.suspended[0];
    expect(suspendedAd).toBeDefined();
    if (!suspendedAd) throw new Error('Expected suspended ad');
    expect(suspendedAd.id).toBe('ann-suspended');
    expect(suspendedAd.suspensionReason).toBe(
      'Violou diretrizes da comunidade.',
    );
  });
});
