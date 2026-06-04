import type { AssignmentRepository } from '../../../domain/repositories/assignment.repository';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class UserNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado.');
  }
}

export class CondominiumNotFoundError extends DomainError {
  constructor() {
    super('Condomínio não encontrado.');
  }
}

export interface AssignModeratorInput {
  actorId: string;
  targetUserId: string;
  condominiumId: string;
}

export class AssignModerator {
  constructor(
    private userRepository: UserRepository,
    private condoRepository: CondominiumRepository,
    private assignmentRepository: AssignmentRepository,
  ) {}

  async execute(input: AssignModeratorInput): Promise<void> {
    const target = await this.userRepository.findById(input.targetUserId);
    if (!target) {
      throw new UserNotFoundError();
    }

    const condo = await this.condoRepository.findById(input.condominiumId);
    if (!condo) {
      throw new CondominiumNotFoundError();
    }

    const existing = await this.assignmentRepository.findByProviderCondoAndType(
      input.targetUserId,
      input.condominiumId,
      'MODERATOR',
    );

    if (!existing) {
      await this.assignmentRepository.create({
        id: crypto.randomUUID(),
        providerId: input.targetUserId,
        condominiumId: input.condominiumId,
        type: 'MODERATOR',
        status: 'APPROVED',
        unitInfo: '',
      });
    } else {
      await this.assignmentRepository.updateStatus(existing.id, 'APPROVED');
    }

    await this.userRepository.logRoleChange({
      actorId: input.actorId,
      targetUserId: input.targetUserId,
      previousRole: target.role,
      newRole: 'MODERATOR',
      condominiumId: input.condominiumId,
    });
  }
}
