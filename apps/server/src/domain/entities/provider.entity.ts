import { AuditableEntity, type AuditableProps } from '../../shared/base-entity';
import { DomainError } from '../../shared/domain-error';

export class ProviderNotFoundError extends DomainError {
  constructor() {
    super('Provedor não encontrado');
  }
}

export interface ProviderProps extends AuditableProps {
  ownerId: string;
  deletedAt?: Date | null;
}

// First-class provider entity (PRD-v13 / E-20). A user owns MANY providers; each
// provider is a business identity bound to exactly ONE condo via its assignment.
// Soft-delete via `deletedAt` hides the provider and its announcements while
// preserving payment/analytics history.
export class Provider extends AuditableEntity<ProviderProps> {
  get ownerId(): string {
    return this.props.ownerId;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt != null;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.ownerId === userId;
  }
}
