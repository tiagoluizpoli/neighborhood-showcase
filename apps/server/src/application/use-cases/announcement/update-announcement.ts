import type { Announcement } from '../../../domain/entities/announcement.entity';
import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import { DomainError } from '../../../shared/domain-error';

export class AnnouncementUpdateAccessDeniedError extends DomainError {
  constructor() {
    super('Acesso negado. Você não é o proprietário deste anúncio.');
  }
}

export class VerifiedBadgeEligibilityError extends DomainError {
  constructor() {
    super(
      'Selo de morador verificado está disponível apenas para moradores aprovados.',
    );
  }
}

export interface UpdateAnnouncementInput {
  actorId: string;
  announcementId: string;
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

export class UpdateAnnouncement {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly assignmentRepo: AssignmentRepository,
  ) {}

  async execute(input: UpdateAnnouncementInput): Promise<Announcement> {
    const announcement = await this.announcementRepo.findById(
      input.announcementId,
    );

    if (!announcement || announcement.providerId !== input.actorId) {
      throw new AnnouncementUpdateAccessDeniedError();
    }

    if (input.showVerifiedBadge) {
      if (!announcement.providerLocationId) {
        throw new VerifiedBadgeEligibilityError();
      }

      const assignment = await this.assignmentRepo.findById(
        announcement.providerLocationId,
      );

      if (
        !assignment ||
        assignment.status !== 'APPROVED' ||
        assignment.type !== 'RESIDENT'
      ) {
        throw new VerifiedBadgeEligibilityError();
      }
    }

    return this.announcementRepo.update(input.announcementId, {
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      priceCents: input.priceCents,
      imageUrl: input.imageUrl,
      categoryId: input.categoryId,
      tags: input.tags,
      contactLinks: input.contactLinks,
      showVerifiedBadge: input.showVerifiedBadge,
      status:
        announcement.status === 'SUSPENDED' ? 'ACTIVE' : announcement.status,
      flaggedForReview: true,
      suspensionReason: null,
    });
  }
}
