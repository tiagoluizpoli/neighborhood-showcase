import {
  ListOwnedProviders,
  type ListOwnedProvidersInput,
  type OwnedProviderSummary,
} from '../../application/use-cases/provider/list-owned-providers';
import { GetProviderProfile } from '../../application/use-cases/provider-profile/get-provider-profile';
import {
  UpdateProviderProfile,
  type UpdateProviderProfileInput,
} from '../../application/use-cases/provider-profile/update-provider-profile';
import type { ProviderProfile } from '../../domain/entities/provider-profile.entity';
import { ProviderProfileRepositoryImpl } from '../../infrastructure/db/provider-profile-repository';
import { DrizzleProviderRepository } from '../../infrastructure/db/provider-repository';

export interface ProviderProfileRouterDependencies {
  getProviderProfileUseCase: {
    execute(input: { providerId: string }): Promise<ProviderProfile>;
  };
  updateProviderProfileUseCase: {
    execute(input: UpdateProviderProfileInput): Promise<void>;
  };
  listOwnedProvidersUseCase: {
    execute(input: ListOwnedProvidersInput): Promise<OwnedProviderSummary[]>;
  };
}

export function createProviderProfileRouterDependencies(): ProviderProfileRouterDependencies {
  const repo = new ProviderProfileRepositoryImpl();
  const providerRepo = new DrizzleProviderRepository();

  return {
    getProviderProfileUseCase: new GetProviderProfile(repo),
    updateProviderProfileUseCase: new UpdateProviderProfile(repo),
    listOwnedProvidersUseCase: new ListOwnedProviders(providerRepo, repo),
  };
}
