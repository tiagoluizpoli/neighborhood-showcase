import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  analyticsEvent,
  announcement,
  providerAssignment as assignment,
  condominium,
  providerProfile,
} from '@neighborhood-showcase/db/schema/showcase';
import { eq } from 'drizzle-orm';
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
    await db.delete(providerProfile);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert user
    await db.insert(user).values({
      id: providerId,
      name: 'Dash Provider',
      email: 'dash@example.com',
      emailVerified: true,
      role: 'USER',
      status: 'ACTIVE',
    });

    await db.insert(providerProfile).values({
      providerId,
      displayName: 'Dash Provider',
      primaryPhone: '+5511999999999',
      callEnabled: true,
      contactMetadata: {},
      isProviderVisible: true,
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
        contactMode: 'inherit' as const,
        contactCustom: null,
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
        contactMode: 'inherit' as const,
        contactCustom: null,
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
        contactMode: 'inherit' as const,
        contactCustom: null,
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
        contactMode: 'inherit' as const,
        contactCustom: null,
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
        contactMode: 'inherit' as const,
        contactCustom: null,
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
    expect(activeAd.contact.mode).toBe('inherit');
    expect(activeAd.contactLinks.whatsapp).toContain('9999');
    expect(activeAd.contactLinks.phone).toBe(activeAd.contactLinks.whatsapp);

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

  test('resolves inherited announcements from live provider defaults and keeps custom announcements isolated', async () => {
    await db
      .update(announcement)
      .set({
        contactMode: 'custom',
        contactCustom: {
          primaryPhone: '551188887777',
          callEnabled: false,
        },
      })
      .where(eq(announcement.id, 'ann-draft'));

    await db
      .update(providerProfile)
      .set({
        primaryPhone: '551177776666',
        callEnabled: false,
      })
      .where(eq(providerProfile.providerId, providerId));

    const result = await useCase.execute({ providerId });

    const inheritedActive = result.announcements.active.find(
      (item) => item.id === 'ann-active',
    );
    expect(inheritedActive).toBeDefined();
    if (!inheritedActive) throw new Error('Expected inherited active ad');
    expect(inheritedActive.contact.mode).toBe('inherit');
    expect(inheritedActive.contactLinks.whatsapp).toBe('551177776666');
    expect(inheritedActive.contactLinks.phone).toBeUndefined();

    const customDraft = result.announcements.draft.find(
      (item) => item.id === 'ann-draft',
    );
    expect(customDraft).toBeDefined();
    if (!customDraft) throw new Error('Expected custom draft ad');
    expect(customDraft.contact.mode).toBe('custom');
    expect(customDraft.contactLinks.whatsapp).toBe('551188887777');
    expect(customDraft.contactLinks.phone).toBeUndefined();
  });
});
