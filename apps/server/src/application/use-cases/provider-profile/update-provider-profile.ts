import {
  InvalidPrimaryPhoneError,
  isValidPrimaryPhone,
  type ProviderContactMetadata,
} from '../../../domain/entities/contact';
import { ProviderCallRequiresPhoneError } from '../../../domain/entities/provider-profile.entity';
import type { ProviderProfileRepository } from '../../../domain/repositories/provider-profile.repository';
import { DomainError } from '../../../shared/domain-error';

export interface UpdateProviderProfileInput {
  providerId: string;
  displayName?: string;
  companyName?: string | null;
  tradeName?: string | null;
  logoUrl?: string | null;
  logoOriginalUrl?: string | null;
  bannerUrl?: string | null;
  bannerOriginalUrl?: string | null;
  publicDescription?: string | null;
  primaryPhone?: string;
  callEnabled?: boolean;
  contactMetadata?: ProviderContactMetadata;
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

    const contactDefaults = {
      primaryPhone:
        input.primaryPhone !== undefined
          ? input.primaryPhone.trim()
          : (existing?.contactDefaults.primaryPhone ?? ''),
      callEnabled:
        input.callEnabled !== undefined
          ? input.callEnabled
          : (existing?.contactDefaults.callEnabled ?? false),
    };

    const contactMetadata =
      input.contactMetadata !== undefined
        ? { ...(existing?.contactMetadata ?? {}), ...input.contactMetadata }
        : (existing?.contactMetadata ?? {});

    const hasPhone = contactDefaults.primaryPhone.length > 0;
    if (hasPhone && !isValidPrimaryPhone(contactDefaults.primaryPhone)) {
      throw new InvalidPrimaryPhoneError();
    }
    if (contactDefaults.callEnabled && !hasPhone) {
      throw new ProviderCallRequiresPhoneError();
    }

    await this.repo.upsert({
      providerId: input.providerId,
      displayName:
        input.displayName?.trim() ?? existing?.displayName ?? 'Provider',
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
      logoOriginalUrl:
        input.logoOriginalUrl !== undefined
          ? input.logoOriginalUrl
          : (existing?.logoOriginalUrl ?? null),
      bannerUrl:
        input.bannerUrl !== undefined
          ? input.bannerUrl
          : (existing?.bannerUrl ?? null),
      bannerOriginalUrl:
        input.bannerOriginalUrl !== undefined
          ? input.bannerOriginalUrl
          : (existing?.bannerOriginalUrl ?? null),
      publicDescription:
        input.publicDescription !== undefined
          ? input.publicDescription
          : (existing?.publicDescription ?? null),
      contactDefaults,
      contactMetadata,
      isProviderVisible:
        input.isProviderVisible !== undefined
          ? input.isProviderVisible
          : (existing?.isProviderVisible ?? true),
    });
  }
}
