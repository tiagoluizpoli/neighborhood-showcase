import type { Provider } from '../entities/provider.entity';

export interface CreateProviderInput {
  id?: string;
  ownerId: string;
}

export interface ProviderRepository {
  create(input: CreateProviderInput): Promise<Provider>;
  // Excludes soft-deleted providers.
  findById(id: string): Promise<Provider | null>;
  // Excludes soft-deleted providers.
  listByOwner(ownerId: string): Promise<Provider[]>;
  softDelete(id: string): Promise<void>;
}
