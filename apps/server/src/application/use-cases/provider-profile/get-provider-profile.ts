import type { ProviderProfile } from '../../../domain/entities/provider-profile.entity';
import type { ProviderProfileRepository } from '../../../domain/repositories/provider-profile.repository';
import { DomainError } from '../../../shared/domain-error';

export interface GetProviderProfileInput {
  providerId: string;
}

export class ProviderProfileNotFoundError extends DomainError {
  constructor() {
    super('Perfil de provedor não encontrado');
  }
}

export class GetProviderProfile {
  constructor(private readonly repo: ProviderProfileRepository) {}

  async execute(input: GetProviderProfileInput): Promise<ProviderProfile> {
    const profile = await this.repo.findByProviderId(input.providerId);

    if (!profile) {
      throw new ProviderProfileNotFoundError();
    }

    return profile;
  }
}
