import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface DeleteUserAccountInput {
  userId: string;
}

export class DeleteUserAccount {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: DeleteUserAccountInput): Promise<void> {
    await this.userRepo.deleteAccountById(input.userId);
  }
}
