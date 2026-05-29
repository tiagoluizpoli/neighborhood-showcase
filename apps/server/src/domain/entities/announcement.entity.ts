import { TRPCError } from '@trpc/server';

export type AnnouncementStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'SUSPENDED';

export interface Announcement {
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
  status: AnnouncementStatus;
  paidAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  deletedAt?: Date | null;
}

export function validateAnnouncement(input: {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  contactLinks: {
    whatsapp?: string;
    instagram?: string;
    website?: string;
  };
}): void {
  if (!input.title || input.title.trim().length < 3) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'O título do anúncio deve ter pelo menos 3 caracteres.',
    });
  }
  if (input.title.length > 100) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'O título do anúncio não pode exceder 100 caracteres.',
    });
  }
  if (!input.description || input.description.trim().length < 10) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A descrição do anúncio deve ter pelo menos 10 caracteres.',
    });
  }
  if (input.description.length > 2000) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A descrição do anúncio não pode exceder 2000 caracteres.',
    });
  }
  if (!input.category || input.category.trim().length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A categoria do anúncio é obrigatória.',
    });
  }
  if (!input.imageUrl || input.imageUrl.trim().length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A imagem de capa do anúncio é obrigatória.',
    });
  }

  const { whatsapp, instagram, website } = input.contactLinks;
  if (!whatsapp?.trim() && !instagram?.trim() && !website?.trim()) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Forneça pelo menos um meio de contato (WhatsApp, Instagram ou Website).',
    });
  }
}
