import type { User } from '../../../domain/entities/user.entity';
import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface ListUsersInput {
  search?: string;
  role?: 'USER' | 'SYSTEM_MANAGER' | 'ADMINISTRATOR';
  status?: 'ACTIVE' | 'BANNED';
}

export class ListUsers {
  constructor(private userRepository: UserRepository) {}

  async execute(input: ListUsersInput): Promise<User[]> {
    return this.userRepository.listUsers({
      search: input.search,
      role: input.role,
      status: input.status,
    });
  }
}
