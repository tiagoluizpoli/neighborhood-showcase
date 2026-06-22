import type { Announcement } from '../../../domain/entities/announcement.entity';
import type { AnnouncementContactSettings } from '../../../domain/entities/contact';
import {
  type AnnouncementCta,
  validateCta,
} from '../../../domain/entities/cta';
import { normalizePriceCents } from '../../../domain/entities/money';
import { normalizeTags } from '../../../domain/entities/tags';
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
  contact: AnnouncementContactSettings;
  cta: AnnouncementCta;
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

    // The update path persists directly through the repository rather than the
    // entity constructor, so enforce the bounded CTA contract explicitly here.
    validateCta(input.cta);

    if (input.showVerifiedBadge) {
      if (!announcement.providerAssignmentId) {
        throw new VerifiedBadgeEligibilityError();
      }

      const assignment = await this.assignmentRepo.findById(
        announcement.providerAssignmentId,
      );

      if (assignment?.status !== 'APPROVED' || assignment.type !== 'RESIDENT') {
        throw new VerifiedBadgeEligibilityError();
      }
    }

    return this.announcementRepo.update(input.announcementId, {
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      priceCents: normalizePriceCents(input.priceCents),
      imageUrl: input.imageUrl,
      categoryId: input.categoryId,
      tags: normalizeTags(input.tags),
      contact: input.contact,
      cta: input.cta,
      showVerifiedBadge: input.showVerifiedBadge,
      status:
        announcement.status === 'SUSPENDED' ? 'ACTIVE' : announcement.status,
      flaggedForReview: true,
      suspensionReason: null,
    });
  }
}
