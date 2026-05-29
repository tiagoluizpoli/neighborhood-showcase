import type { Announcement } from '../../entities/announcement.entity';

export interface CreateAnnouncementInput {
  providerId: string;
  condominiumId: string;
  title: string;
  subtitle?: string | null;
  description: string;
  priceCents?: number | null;
  imageUrl: string;
  category: string;
  tags: string[];
  contactLinks: {
    whatsapp?: string;
    instagram?: string;
    website?: string;
  };
  showVerifiedBadge: boolean;
}

export interface CreateAnnouncementUseCase {
  execute(input: CreateAnnouncementInput): Promise<Announcement>;
}
