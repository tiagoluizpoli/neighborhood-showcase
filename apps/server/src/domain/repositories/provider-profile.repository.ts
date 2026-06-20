import type {
  ProviderContactDefaults,
  ProviderContactMetadata,
} from '../entities/contact';
import type { ProviderProfile } from '../entities/provider-profile.entity';

export interface UpsertProviderProfileInput {
  providerId: string;
  displayName: string;
  avatarUrl?: string | null;
  companyName?: string | null;
  tradeName?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  publicDescription?: string | null;
  contactDefaults: ProviderContactDefaults;
  contactMetadata: ProviderContactMetadata;
  isProviderVisible?: boolean;
}

export interface ProviderProfileRepository {
  findByProviderId(providerId: string): Promise<ProviderProfile | null>;
  upsert(input: UpsertProviderProfileInput): Promise<ProviderProfile>;
  delete(providerId: string): Promise<void>;
}
