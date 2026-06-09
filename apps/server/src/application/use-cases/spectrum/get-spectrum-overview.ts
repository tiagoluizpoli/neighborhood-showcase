import type { SpectrumOverview } from '../../../domain/entities/spectrum/spectrum-overview.entity';
import type { SpectrumRepository } from '../../../domain/repositories/spectrum.repository';

export interface GetSpectrumOverviewInput {
  periodStart: Date;
  periodEnd: Date;
}

export class GetSpectrumOverview {
  constructor(private readonly spectrumRepository: SpectrumRepository) {}

  async execute(input: GetSpectrumOverviewInput): Promise<SpectrumOverview> {
    return this.spectrumRepository.getOverview(input);
  }
}
