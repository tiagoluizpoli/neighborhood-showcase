import crypto from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { Announcement } from '../../../domain/entities/announcement.entity';
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
    // Enforce that user must have an approved location context
    const assignment = await this.assignmentRepo.findById(
      input.providerAssignmentId,
    );

    if (
      !assignment ||
      assignment.providerId !== input.providerId ||
      assignment.status !== 'APPROVED'
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'Você precisa ter uma localização aprovada para criar anúncios.',
      });
    }

    // Validate announcement details using domain entity constructor
    new Announcement({
      providerId: input.providerId,
      condominiumId: assignment.condominiumId,
      providerAssignmentId: assignment.id,
      title: input.title,
      subtitle: input.subtitle || null,
      description: input.description,
      priceCents: input.priceCents || null,
      imageUrl: input.imageUrl,
      categoryId: input.categoryId,
      tags: input.tags,
      contact: input.contact,
      cta: input.cta,
      showVerifiedBadge: input.showVerifiedBadge,
      flaggedForReview: false,
      status: 'DRAFT',
    });

    // Verified Resident Badge toggle is only allowed if user has an approved Resident assignment
    if (
      input.showVerifiedBadge &&
      (assignment.status !== 'APPROVED' || assignment.type !== 'RESIDENT')
    ) {
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
      condominiumId: assignment.condominiumId,
      providerAssignmentId: assignment.id,
      title: input.title,
      subtitle: input.subtitle || null,
      description: input.description,
      priceCents: input.priceCents || null,
      imageUrl: input.imageUrl,
      categoryId: input.categoryId,
      tags: input.tags,
      contact: input.contact,
      cta: input.cta,
      showVerifiedBadge: input.showVerifiedBadge,
      status: 'DRAFT',
    });
  }
}
