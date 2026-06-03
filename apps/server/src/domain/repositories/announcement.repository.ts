import type {
  Announcement,
  AnnouncementStatus,
} from '../entities/announcement.entity';

export interface CreateAnnouncementRepositoryInput {
  id: string;
  providerId: string;
  condominiumId?: string | null;
  providerLocationId?: string | null;
  title: string;
  subtitle?: string | null;
  description: string;
  priceCents?: number | null;
  imageUrl: string;
  category: string;
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
  status?: AnnouncementStatus;
}

export interface UpdateAnnouncementRepositoryInput {
  title?: string;
  subtitle?: string | null;
  description?: string;
  priceCents?: number | null;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  contactLinks?: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    website?: string;
  };
  showVerifiedBadge?: boolean;
  flaggedForReview?: boolean;
  status?: AnnouncementStatus;
  paidAt?: Date | null;
  expiresAt?: Date | null;
  deletedAt?: Date | null;
  suspensionReason?: string | null;
}

export interface AnnouncementRepository {
  create(input: CreateAnnouncementRepositoryInput): Promise<Announcement>;
  findById(id: string): Promise<Announcement | null>;
  updateStatus(id: string, status: AnnouncementStatus): Promise<Announcement>;
  update(
    id: string,
    input: UpdateAnnouncementRepositoryInput,
  ): Promise<Announcement>;
}
