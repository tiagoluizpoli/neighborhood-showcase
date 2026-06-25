import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { optimizeWebp } from './image.utils';

describe('Image Utility', () => {
  test('preserves aspect ratio and converts to WebP', async () => {
    // Wide 8:1-style source: must keep its shape (no forced 4:3 reshape).
    const inputBuffer = await sharp({
      create: {
        width: 1200,
        height: 150,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const outputBuffer = await optimizeWebp(inputBuffer);
    const metadata = await sharp(outputBuffer).metadata();

    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(150);
    expect(metadata.format).toBe('webp');
  });

  test('downscales oversized images but keeps aspect', async () => {
    const inputBuffer = await sharp({
      create: {
        width: 3200,
        height: 400,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    })
      .png()
      .toBuffer();

    const metadata = await sharp(await optimizeWebp(inputBuffer)).metadata();

    // Longest side capped at 1600, ratio (8:1) preserved.
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBe(200);
  });
});
