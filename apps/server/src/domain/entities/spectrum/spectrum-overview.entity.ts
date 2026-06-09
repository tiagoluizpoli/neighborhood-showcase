import {
  AuditableEntity,
  type AuditableProps,
} from '../../../shared/base-entity';
import { DomainError } from '../../../shared/domain-error';

export class InvalidDateRangeError extends DomainError {
  constructor() {
    super('A data de início deve ser anterior à data de fim.');
  }
}

export interface SpectrumOverviewProps extends AuditableProps {
  activeProviders: number;
  totalAnnouncements: number;
  flaggedForReview: number;
  newUserSignups: number;
  periodStart: Date;
  periodEnd: Date;
}

export class SpectrumOverview extends AuditableEntity<SpectrumOverviewProps> {
  constructor(props: SpectrumOverviewProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    if (this.props.periodStart >= this.props.periodEnd) {
      throw new InvalidDateRangeError();
    }
  }

  get activeProviders(): number {
    return this.props.activeProviders;
  }

  get totalAnnouncements(): number {
    return this.props.totalAnnouncements;
  }

  get flaggedForReview(): number {
    return this.props.flaggedForReview;
  }

  get newUserSignups(): number {
    return this.props.newUserSignups;
  }

  get periodStart(): Date {
    return this.props.periodStart;
  }

  get periodEnd(): Date {
    return this.props.periodEnd;
  }
}
