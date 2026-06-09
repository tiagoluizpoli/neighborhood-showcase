import { SpectrumOverview } from '../../../domain/entities/spectrum/spectrum-overview.entity';
import type { EntityMapper } from '../../../domain/mapper';

export interface SpectrumSnapshotRow {
  activeProviders: number;
  totalAnnouncements: number;
  flaggedForReview: number;
  newUserSignups: number;
  periodStart: Date;
  periodEnd: Date;
}

export class SpectrumMapper
  implements EntityMapper<SpectrumSnapshotRow, SpectrumOverview>
{
  toDomain(raw: SpectrumSnapshotRow): SpectrumOverview {
    return new SpectrumOverview({
      activeProviders: raw.activeProviders,
      totalAnnouncements: raw.totalAnnouncements,
      flaggedForReview: raw.flaggedForReview,
      newUserSignups: raw.newUserSignups,
      periodStart: raw.periodStart,
      periodEnd: raw.periodEnd,
    });
  }

  toPersistence(_entity: SpectrumOverview): Record<string, never> {
    return {};
  }
}
