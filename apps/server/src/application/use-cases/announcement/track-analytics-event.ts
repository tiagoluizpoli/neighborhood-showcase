import { randomUUID } from 'node:crypto';
import type { AnalyticsRepository } from '../../../domain/repositories/analytics.repository';

export interface TrackAnalyticsEventInput {
  announcementId: string;
  eventType: 'IMPRESSION' | 'CONTACT_CLICK';
  targetType?: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | null;
}

export class TrackAnalyticsEvent {
  constructor(private readonly analyticsRepo: AnalyticsRepository) {}

  async execute(
    input: TrackAnalyticsEventInput,
  ): Promise<{ success: boolean }> {
    await this.analyticsRepo.insert({
      id: `evt_${randomUUID()}`,
      announcementId: input.announcementId,
      eventType: input.eventType,
      targetType: input.targetType || null,
    });

    return { success: true };
  }
}
