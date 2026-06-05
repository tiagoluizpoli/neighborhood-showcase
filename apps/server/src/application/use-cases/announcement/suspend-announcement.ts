import type { AnnouncementRepository } from '../../../domain/repositories/announcement.repository';
import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class SuspendAnnouncementNotFoundError extends DomainError {
  constructor() {
    super('Anúncio não encontrado.');
  }
}

export class SuspendAnnouncementNoBoundError extends DomainError {
  constructor() {
    super('Anúncio não está associado a um condomínio.');
  }
}

export class SuspendAnnouncementActorNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado.');
  }
}

export class SuspendAnnouncementAccessDeniedError extends DomainError {
  constructor() {
    super('Acesso negado. Você não é moderador deste condomínio.');
  }
}

export interface SuspendAnnouncementInput {
  announcementId: string;
  moderatorId: string;
  reason: string;
}

export class SuspendAnnouncement {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly assignmentRepo: AssignmentRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(input: SuspendAnnouncementInput): Promise<void> {
    const { announcementId, moderatorId, reason } = input;

    const ann = await this.announcementRepo.findById(announcementId);
    if (!ann) {
      throw new SuspendAnnouncementNotFoundError();
    }

    if (!ann.condominiumId) {
      throw new SuspendAnnouncementNoBoundError();
    }

    const actor = await this.userRepo.findById(moderatorId);
    if (!actor) {
      throw new SuspendAnnouncementActorNotFoundError();
    }

    if (actor.role !== 'SYSTEM_MANAGER' && actor.role !== 'ADMINISTRATOR') {
      const assignment = await this.assignmentRepo.findByProviderCondoAndType(
        moderatorId,
        ann.condominiumId,
        'MODERATOR',
      );

      if (!assignment || assignment.status !== 'APPROVED') {
        throw new SuspendAnnouncementAccessDeniedError();
      }
    }

    await this.announcementRepo.suspend(announcementId, reason);
  }
}
