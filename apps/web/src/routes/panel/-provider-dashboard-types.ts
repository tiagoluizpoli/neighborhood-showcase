import type { AnnouncementCtaData } from './provider/-announcement-cta-section';

export interface ProviderDashboardAnnouncementItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number | null;
  imageUrl: string;
  category: string;
  categoryId: string;
  tags: string[];
  contact: {
    mode: 'inherit' | 'custom';
    custom: {
      primaryPhone: string;
      callEnabled: boolean;
    } | null;
  };
  cta: AnnouncementCtaData;
  contactLinks: {
    whatsapp?: string;
    phone?: string;
    instagram?: string;
    website?: string;
  };
  showVerifiedBadge: boolean;
  flaggedForReview: boolean;
  status: 'DRAFT' | 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  suspensionReason: string | null;
  condoName: string;
  providerAssignmentId: string | null;
}
