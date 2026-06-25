import sharp from 'sharp';

/** Longest-side cap; large uploads are downscaled, smaller ones left as-is. */
const MAX_DIMENSION = 1600;

/**
 * Convert an uploaded image to WebP while PRESERVING the aspect ratio the
 * client already cropped to (banner 8:1, logo/avatar 1:1, announcement 4:3).
 * Only downscales when a side exceeds MAX_DIMENSION — never reshapes or
 * upscales, so the saved image matches the crop the user framed.
 */
export async function optimizeWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
}
