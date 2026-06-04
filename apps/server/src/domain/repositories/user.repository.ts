import type { User } from '../entities/user.entity';

export interface ListProvidersRepositoryInput {
  search?: string;
  condominiumId?: string;
  city?: string;
  neighborhood?: string;
}

export interface UserRepository {
  listProviders(input: ListProvidersRepositoryInput): Promise<User[]>;
}
