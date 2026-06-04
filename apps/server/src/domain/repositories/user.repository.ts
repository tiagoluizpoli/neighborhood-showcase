import type { User } from '../entities/user.entity';

export interface ListProvidersRepositoryInput {
  search?: string;
  condominiumId?: string;
  city?: string;
  neighborhood?: string;
}

export interface ListUsersRepositoryInput {
  search?: string;
  role?: 'PROVIDER' | 'SYSTEM_MANAGER';
  status?: 'ACTIVE' | 'BANNED';
}

export interface UserRepository {
  listProviders(input: ListProvidersRepositoryInput): Promise<User[]>;
  listUsers(input: ListUsersRepositoryInput): Promise<User[]>;
}
