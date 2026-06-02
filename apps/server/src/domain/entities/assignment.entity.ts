import { AuditableEntity, type AuditableProps } from '../../shared/base-entity';
import { DomainError } from '../../shared/domain-error';

export type AssignmentType = 'RESIDENT' | 'MODERATOR' | 'EXTERNAL';
export type AssignmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class InvalidUnitInfoError extends DomainError {}

export interface AssignmentProps extends AuditableProps {
  providerId: string;
  condominiumId: string | null;
  addressId?: string | null;
  number?: string | null;
  type: AssignmentType;
  status: AssignmentStatus;
  unitInfo?: string | null;
  proofOfResidency?: string | null;
}

export class Assignment extends AuditableEntity<AssignmentProps> {
  constructor(props: AssignmentProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    if (this.props.type === 'RESIDENT') {
      Assignment.validateUnitInfo(this.props.unitInfo);
    }
  }

  private static validateUnitInfo(unitInfo?: string | null): void {
    if (!unitInfo || unitInfo.trim().length === 0) {
      throw new InvalidUnitInfoError(
        'Informações da unidade são obrigatórias para moradores.',
      );
    }
    if (unitInfo.length > 100) {
      throw new InvalidUnitInfoError(
        'Informações da unidade não podem exceder 100 caracteres.',
      );
    }
  }

  get providerId(): string {
    return this.props.providerId;
  }

  get condominiumId(): string | null {
    return this.props.condominiumId;
  }

  get addressId(): string | null | undefined {
    return this.props.addressId;
  }

  get number(): string | null | undefined {
    return this.props.number;
  }

  get type(): AssignmentType {
    return this.props.type;
  }

  get status(): AssignmentStatus {
    return this.props.status;
  }

  get unitInfo(): string | null | undefined {
    return this.props.unitInfo;
  }

  get proofOfResidency(): string | null | undefined {
    return this.props.proofOfResidency;
  }

  public approve(): void {
    this.props.status = 'APPROVED';
  }

  public reject(): void {
    this.props.status = 'REJECTED';
  }
}

export interface AssignmentWithCondo extends Assignment {
  condominium?: {
    name: string;
    city: string;
    state: string;
  } | null;
}

export interface AssignmentWithUser extends Assignment {
  provider?: {
    name: string | null;
    email: string;
  } | null;
}
