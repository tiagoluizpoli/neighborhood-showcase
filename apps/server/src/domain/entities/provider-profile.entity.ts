import { AuditableEntity, type AuditableProps } from '../../shared/base-entity';
import { DomainError } from '../../shared/domain-error';
import {
  InvalidPrimaryPhoneError,
  isValidPrimaryPhone,
  type ProviderContactDefaults,
  type ProviderContactMetadata,
} from './contact';

export class ProviderProfileNotFoundError extends DomainError {
  constructor() {
    super('Perfil de provedor não encontrado');
  }
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

export class ProviderCallRequiresPhoneError extends DomainError {
  constructor() {
    super(
      'A chamada direta exige um número de telefone principal configurado.',
    );
  }
}

export interface ProviderProfileProps extends AuditableProps {
  displayName: string;
  avatarUrl?: string | null;
  companyName?: string | null;
  tradeName?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  publicDescription?: string | null;
  contactDefaults: ProviderContactDefaults;
  contactMetadata: ProviderContactMetadata;
  isProviderVisible: boolean;
}

export class ProviderProfile extends AuditableEntity<ProviderProfileProps> {
  constructor(props: ProviderProfileProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    ProviderProfile.validateDisplayName(this.props.displayName);
    ProviderProfile.validatePublicDescription(this.props.publicDescription);
    ProviderProfile.validateContactDefaults(this.props.contactDefaults);
  }

  private static validateDisplayName(displayName: string): void {
    if (!displayName || displayName.trim().length < 3) {
      throw new InvalidProviderDisplayNameError();
    }
  }

  private static validatePublicDescription(
    description: string | null | undefined,
  ): void {
    if (description && description.length > 500) {
      throw new InvalidProviderPublicDescriptionError();
    }
  }

  private static validateContactDefaults(
    defaults: ProviderContactDefaults,
  ): void {
    const hasPhone = defaults.primaryPhone.trim().length > 0;
    if (hasPhone && !isValidPrimaryPhone(defaults.primaryPhone)) {
      throw new InvalidPrimaryPhoneError();
    }
    if (defaults.callEnabled && !hasPhone) {
      throw new ProviderCallRequiresPhoneError();
    }
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get avatarUrl(): string | null | undefined {
    return this.props.avatarUrl;
  }

  get companyName(): string | null | undefined {
    return this.props.companyName;
  }

  get tradeName(): string | null | undefined {
    return this.props.tradeName;
  }

  get logoUrl(): string | null | undefined {
    return this.props.logoUrl;
  }

  get bannerUrl(): string | null | undefined {
    return this.props.bannerUrl;
  }

  get publicDescription(): string | null | undefined {
    return this.props.publicDescription;
  }

  get contactDefaults(): ProviderContactDefaults {
    return this.props.contactDefaults;
  }

  get contactMetadata(): ProviderContactMetadata {
    return this.props.contactMetadata;
  }

  get isProviderVisible(): boolean {
    return this.props.isProviderVisible;
  }
}
