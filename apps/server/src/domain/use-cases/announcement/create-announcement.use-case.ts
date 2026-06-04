import type { Announcement } from '../../entities/announcement.entity';

export interface CreateAnnouncementInput {
  providerId: string;
  providerLocationId: string;
  title: string;
  subtitle?: string | null;
  description: string;
  priceCents?: number | null;
  imageUrl: string;
  categoryId: string;
  tags: string[];
  contactLinks: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    website?: string;
  };
  showVerifiedBadge: boolean;
}

export interface CreateAnnouncementUseCase {
  execute(input: CreateAnnouncementInput): Promise<Announcement>;
}
