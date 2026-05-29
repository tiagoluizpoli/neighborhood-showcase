import sharp from 'sharp';

export async function resizeTo43Webp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(800, 600, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
}
