import { Entity } from '../../shared/base-entity';
import { DomainError } from '../../shared/domain-error';

export class InvalidBlacklistPropsError extends DomainError {}

export interface BlacklistProps {
  cpfHash: string;
  reason: string;
  bannedAt?: Date;
}

export class BlacklistedIdentifier extends Entity<BlacklistProps> {
  constructor(props: BlacklistProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    if (!this.props.cpfHash || this.props.cpfHash.trim().length === 0) {
      throw new InvalidBlacklistPropsError('CPF hash is required.');
    }
    if (!this.props.reason || this.props.reason.trim().length === 0) {
      throw new InvalidBlacklistPropsError('Reason is required.');
    }
  }

  get cpfHash(): string {
    return this.props.cpfHash;
  }

  get reason(): string {
    return this.props.reason;
  }

  get bannedAt(): Date {
    return this.props.bannedAt || new Date();
  }

  public toDTO() {
    return {
      id: this.id,
      cpfHash: this.cpfHash,
      reason: this.reason,
      bannedAt: this.bannedAt,
    };
  }
}
