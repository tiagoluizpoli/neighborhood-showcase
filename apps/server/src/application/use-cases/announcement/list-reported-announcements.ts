import type {
  AnnouncementRepository,
  ReportedAnnouncementDTO,
} from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class ReportQueueActorNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado.');
  }
}

export class ReportQueueAccessDeniedError extends DomainError {
  constructor() {
    super('Acesso negado. Você não tem permissões de moderador.');
  }
}

export interface ListReportedAnnouncementsInput {
  actorId: string;
  threshold?: number;
}

export class ListReportedAnnouncements {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly assignmentRepo: AssignmentRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(
    input: ListReportedAnnouncementsInput,
  ): Promise<ReportedAnnouncementDTO[]> {
    const actor = await this.userRepo.findById(input.actorId);

    if (!actor) {
      throw new ReportQueueActorNotFoundError();
    }

    if (actor.role === 'SYSTEM_MANAGER' || actor.role === 'ADMINISTRATOR') {
      return this.announcementRepo.listReported({
        threshold: input.threshold ?? 5,
      });
    }

    const assignments = await this.assignmentRepo.findByProviderId(
      input.actorId,
    );
    const moderatedCondominiumIds = assignments
      .filter(
        (assignment) =>
          assignment.type === 'MODERATOR' &&
          assignment.status === 'APPROVED' &&
          assignment.condominiumId !== null,
      )
      .map((assignment) => assignment.condominiumId)
      .filter(
        (condominiumId): condominiumId is string => condominiumId !== null,
      );

    if (moderatedCondominiumIds.length === 0) {
      throw new ReportQueueAccessDeniedError();
    }

    return this.announcementRepo.listReported({
      threshold: input.threshold ?? 5,
      condominiumIds: moderatedCondominiumIds,
    });
  }
}
