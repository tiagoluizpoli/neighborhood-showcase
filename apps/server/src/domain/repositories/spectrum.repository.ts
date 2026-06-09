import type { SpectrumOverview } from '../entities/spectrum/spectrum-overview.entity';

export interface GetSpectrumOverviewRepositoryInput {
  periodStart: Date;
  periodEnd: Date;
}

export interface SpectrumRepository {
  getOverview(
    input: GetSpectrumOverviewRepositoryInput,
  ): Promise<SpectrumOverview>;
}
