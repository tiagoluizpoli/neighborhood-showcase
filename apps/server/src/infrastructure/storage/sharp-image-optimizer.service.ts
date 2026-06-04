import type { ImageOptimizer } from '../../domain/services/image-optimizer.service';
import { resizeTo43Webp } from './image.utils';

export class SharpImageOptimizer implements ImageOptimizer {
  async resizeTo43Webp(buffer: Buffer): Promise<Buffer> {
    return resizeTo43Webp(buffer);
  }
}
