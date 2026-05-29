import { randomUUID } from 'node:crypto';
import { db } from '@base-fullstack-template/db';
import { analyticsEvent } from '@base-fullstack-template/db/schema/showcase';

export interface TrackAnalyticsEventInput {
  announcementId: string;
  eventType: 'IMPRESSION' | 'CONTACT_CLICK';
  targetType?: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | null;
}

export class TrackAnalyticsEvent {
  async execute(
    input: TrackAnalyticsEventInput,
  ): Promise<{ success: boolean }> {
    await db.insert(analyticsEvent).values({
      id: `evt_${randomUUID()}`,
      announcementId: input.announcementId,
      eventType: input.eventType,
      targetType: input.targetType || null,
    });

    return { success: true };
  }
}
