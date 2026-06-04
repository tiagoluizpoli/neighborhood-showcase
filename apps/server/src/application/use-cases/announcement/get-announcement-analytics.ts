import type { AnalyticsRepository } from '../../../domain/repositories/analytics.repository';
import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import { DomainError } from '../../../shared/domain-error';

export interface GetAnnouncementAnalyticsInput {
  announcementId?: string;
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

export class AnnouncementNotFoundError extends DomainError {
  constructor() {
    super('Anúncio não encontrado.');
  }
}

export class AnnouncementAccessDeniedError extends DomainError {
  constructor() {
    super('Acesso negado. Você não é o proprietário deste anúncio.');
  }
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
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly analyticsRepo: AnalyticsRepository,
  ) {}

  async execute(
    input: GetAnnouncementAnalyticsInput,
  ): Promise<AnnouncementAnalyticsResult> {
    const { announcementId, providerId, period } = input;

    let announcementIds: string[] = [];

    if (announcementId) {
      const ann = await this.announcementRepo.findById(announcementId);
      if (!ann || ann.deletedAt !== null) {
        throw new AnnouncementNotFoundError();
      }

      if (ann.providerId !== providerId) {
        throw new AnnouncementAccessDeniedError();
      }
      announcementIds = [announcementId];
    } else {
      announcementIds =
        await this.announcementRepo.findIdsByProviderId(providerId);
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

    // Fetch events from repository
    const events =
      announcementIds.length > 0
        ? await this.analyticsRepo.findEvents(announcementIds, startDate)
        : [];

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
