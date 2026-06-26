import type { ProviderRepository } from '../../../domain/repositories/provider.repository';
import type { ProviderProfileRepository } from '../../../domain/repositories/provider-profile.repository';

export interface CreateProviderInput {
  ownerId: string;
  displayName: string;
}

export interface CreateProviderResult {
  providerId: string;
}

/**
 * Mints a new first-class `provider` owned by the caller and seeds a minimal,
 * non-public default profile for it.
 *
 * The seeded profile matters: every `$providerId` panel read goes through
 * `providerProfile.get`, which throws `NOT_FOUND` for a profile-less provider.
 * Creating a default profile (hidden until the owner configures it) lets a
 * freshly-created provider land in its `$providerId` context instead of being
 * bounced by the ownership gate. The owner names/edits it later in the
 * configuration page.
 */
export class CreateProvider {
  constructor(
    private readonly providerRepo: ProviderRepository,
    private readonly profileRepo: ProviderProfileRepository,
  ) {}

  async execute(input: CreateProviderInput): Promise<CreateProviderResult> {
    const provider = await this.providerRepo.create({ ownerId: input.ownerId });

    await this.profileRepo.upsert({
      providerId: provider.id,
      displayName: input.displayName.trim(),
      contactDefaults: { primaryPhone: '', callEnabled: false },
      contactMetadata: {},
      isProviderVisible: false,
    });

    return { providerId: provider.id };
  }
}
