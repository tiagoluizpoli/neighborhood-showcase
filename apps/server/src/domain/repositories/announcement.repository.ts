import type {
  Announcement,
  AnnouncementStatus,
} from '../entities/announcement.entity';

export interface CreateAnnouncementRepositoryInput {
  id: string;
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
  status?: AnnouncementStatus;
}

export interface AnnouncementRepository {
  create(input: CreateAnnouncementRepositoryInput): Promise<Announcement>;
  findById(id: string): Promise<Announcement | null>;
  updateStatus(id: string, status: AnnouncementStatus): Promise<Announcement>;
  update(
    id: string,
    input: Partial<Omit<Announcement, 'id' | 'providerId' | 'condominiumId' | 'createdAt'>>,
  ): Promise<Announcement>;
}
