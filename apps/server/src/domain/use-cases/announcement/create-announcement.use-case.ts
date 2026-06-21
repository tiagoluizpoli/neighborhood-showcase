import type { Announcement } from '../../entities/announcement.entity';
import type { AnnouncementContactSettings } from '../../entities/contact';
import type { AnnouncementCta } from '../../entities/cta';

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
  cta: AnnouncementCta;
  showVerifiedBadge: boolean;
}

export interface CreateAnnouncementUseCase {
  execute(input: CreateAnnouncementInput): Promise<Announcement>;
}
