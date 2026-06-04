import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class UserNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado.');
  }
}

export interface PromoteToSystemManagerInput {
  actorId: string;
  targetUserId: string;
}

export class PromoteToSystemManager {
  constructor(private userRepository: UserRepository) {}

  async execute(input: PromoteToSystemManagerInput): Promise<void> {
    const target = await this.userRepository.findById(input.targetUserId);
    if (!target) {
      throw new UserNotFoundError();
    }

    const previousRole = target.role;

    await this.userRepository.updateRole(input.targetUserId, 'SYSTEM_MANAGER');

    await this.userRepository.logRoleChange({
      actorId: input.actorId,
      targetUserId: input.targetUserId,
      previousRole,
      newRole: 'SYSTEM_MANAGER',
    });
  }
}
