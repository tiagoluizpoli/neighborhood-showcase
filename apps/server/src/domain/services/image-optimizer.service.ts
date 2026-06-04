export interface ImageOptimizer {
  resizeTo43Webp(buffer: Buffer): Promise<Buffer>;
}
