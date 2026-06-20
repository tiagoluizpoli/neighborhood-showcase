import type { Announcement } from '../../entities/announcement.entity';
import type { AnnouncementContactSettings } from '../../entities/contact';

export interface CreateAnnouncementInput {
  providerId: string;
  providerAssignmentId: string;
  title: string;
  subtitle?: string | null;
  description: string;
  priceCents?: number | null;
  imageUrl: string;
  categoryId: string;
  tags: string[];
  contact: AnnouncementContactSettings;
  showVerifiedBadge: boolean;
}

export interface CreateAnnouncementUseCase {
  execute(input: CreateAnnouncementInput): Promise<Announcement>;
}
