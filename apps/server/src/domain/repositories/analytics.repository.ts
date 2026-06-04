export interface AnalyticsEvent {
  id: string;
  announcementId: string;
  eventType: 'IMPRESSION' | 'CONTACT_CLICK';
  targetType: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | null;
  createdAt: Date;
}

export interface CreateAnalyticsEventInput {
  id: string;
  announcementId: string;
  eventType: 'IMPRESSION' | 'CONTACT_CLICK';
  targetType?: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | null;
}

export interface AnalyticsRepository {
  insert(input: CreateAnalyticsEventInput): Promise<void>;
  findEvents(
    announcementIds: string[],
    since?: Date,
  ): Promise<AnalyticsEvent[]>;
}
