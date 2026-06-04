import type {
  Announcement,
  AnnouncementStatus,
} from '../entities/announcement.entity';

export interface PublicAnnouncementDTO {
  id: string;
  providerId: string;
  condominiumId: string | null;
  providerLocationId: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  categoryId: string;
  tags: string[];
  contactLinks: Record<string, string | undefined>;
  showVerifiedBadge: boolean;
  status: string;
  createdAt: Date;
  category: string;
  condoName: string;
  condoCity: string;
  condoState: string;
  providerName: string;
  providerAvatarUrl: string | null;
}

export interface ModerationAnnouncementDTO {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  category: string;
  categoryId: string;
  tags: string[];
  contactLinks: Record<string, string | undefined>;
  showVerifiedBadge: boolean;
  flaggedForReview: boolean;
  status: string;
  suspensionReason: string | null;
  createdAt: Date;
  providerName: string;
}

export interface ReportedAnnouncementDTO {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
  suspensionReason: string | null;
  createdAt: Date;
  providerId: string;
  providerName: string;
  providerEmail: string;
  totalReports: number;
  reasonBreakdown: {
    FRAUDE_GOLPE: number;
    ASSEDIO_OFENSIVO: number;
    SPAM: number;
    SERVICO_ILEGAL: number;
    OUTROS: number;
  };
  reports: Array<{
    id: string;
    reporterName: string;
    reporterEmail: string;
    reason: string;
    createdAt: Date;
  }>;
}

export interface ListReportedAnnouncementsRepositoryInput {
  threshold: number;
  condominiumIds?: string[];
}

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
  status?: AnnouncementStatus;
}

export interface UpdateAnnouncementRepositoryInput {
  title?: string;
  subtitle?: string | null;
  description?: string;
  priceCents?: number | null;
  imageUrl?: string;
  categoryId?: string;
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
  findPublicById(id: string): Promise<PublicAnnouncementDTO | null>;
  listForModeration(
    condominiumId: string,
  ): Promise<ModerationAnnouncementDTO[]>;
  listReported(
    input: ListReportedAnnouncementsRepositoryInput,
  ): Promise<ReportedAnnouncementDTO[]>;
  updateStatus(id: string, status: AnnouncementStatus): Promise<Announcement>;
  update(
    id: string,
    input: UpdateAnnouncementRepositoryInput,
  ): Promise<Announcement>;
  softDeleteAllByProviderId(providerId: string, reason: string): Promise<void>;
}
