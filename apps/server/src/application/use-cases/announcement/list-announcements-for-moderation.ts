import type {
  AnnouncementRepository,
  ModerationAnnouncementDTO,
} from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';

export class ModerationAccessDeniedError extends Error {
  constructor() {
    super('Acesso negado. Você não é moderador deste condomínio.');
  }
}

export interface ListAnnouncementsForModerationInput {
  actorId: string;
  condominiumId: string;
}

export class ListAnnouncementsForModeration {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly assignmentRepo: AssignmentRepository,
  ) {}

  async execute(
    input: ListAnnouncementsForModerationInput,
  ): Promise<ModerationAnnouncementDTO[]> {
    const moderatorAssignment =
      await this.assignmentRepo.findByProviderCondoAndType(
        input.actorId,
        input.condominiumId,
        'MODERATOR',
      );

    if (!moderatorAssignment || moderatorAssignment.status !== 'APPROVED') {
      throw new ModerationAccessDeniedError();
    }

    return this.announcementRepo.listForModeration(input.condominiumId);
  }
}
