import { db } from '@neighborhood-showcase/db';
import { analyticsEvent as analyticsEventSchema } from '@neighborhood-showcase/db/schema/showcase';
import { and, gte, inArray } from 'drizzle-orm';
import type {
  AnalyticsEvent,
  AnalyticsRepository,
  CreateAnalyticsEventInput,
} from '../../domain/repositories/analytics.repository';

export class DrizzleAnalyticsRepository implements AnalyticsRepository {
  async insert(input: CreateAnalyticsEventInput): Promise<void> {
    await db.insert(analyticsEventSchema).values({
      id: input.id,
      announcementId: input.announcementId,
      eventType: input.eventType,
      targetType: input.targetType || null,
    });
  }

  async findEvents(
    announcementIds: string[],
    since?: Date,
  ): Promise<AnalyticsEvent[]> {
    if (announcementIds.length === 0) {
      return [];
    }

    const filters = since
      ? and(
          inArray(analyticsEventSchema.announcementId, announcementIds),
          gte(analyticsEventSchema.createdAt, since),
        )
      : inArray(analyticsEventSchema.announcementId, announcementIds);

    const rows = await db.select().from(analyticsEventSchema).where(filters);

    return rows.map((row) => ({
      id: row.id,
      announcementId: row.announcementId,
      eventType: row.eventType as 'IMPRESSION' | 'CONTACT_CLICK',
      targetType: row.targetType as 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | null,
      createdAt: row.createdAt,
    }));
  }
}
