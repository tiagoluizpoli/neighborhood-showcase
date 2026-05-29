import { describe, expect, test } from 'bun:test';
import { clampCropBounds, validateCropBounds } from './cropper';

describe('Frontend Cropper Utility', () => {
  describe('validateCropBounds', () => {
    test('passes with exactly 4:3 crop within image bounds', () => {
      const result = validateCropBounds(1000, 1000, {
        x: 100,
        y: 100,
        width: 800,
        height: 600, // 800/600 = 1.333... (4:3)
      });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('fails if crop extends beyond width or height', () => {
      const result = validateCropBounds(1000, 1000, {
        x: 300,
        y: 100,
        width: 800, // 300 + 800 = 1100 > 1000
        height: 600,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'O recorte excede os limites da imagem original.',
      );
    });

    test('fails if aspect ratio is not 4:3 within tolerance', () => {
      const result = validateCropBounds(1000, 1000, {
        x: 0,
        y: 0,
        width: 500,
        height: 500, // 1:1 instead of 4:3
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('A proporção do recorte deve ser de 4:3');
    });

    test('fails for negative coordinates or zero dimensions', () => {
      const negCoords = validateCropBounds(1000, 1000, {
        x: -10,
        y: 0,
        width: 400,
        height: 300,
      });
      expect(negCoords.isValid).toBe(false);
      expect(negCoords.error).toBe(
        'O recorte não pode iniciar fora das coordenadas da imagem.',
      );

      const zeroSize = validateCropBounds(1000, 1000, {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
      expect(zeroSize.isValid).toBe(false);
      expect(zeroSize.error).toBe(
        'As dimensões de recorte devem ser maiores que zero.',
      );
    });
  });

  describe('clampCropBounds', () => {
    test('correctly clamps crop coordinates and sizes to image limits', () => {
      const clamped = clampCropBounds(1000, 1000, {
        x: 900,
        y: 900,
        width: 300,
        height: 300,
      });
      expect(clamped.width).toBe(300);
      expect(clamped.height).toBe(300);
      expect(clamped.x).toBe(700); // 1000 - 300
      expect(clamped.y).toBe(700); // 1000 - 300
    });
  });
});
