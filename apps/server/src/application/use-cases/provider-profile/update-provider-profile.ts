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

    const existing = await this.repo.findByProviderId(input.providerId);

    await this.repo.upsert({
      providerId: input.providerId,
      displayName:
        input.displayName?.trim() ?? existing?.displayName ?? 'Provider',
      avatarUrl:
        input.avatarUrl !== undefined
          ? input.avatarUrl
          : (existing?.avatarUrl ?? null),
      companyName:
        input.companyName !== undefined
          ? input.companyName
          : (existing?.companyName ?? null),
      tradeName:
        input.tradeName !== undefined
          ? input.tradeName
          : (existing?.tradeName ?? null),
      logoUrl:
        input.logoUrl !== undefined
          ? input.logoUrl
          : (existing?.logoUrl ?? null),
      bannerUrl:
        input.bannerUrl !== undefined
          ? input.bannerUrl
          : (existing?.bannerUrl ?? null),
      publicDescription:
        input.publicDescription !== undefined
          ? input.publicDescription
          : (existing?.publicDescription ?? null),
      socialLinks:
        input.socialLinks !== undefined
          ? { ...(existing?.socialLinks ?? {}), ...input.socialLinks }
          : (existing?.socialLinks ?? {}),
      isProviderVisible:
        input.isProviderVisible !== undefined
          ? input.isProviderVisible
          : (existing?.isProviderVisible ?? true),
    });
  }
}
