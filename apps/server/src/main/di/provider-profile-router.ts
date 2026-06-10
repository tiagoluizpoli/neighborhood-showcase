import { GetProviderProfile } from '../../application/use-cases/provider-profile/get-provider-profile';
import {
  UpdateProviderProfile,
  type UpdateProviderProfileInput,
} from '../../application/use-cases/provider-profile/update-provider-profile';
import { ProviderProfileRepositoryImpl } from '../../infrastructure/db/provider-profile-repository';

export interface ProviderProfileRouterDependencies {
  getProviderProfileUseCase: {
    execute(input: { providerId: string }): Promise<{
      id: string;
      displayName: string;
      avatarUrl: string | null | undefined;
      companyName: string | null | undefined;
      tradeName: string | null | undefined;
      logoUrl: string | null | undefined;
      bannerUrl: string | null | undefined;
      publicDescription: string | null | undefined;
      socialLinks: {
        whatsapp?: string;
        phone?: string;
        email?: string;
        instagram?: string;
        tiktok?: string;
        facebook?: string;
        website?: string;
      };
      isProviderVisible: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
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
