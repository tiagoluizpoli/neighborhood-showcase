import type { ProviderRepository } from '../../../domain/repositories/provider.repository';
import type { ProviderProfileRepository } from '../../../domain/repositories/provider-profile.repository';

export interface ListOwnedProvidersInput {
  ownerId: string;
}

/**
 * Read model for the "My Providers" panel page. The provider entity carries no
 * human-readable label, so each summary is enriched with the display name and
 * logo from its provider profile (null when no profile exists yet). Soft-deleted
 * providers are already excluded by `ProviderRepository.listByOwner`.
 */
export interface OwnedProviderSummary {
  id: string;
  displayName: string | null;
  logoUrl: string | null;
}

export class ListOwnedProviders {
  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly providerProfileRepository: ProviderProfileRepository,
  ) {}

  async execute(
    input: ListOwnedProvidersInput,
  ): Promise<OwnedProviderSummary[]> {
    const providers = await this.providerRepository.listByOwner(input.ownerId);

    return Promise.all(
      providers.map(async (provider) => {
        const profile = await this.providerProfileRepository.findByProviderId(
          provider.id,
        );

        return {
          id: provider.id,
          displayName: profile?.displayName ?? null,
          logoUrl: profile?.logoUrl ?? null,
        };
      }),
    );
  }
}
