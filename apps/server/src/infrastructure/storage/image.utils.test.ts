import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { resizeTo43Webp } from './image.utils';

describe('Image Utility', () => {
  test('resizes image to 800x600 and converts to WebP', async () => {
    // Generate a raw test image buffer using sharp
    const inputBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const outputBuffer = await resizeTo43Webp(inputBuffer);

    // Get metadata from output buffer to verify aspect ratio and format
    const metadata = await sharp(outputBuffer).metadata();

    expect(metadata.width).toBe(800);
    expect(metadata.height).toBe(600);
    expect(metadata.format).toBe('webp');
  });
});
