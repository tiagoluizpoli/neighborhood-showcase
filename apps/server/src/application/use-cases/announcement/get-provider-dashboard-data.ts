import type { AnalyticsRepository } from '../../../domain/repositories/analytics.repository';
import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';

export interface GetProviderDashboardDataInput {
  providerId: string;
}

export interface DashboardAnnouncementItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  category: string;
  categoryId: string;
  tags: string[];
  contactLinks: {
    whatsapp?: string;
    instagram?: string;
    website?: string;
  };
  showVerifiedBadge: boolean;
  flaggedForReview: boolean;
  status: 'DRAFT' | 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  paidAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  suspensionReason: string | null;
  condoName: string;
  providerLocationId: string | null;
}

export interface ProviderDashboardData {
  stats: {
    totalImpressions: number;
    totalInteractions: number;
    conversionRate: number;
  };
  announcements: {
    active: DashboardAnnouncementItem[];
    draft: DashboardAnnouncementItem[];
    expired: DashboardAnnouncementItem[];
    suspended: DashboardAnnouncementItem[];
  };
}

export class GetProviderDashboardData {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly analyticsRepo: AnalyticsRepository,
  ) {}

  async execute(
    input: GetProviderDashboardDataInput,
  ): Promise<ProviderDashboardData> {
    const { providerId } = input;

    // Fetch all announcements owned by this provider that are not soft-deleted
    const announcements =
      await this.announcementRepo.findDashboardByProviderId(providerId);

    const announcementIds = announcements.map((a) => a.id);
    let totalImpressions = 0;
    let totalInteractions = 0;

    if (announcementIds.length > 0) {
      const events = await this.analyticsRepo.findEvents(announcementIds);

      for (const e of events) {
        if (e.eventType === 'IMPRESSION') {
          totalImpressions++;
        } else if (e.eventType === 'CONTACT_CLICK') {
          totalInteractions++;
        }
      }
    }

    const conversionRate =
      totalImpressions > 0
        ? Number(((totalInteractions / totalImpressions) * 100).toFixed(2))
        : 0;

    const activeList: DashboardAnnouncementItem[] = [];
    const draftList: DashboardAnnouncementItem[] = [];
    const expiredList: DashboardAnnouncementItem[] = [];
    const suspendedList: DashboardAnnouncementItem[] = [];

    for (const raw of announcements) {
      const item: DashboardAnnouncementItem = {
        id: raw.id,
        title: raw.title,
        subtitle: raw.subtitle,
        description: raw.description,
        priceCents: raw.priceCents,
        imageUrl: raw.imageUrl,
        category: raw.category,
        categoryId: raw.categoryId,
        tags: raw.tags,
        contactLinks:
          raw.contactLinks as DashboardAnnouncementItem['contactLinks'],
        showVerifiedBadge: raw.showVerifiedBadge,
        flaggedForReview: raw.flaggedForReview,
        status: raw.status as DashboardAnnouncementItem['status'],
        paidAt: raw.paidAt,
        expiresAt: raw.expiresAt,
        createdAt: raw.createdAt,
        suspensionReason: raw.suspensionReason,
        condoName: raw.condoName || '',
        providerLocationId: raw.providerLocationId,
      };

      if (item.status === 'ACTIVE') {
        activeList.push(item);
      } else if (item.status === 'DRAFT' || item.status === 'PENDING_PAYMENT') {
        draftList.push(item);
      } else if (item.status === 'EXPIRED') {
        expiredList.push(item);
      } else if (item.status === 'SUSPENDED') {
        suspendedList.push(item);
      }
    }

    return {
      stats: {
        totalImpressions,
        totalInteractions,
        conversionRate,
      },
      announcements: {
        active: activeList,
        draft: draftList,
        expired: expiredList,
        suspended: suspendedList,
      },
    };
  }
}
