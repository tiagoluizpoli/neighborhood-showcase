import { describe, expect, test } from 'bun:test';
import { getCroppedImg } from './crop-image';

describe('crop-image helper', () => {
  test('successfully crops image and returns a blob', async () => {
    const mockPixelCrop = {
      x: 10,
      y: 20,
      width: 400,
      height: 300,
    };

    const blob = await getCroppedImg(
      'data:image/png;base64,...',
      mockPixelCrop,
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/webp');
  });
});
