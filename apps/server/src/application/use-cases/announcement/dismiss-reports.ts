import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { ReportRepository } from '../../../domain/repositories/report.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class DismissReportsNotFoundError extends DomainError {
  constructor() {
    super('Anúncio não encontrado.');
  }
}

export class DismissReportsActorNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado.');
  }
}

export class DismissReportsNoBoundError extends DomainError {
  constructor() {
    super('Acesso negado. Este anúncio não pertence a um condomínio.');
  }
}

export class DismissReportsAccessDeniedError extends DomainError {
  constructor() {
    super('Acesso negado. Você não é moderador deste condomínio.');
  }
}

export interface DismissReportsInput {
  announcementId: string;
  moderatorId: string;
}

export class DismissReports {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly assignmentRepo: AssignmentRepository,
    private readonly reportRepo: ReportRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(input: DismissReportsInput): Promise<void> {
    const { announcementId, moderatorId } = input;

    const ann = await this.announcementRepo.findById(announcementId);
    if (!ann || ann.deletedAt != null) {
      throw new DismissReportsNotFoundError();
    }

    const actor = await this.userRepo.findById(moderatorId);
    if (!actor) {
      throw new DismissReportsActorNotFoundError();
    }

    if (actor.role !== 'SYSTEM_MANAGER' && actor.role !== 'ADMINISTRATOR') {
      if (!ann.condominiumId) {
        throw new DismissReportsNoBoundError();
      }

      const assignment = await this.assignmentRepo.findByProviderCondoAndType(
        moderatorId,
        ann.condominiumId,
        'MODERATOR',
      );

      if (assignment?.status !== 'APPROVED') {
        throw new DismissReportsAccessDeniedError();
      }
    }

    await this.reportRepo.deleteByAnnouncementId(announcementId);
  }
}
