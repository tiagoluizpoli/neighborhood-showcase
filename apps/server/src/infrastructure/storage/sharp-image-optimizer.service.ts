import type { ImageOptimizer } from '../../domain/services/image-optimizer.service';
import { optimizeWebp } from './image.utils';

export class SharpImageOptimizer implements ImageOptimizer {
  async optimizeWebp(buffer: Buffer): Promise<Buffer> {
    return optimizeWebp(buffer);
  }
}
