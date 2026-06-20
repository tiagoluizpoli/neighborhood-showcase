import { GetProviderProfile } from '../../application/use-cases/provider-profile/get-provider-profile';
import {
  UpdateProviderProfile,
  type UpdateProviderProfileInput,
} from '../../application/use-cases/provider-profile/update-provider-profile';
import type { ProviderProfile } from '../../domain/entities/provider-profile.entity';
import { ProviderProfileRepositoryImpl } from '../../infrastructure/db/provider-profile-repository';

export interface ProviderProfileRouterDependencies {
  getProviderProfileUseCase: {
    execute(input: { providerId: string }): Promise<ProviderProfile>;
  };
  updateProviderProfileUseCase: {
    execute(input: UpdateProviderProfileInput): Promise<void>;
  };
}

export function createProviderProfileRouterDependencies(): ProviderProfileRouterDependencies {
  const repo = new ProviderProfileRepositoryImpl();

  return {
    getProviderProfileUseCase: new GetProviderProfile(repo),
    updateProviderProfileUseCase: new UpdateProviderProfile(repo),
  };
}
