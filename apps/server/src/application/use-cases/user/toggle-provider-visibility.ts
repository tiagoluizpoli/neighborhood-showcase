import type { UserRepository } from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class UserNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado.');
  }
}

export interface ToggleProviderVisibilityInput {
  targetUserId: string;
}

export class ToggleProviderVisibility {
  constructor(private userRepository: UserRepository) {}

  async execute(
    input: ToggleProviderVisibilityInput,
  ): Promise<{ isProviderVisible: boolean }> {
    const target = await this.userRepository.findById(input.targetUserId);
    if (!target) {
      throw new UserNotFoundError();
    }

    const newVisibility = !target.isProviderVisible;

    await this.userRepository.updateProviderVisibility(
      input.targetUserId,
      newVisibility,
    );

    return { isProviderVisible: newVisibility };
  }
}
