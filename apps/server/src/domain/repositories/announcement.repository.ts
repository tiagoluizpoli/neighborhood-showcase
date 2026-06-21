import type {
  Announcement,
  AnnouncementStatus,
} from '../entities/announcement.entity';
import type { AnnouncementContactSettings } from '../entities/contact';
import type { AnnouncementCta } from '../entities/cta';

export interface ProviderAnnouncementDTO {
  id: string;
  providerId: string;
  condominiumId: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  categoryId: string;
  category: string;
  tags: string[];
  contact: AnnouncementContactSettings;
  cta: AnnouncementCta;
  // Transitional flat view derived from `contact`; kept as the CTA fallback path.
  contactLinks: Record<string, string | undefined>;
  showVerifiedBadge: boolean;
  status: string;
  createdAt: Date;
  condoName: string | null;
  condoCity: string;
  condoState: string;
  providerName: string;
  providerAvatarUrl: string | null;
}

export interface PublicAnnouncementDTO {
  id: string;
  providerId: string;
  condominiumId: string | null;
  providerAssignmentId: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  categoryId: string;
  tags: string[];
  contact: AnnouncementContactSettings;
  cta: AnnouncementCta;
  // Transitional flat view derived from `contact`; kept as the CTA fallback path.
  contactLinks: Record<string, string | undefined>;
  showVerifiedBadge: boolean;
  status: string;
  createdAt: Date;
  category: string;
  condoName: string | null;
  condoCity: string;
  condoState: string;
  condoNeighborhood?: string | null;
  latitude?: string | null;
  longitude?: string | null;
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
  contact: AnnouncementContactSettings;
  // Transitional flat view derived from `contact`; removed in T-17-04.
  contactLinks: Record<string, string | undefined>;
  showVerifiedBadge: boolean;
  flaggedForReview: boolean;
  status: string;
  suspensionReason: string | null;
  createdAt: Date;
  providerName: string;
}

export interface DashboardAnnouncementDTO {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  category: string;
  categoryId: string;
  tags: string[];
  contact: AnnouncementContactSettings;
  cta: AnnouncementCta;
  // Transitional flat view derived from `contact`; kept as the CTA fallback path.
  contactLinks: Record<string, string | undefined>;
  showVerifiedBadge: boolean;
  flaggedForReview: boolean;
  status: string;
  paidAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  suspensionReason: string | null;
  condoName: string;
  providerAssignmentId: string | null;
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
  providerAssignmentId?: string | null;
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
  contact?: AnnouncementContactSettings;
  cta?: AnnouncementCta;
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
  findActiveByProviderId(
    providerId: string,
    providerName: string,
    providerAvatarUrl: string | null,
  ): Promise<ProviderAnnouncementDTO[]>;
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
  suspend(id: string, reason: string): Promise<void>;
  reinstate(id: string): Promise<void>;
  softDeleteAllByProviderId(providerId: string, reason: string): Promise<void>;
  findIdsByProviderId(providerId: string): Promise<string[]>;
  findDashboardByProviderId(
    providerId: string,
  ): Promise<DashboardAnnouncementDTO[]>;
  findPublic(
    input: ListPublicAnnouncementsInput,
  ): Promise<PublicAnnouncementDTO[]>;
  countPendingByCondo(condominiumId: string): Promise<number>;
}

export interface ListPublicAnnouncementsInput {
  latitude?: number;
  longitude?: number;
  condominiumId?: string;
  categoryId?: string;
  search?: string;
  verifiedOnly?: boolean;
  userCondoId?: string;
  radiusKm?: number;
  city?: string;
  neighborhood?: string;
  ipCity?: string;
  ipState?: string;
}
