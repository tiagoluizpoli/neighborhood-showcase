import type {
  UserProfileDTO,
  UserRepository,
} from '../../../domain/repositories/user.repository';
import { DomainError } from '../../../shared/domain-error';

export class UserProfileNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado');
  }
}

export interface GetUserProfileInput {
  userId: string;
}

export class GetUserProfile {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: GetUserProfileInput): Promise<UserProfileDTO> {
    const profile = await this.userRepo.findProfileById(input.userId);

    if (!profile) {
      throw new UserProfileNotFoundError();
    }

    return profile;
  }
}
