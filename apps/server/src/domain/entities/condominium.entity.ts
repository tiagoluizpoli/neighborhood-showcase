import { AuditableEntity, type AuditableProps } from '../../shared/base-entity';
import { DomainError } from '../../shared/domain-error';

export interface CondominiumContactInfo {
  website?: string;
  email?: string;
  phone?: string;
}

export type CondominiumStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export class InvalidCondominiumNameError extends DomainError {
  constructor() {
    super('Nome do condomínio deve ter pelo menos 3 caracteres.');
  }
}

export class InvalidCEPError extends DomainError {
  constructor() {
    super('CEP inválido. Deve conter 8 dígitos.');
  }
}

export class InvalidContactInfoError extends DomainError {}

export interface CondominiumProps extends AuditableProps {
  name: string;
  city: string;
  state: string;
  cep: string;
  contactInfo: CondominiumContactInfo;
  status: CondominiumStatus;
  createdBy: string;
  proofUrl?: string | null;
  deletedAt?: Date | null;
  addressId?: string | null;
  number?: string | null;
}

export class Condominium extends AuditableEntity<CondominiumProps> {
  constructor(props: CondominiumProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    Condominium.validateCondominiumName(this.props.name);
    Condominium.validateCEP(this.props.cep);
    Condominium.validateContactInfo(this.props.contactInfo);
  }

  private static validateCondominiumName(name: string): void {
    if (!name || name.trim().length < 3) {
      throw new InvalidCondominiumNameError();
    }
  }

  private static validateCEP(cep: string): void {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      throw new InvalidCEPError();
    }
  }

  private static validateContactInfo(info: CondominiumContactInfo): void {
    if (info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
      throw new InvalidContactInfoError('E-mail administrativo inválido.');
    }
    if (info.phone && info.phone.replace(/\D/g, '').length < 10) {
      throw new InvalidContactInfoError('Telefone administrativo inválido.');
    }
  }

  get name(): string {
    return this.props.name;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get cep(): string {
    return this.props.cep;
  }

  get contactInfo(): CondominiumContactInfo {
    return this.props.contactInfo;
  }

  get status(): CondominiumStatus {
    return this.props.status;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get proofUrl(): string | null | undefined {
    return this.props.proofUrl;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get addressId(): string | null | undefined {
    return this.props.addressId;
  }

  get number(): string | null | undefined {
    return this.props.number;
  }

  public approve(): void {
    this.props.status = 'APPROVED';
  }

  public reject(): void {
    this.props.status = 'REJECTED';
  }
}
