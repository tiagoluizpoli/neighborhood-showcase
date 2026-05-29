import crypto from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { Announcement } from '../../../domain/entities/announcement.entity';
import { validateAnnouncement } from '../../../domain/entities/announcement.entity';
import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type {
  CreateAnnouncementInput,
  CreateAnnouncementUseCase,
} from '../../../domain/use-cases/announcement/create-announcement.use-case';

export class CreateAnnouncement implements CreateAnnouncementUseCase {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly assignmentRepo: AssignmentRepository,
  ) {}

  async execute(input: CreateAnnouncementInput): Promise<Announcement> {
    // Validate announcement details using domain entity validations
    validateAnnouncement({
      title: input.title,
      description: input.description,
      category: input.category,
      imageUrl: input.imageUrl,
      contactLinks: input.contactLinks,
    });

    // Enforce that user must have an approved assignment for the condo
    const assignment = await this.assignmentRepo.findByProviderAndCondo(
      input.providerId,
      input.condominiumId,
    );

    if (!assignment || assignment.status !== 'APPROVED') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'Você precisa ter uma associação aprovada com este condomínio para criar anúncios.',
      });
    }

    // Verified Resident Badge toggle is only allowed if user has an approved assignment
    // (which is already checked, but let's double check for verified badge toggle)
    if (input.showVerifiedBadge && assignment.status !== 'APPROVED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Selo de morador verificado está disponível apenas para moradores aprovados.',
      });
    }

    const id = crypto.randomUUID();

    return this.announcementRepo.create({
      id,
      providerId: input.providerId,
      condominiumId: input.condominiumId,
      title: input.title,
      subtitle: input.subtitle || null,
      description: input.description,
      priceCents: input.priceCents || null,
      imageUrl: input.imageUrl,
      category: input.category,
      tags: input.tags,
      contactLinks: {
        whatsapp: input.contactLinks.whatsapp || undefined,
        instagram: input.contactLinks.instagram || undefined,
        website: input.contactLinks.website || undefined,
      },
      showVerifiedBadge: input.showVerifiedBadge,
      status: 'DRAFT',
    });
  }
}
