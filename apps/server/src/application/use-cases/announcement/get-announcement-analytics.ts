import { db } from '@neighborhood-showcase/db';
import {
  analyticsEvent as analyticsEventSchema,
  announcement as announcementSchema,
} from '@neighborhood-showcase/db/schema/showcase';
import { TRPCError } from '@trpc/server';
import { and, eq, gte, isNull } from 'drizzle-orm';

export interface GetAnnouncementAnalyticsInput {
  announcementId: string;
  providerId: string;
  period: '7d' | '30d' | '12m';
}

export interface AnalyticsDataPoint {
  label: string;
  impressions: number;
  clicks: number;
  whatsappClicks: number;
  instagramClicks: number;
  websiteClicks: number;
}

export interface AnnouncementAnalyticsResult {
  summary: {
    totalImpressions: number;
    totalClicks: number;
    conversionRate: number;
  };
  chartData: AnalyticsDataPoint[];
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export class GetAnnouncementAnalytics {
  async execute(
    input: GetAnnouncementAnalyticsInput,
  ): Promise<AnnouncementAnalyticsResult> {
    const { announcementId, providerId, period } = input;

    // Fetch the announcement to check existence and ownership
    const [ann] = await db
      .select({ providerId: announcementSchema.providerId })
      .from(announcementSchema)
      .where(
        and(
          eq(announcementSchema.id, announcementId),
          isNull(announcementSchema.deletedAt),
        ),
      )
      .limit(1);

    if (!ann) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Anúncio não encontrado.',
      });
    }

    if (ann.providerId !== providerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Acesso negado. Você não é o proprietário deste anúncio.',
      });
    }

    // Determine the start date and generate bucket labels
    const startDate = new Date();
    const buckets: string[] = [];

    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets.push(formatDate(d));
      }
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets.push(formatDate(d));
      }
    } else {
      // 12m
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        buckets.push(formatMonth(d));
      }
    }

    // Fetch events from database
    const events = await db
      .select({
        eventType: analyticsEventSchema.eventType,
        targetType: analyticsEventSchema.targetType,
        createdAt: analyticsEventSchema.createdAt,
      })
      .from(analyticsEventSchema)
      .where(
        and(
          eq(analyticsEventSchema.announcementId, announcementId),
          gte(analyticsEventSchema.createdAt, startDate),
        ),
      );

    // Initialize labels map
    const dataMap = new Map<string, AnalyticsDataPoint>();
    for (const label of buckets) {
      dataMap.set(label, {
        label,
        impressions: 0,
        clicks: 0,
        whatsappClicks: 0,
        instagramClicks: 0,
        websiteClicks: 0,
      });
    }

    // Group events into buckets
    for (const event of events) {
      const key =
        period === '12m'
          ? formatMonth(event.createdAt)
          : formatDate(event.createdAt);

      const dataPoint = dataMap.get(key);
      if (dataPoint) {
        if (event.eventType === 'IMPRESSION') {
          dataPoint.impressions++;
        } else if (event.eventType === 'CONTACT_CLICK') {
          dataPoint.clicks++;
          if (event.targetType === 'WHATSAPP') {
            dataPoint.whatsappClicks++;
          } else if (event.targetType === 'INSTAGRAM') {
            dataPoint.instagramClicks++;
          } else if (event.targetType === 'WEBSITE') {
            dataPoint.websiteClicks++;
          }
        }
      }
    }

    const chartData = Array.from(dataMap.values());
    let totalImpressions = 0;
    let totalClicks = 0;

    for (const dp of chartData) {
      totalImpressions += dp.impressions;
      totalClicks += dp.clicks;
    }

    const conversionRate =
      totalImpressions > 0
        ? Number(((totalClicks / totalImpressions) * 100).toFixed(2))
        : 0;

    return {
      summary: {
        totalImpressions,
        totalClicks,
        conversionRate,
      },
      chartData,
    };
  }
}
