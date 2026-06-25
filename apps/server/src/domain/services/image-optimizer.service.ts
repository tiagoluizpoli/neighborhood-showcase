export interface ImageOptimizer {
  optimizeWebp(buffer: Buffer): Promise<Buffer>;
}
