import { GetSpectrumOverview } from '../../application/use-cases/spectrum/get-spectrum-overview';
import { DrizzleSpectrumRepository } from '../../infrastructure/db/spectrum-repository/spectrum-repository';

export interface SpectrumRouterDependencies {
  getSpectrumOverviewUseCase: GetSpectrumOverview;
}

export function createSpectrumRouterDependencies(): SpectrumRouterDependencies {
  const spectrumRepo = new DrizzleSpectrumRepository();
  return {
    getSpectrumOverviewUseCase: new GetSpectrumOverview(spectrumRepo),
  };
}
