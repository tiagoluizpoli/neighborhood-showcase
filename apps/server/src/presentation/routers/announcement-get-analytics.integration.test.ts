import { beforeAll, describe, expect, test } from 'bun:test';
import { db } from '@neighborhood-showcase/db';
import { user } from '@neighborhood-showcase/db/schema/auth';
import {
  analyticsEvent,
  announcement,
  providerLocation as assignment,
  condominium,
} from '@neighborhood-showcase/db/schema/showcase';
import { appRouter } from './index';

describe('getAnalytics Announcement Router Procedure', () => {
  const providerId = 'analytics-test-provider-id';
  const otherProviderId = 'analytics-test-other-provider-id';
  const condoId = 'analytics-test-condo-id';
  const testAnnId = 'analytics-test-ann-id';
  const otherAnnId = 'analytics-test-other-ann-id';

  beforeAll(async () => {
    // Clear tables
    await db.delete(analyticsEvent);
    await db.delete(announcement);
    await db.delete(assignment);
    await db.delete(condominium);
    await db.delete(user);

    // Insert user (provider)
    await db.insert(user).values([
      {
        id: providerId,
        name: 'John Analytics Provider',
        email: 'john-analytics@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
      {
        id: otherProviderId,
        name: 'Other Provider',
        email: 'other-provider@example.com',
        emailVerified: true,
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    ]);

    // Insert condo
    await db.insert(condominium).values({
      id: condoId,
      name: 'Analytics Towers',
      city: 'Joinville',
      state: 'SC',
      cep: '89200000',
      createdBy: providerId,
      status: 'APPROVED',
    });

    // Insert announcements
    await db.insert(announcement).values([
      {
        id: testAnnId,
        providerId,
        condominiumId: condoId,
        title: 'Analytics Service 1',
        description: 'Warm and tasty service',
        imageUrl: 'http://localhost:9000/showcase/pizza.jpg',
        category: 'Alimentação',
        status: 'ACTIVE',
      },
      {
        id: otherAnnId,
        providerId: otherProviderId,
        condominiumId: condoId,
        title: 'Other Service',
        description: 'Warm and tasty service',
        imageUrl: 'http://localhost:9000/showcase/pizza.jpg',
        category: 'Alimentação',
        status: 'ACTIVE',
      },
    ]);

    // Seed events at specific timestamps
    // We want some today, some 3 days ago, some 15 days ago, and some 6 months ago.
    const now = new Date();

    const today = new Date(now);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fifteenDaysAgo = new Date(now);
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    await db.insert(analyticsEvent).values([
      // Today (Impressions: 2, Clicks: 1 whatsapp)
      {
        id: 'evt-1',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: today,
      },
      {
        id: 'evt-2',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: today,
      },
      {
        id: 'evt-3',
        announcementId: testAnnId,
        eventType: 'CONTACT_CLICK',
        targetType: 'WHATSAPP',
        createdAt: today,
      },

      // 3 days ago (Impressions: 1, Clicks: 1 instagram)
      {
        id: 'evt-4',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: threeDaysAgo,
      },
      {
        id: 'evt-5',
        announcementId: testAnnId,
        eventType: 'CONTACT_CLICK',
        targetType: 'INSTAGRAM',
        createdAt: threeDaysAgo,
      },

      // 15 days ago (Impressions: 3, Clicks: 1 website)
      {
        id: 'evt-6',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: fifteenDaysAgo,
      },
      {
        id: 'evt-7',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: fifteenDaysAgo,
      },
      {
        id: 'evt-8',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: fifteenDaysAgo,
      },
      {
        id: 'evt-9',
        announcementId: testAnnId,
        eventType: 'CONTACT_CLICK',
        targetType: 'WEBSITE',
        createdAt: fifteenDaysAgo,
      },

      // 6 months ago (Impressions: 5, Clicks: 2 website)
      {
        id: 'evt-10',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: sixMonthsAgo,
      },
      {
        id: 'evt-11',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: sixMonthsAgo,
      },
      {
        id: 'evt-12',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: sixMonthsAgo,
      },
      {
        id: 'evt-13',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: sixMonthsAgo,
      },
      {
        id: 'evt-14',
        announcementId: testAnnId,
        eventType: 'IMPRESSION',
        createdAt: sixMonthsAgo,
      },
      {
        id: 'evt-15',
        announcementId: testAnnId,
        eventType: 'CONTACT_CLICK',
        targetType: 'WEBSITE',
        createdAt: sixMonthsAgo,
      },
      {
        id: 'evt-16',
        announcementId: testAnnId,
        eventType: 'CONTACT_CLICK',
        targetType: 'WEBSITE',
        createdAt: sixMonthsAgo,
      },
    ]);
  });

  const createTestCaller = (userId: string) => {
    return appRouter.createCaller({
      auth: null,
      session: {
        session: {
          id: 'sess-test',
          userId,
          token: 'tok-test',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
          userAgent: null,
          ipAddress: null,
        },
        user: {
          id: userId,
          name: 'Test Provider',
          email: 'test@example.com',
          emailVerified: true,
          role: 'PROVIDER',
          status: 'ACTIVE',
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });
  };

  test('returns 7 days aggregation correctly (omitting > 7 days events)', async () => {
    const caller = createTestCaller(providerId);

    const res = await caller.announcement.getAnalytics({
      announcementId: testAnnId,
      period: '7d',
    });

    // 7d aggregation should include today and 3 days ago.
    // Today: 2 impressions, 1 click (whatsapp)
    // 3 days ago: 1 impression, 1 click (instagram)
    // Total impressions: 3
    // Total clicks: 2
    // Conversion rate: (2 / 3) * 100 = 66.67%
    expect(res.summary.totalImpressions).toBe(3);
    expect(res.summary.totalClicks).toBe(2);
    expect(res.summary.conversionRate).toBe(66.67);

    expect(res.chartData.length).toBe(7);

    // Verify today's data point
    const todayLabel = new Date().toISOString().split('T')[0];
    const todayDp = res.chartData.find((d) => d.label === todayLabel);
    expect(todayDp).toBeDefined();
    expect(todayDp?.impressions).toBe(2);
    expect(todayDp?.clicks).toBe(1);
    expect(todayDp?.whatsappClicks).toBe(1);

    // Verify 3 days ago data point
    const threeDaysAgoDate = new Date();
    threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3);
    const threeDaysAgoLabel = threeDaysAgoDate.toISOString().split('T')[0];
    const threeDaysAgoDp = res.chartData.find(
      (d) => d.label === threeDaysAgoLabel,
    );
    expect(threeDaysAgoDp).toBeDefined();
    expect(threeDaysAgoDp?.impressions).toBe(1);
    expect(threeDaysAgoDp?.clicks).toBe(1);
    expect(threeDaysAgoDp?.instagramClicks).toBe(1);
  });

  test('returns 30 days aggregation correctly (including 15 days ago, omitting 6 months ago)', async () => {
    const caller = createTestCaller(providerId);

    const res = await caller.announcement.getAnalytics({
      announcementId: testAnnId,
      period: '30d',
    });

    // 30d aggregation should include:
    // Today: 2 impressions, 1 click
    // 3 days ago: 1 impression, 1 click
    // 15 days ago: 3 impressions, 1 click (website)
    // Total impressions: 2 + 1 + 3 = 6
    // Total clicks: 1 + 1 + 1 = 3
    // Conversion rate: (3 / 6) * 100 = 50.00%
    expect(res.summary.totalImpressions).toBe(6);
    expect(res.summary.totalClicks).toBe(3);
    expect(res.summary.conversionRate).toBe(50);

    expect(res.chartData.length).toBe(30);

    // Verify 15 days ago data point
    const fifteenDaysAgoDate = new Date();
    fifteenDaysAgoDate.setDate(fifteenDaysAgoDate.getDate() - 15);
    const fifteenDaysAgoLabel = fifteenDaysAgoDate.toISOString().split('T')[0];
    const fifteenDaysAgoDp = res.chartData.find(
      (d) => d.label === fifteenDaysAgoLabel,
    );
    expect(fifteenDaysAgoDp).toBeDefined();
    expect(fifteenDaysAgoDp?.impressions).toBe(3);
    expect(fifteenDaysAgoDp?.clicks).toBe(1);
    expect(fifteenDaysAgoDp?.websiteClicks).toBe(1);
  });

  test('returns 12 months aggregation correctly (including 6 months ago)', async () => {
    const caller = createTestCaller(providerId);

    const res = await caller.announcement.getAnalytics({
      announcementId: testAnnId,
      period: '12m',
    });

    // 12m aggregation should include:
    // Today: 2 impressions, 1 click
    // 3 days ago: 1 impression, 1 click
    // 15 days ago: 3 impressions, 1 click
    // 6 months ago: 5 impressions, 2 clicks
    // Total impressions: 6 + 5 = 11
    // Total clicks: 3 + 2 = 5
    // Conversion rate: (5 / 11) * 100 = 45.45%
    expect(res.summary.totalImpressions).toBe(11);
    expect(res.summary.totalClicks).toBe(5);
    expect(res.summary.conversionRate).toBe(45.45);

    expect(res.chartData.length).toBe(12);

    // Verify 6 months ago data point
    const sixMonthsAgoDate = new Date();
    sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - 6);
    const monthStr = String(sixMonthsAgoDate.getMonth() + 1).padStart(2, '0');
    const sixMonthsAgoLabel = `${sixMonthsAgoDate.getFullYear()}-${monthStr}`;

    const sixMonthsAgoDp = res.chartData.find(
      (d) => d.label === sixMonthsAgoLabel,
    );
    expect(sixMonthsAgoDp).toBeDefined();
    expect(sixMonthsAgoDp?.impressions).toBe(5);
    expect(sixMonthsAgoDp?.clicks).toBe(2);
    expect(sixMonthsAgoDp?.websiteClicks).toBe(2);
  });

  test('throws FORBIDDEN when announcement belongs to a different provider', async () => {
    const caller = createTestCaller(providerId);

    expect(
      caller.announcement.getAnalytics({
        announcementId: otherAnnId,
        period: '7d',
      }),
    ).rejects.toThrow(
      'Acesso negado. Você não é o proprietário deste anúncio.',
    );
  });

  test('throws NOT_FOUND when announcement does not exist', async () => {
    const caller = createTestCaller(providerId);

    expect(
      caller.announcement.getAnalytics({
        announcementId: 'non-existent-id',
        period: '7d',
      }),
    ).rejects.toThrow('Anúncio não encontrado.');
  });
});
