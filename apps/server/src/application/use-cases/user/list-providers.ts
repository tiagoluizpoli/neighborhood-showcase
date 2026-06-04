import type { User } from '../../../domain/entities/user.entity';
import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface ListProvidersInput {
  search?: string;
  condominiumId?: string;
  city?: string;
  neighborhood?: string;
}

export class ListProviders {
  constructor(private userRepository: UserRepository) {}

  async execute(input: ListProvidersInput): Promise<User[]> {
    return this.userRepository.listProviders({
      search: input.search,
      condominiumId: input.condominiumId,
      city: input.city,
      neighborhood: input.neighborhood,
    });
  }
}
