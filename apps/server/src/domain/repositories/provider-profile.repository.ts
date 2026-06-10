import type { ProviderProfile } from '../entities/provider-profile.entity';

export interface ProviderProfileRepository {
  findByProviderId(providerId: string): Promise<ProviderProfile | null>;
  upsert(input: {
    providerId: string;
    displayName: string;
    avatarUrl?: string | null;
    companyName?: string | null;
    tradeName?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    publicDescription?: string | null;
    socialLinks?: {
      whatsapp?: string;
      phone?: string;
      email?: string;
      instagram?: string;
      tiktok?: string;
      facebook?: string;
      website?: string;
    };
    isProviderVisible?: boolean;
  }): Promise<ProviderProfile>;
  delete(providerId: string): Promise<void>;
}
