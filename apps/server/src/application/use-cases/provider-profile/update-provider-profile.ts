import type { ProviderProfileRepository } from '../../../domain/repositories/provider-profile.repository';
import { DomainError } from '../../../shared/domain-error';

export interface UpdateProviderProfileInput {
  providerId: string;
  displayName?: string;
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
}

export class InvalidProviderDisplayNameError extends DomainError {
  constructor() {
    super('Nome de exibição do provedor deve ter pelo menos 3 caracteres.');
  }
}

export class InvalidProviderPublicDescriptionError extends DomainError {
  constructor() {
    super('Descrição pública do provedor não pode exceder 500 caracteres.');
  }
}

export class UpdateProviderProfile {
  constructor(private readonly repo: ProviderProfileRepository) {}

  async execute(input: UpdateProviderProfileInput): Promise<void> {
    if (input.displayName !== undefined) {
      const trimmed = input.displayName.trim();
      if (trimmed.length === 0) {
        throw new InvalidProviderDisplayNameError();
      }
      if (trimmed.length < 3) {
        throw new InvalidProviderDisplayNameError();
      }
    }

    if (
      input.publicDescription !== undefined &&
      input.publicDescription !== null
    ) {
      if (input.publicDescription.length > 500) {
        throw new InvalidProviderPublicDescriptionError();
      }
    }

    await this.repo.upsert({
      providerId: input.providerId,
      displayName: input.displayName?.trim() ?? 'Provider',
      avatarUrl: input.avatarUrl,
      companyName: input.companyName,
      tradeName: input.tradeName,
      logoUrl: input.logoUrl,
      bannerUrl: input.bannerUrl,
      publicDescription: input.publicDescription,
      socialLinks: input.socialLinks,
      isProviderVisible: input.isProviderVisible,
    });
  }
}
