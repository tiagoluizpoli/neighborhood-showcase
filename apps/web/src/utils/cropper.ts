export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Validates if the selected crop rectangle is fully within the image dimensions
 * and conforms to a 4:3 aspect ratio (allowing a minor tolerance).
 */
export function validateCropBounds(
  imageWidth: number,
  imageHeight: number,
  crop: CropRect,
  tolerance = 0.01,
): { isValid: boolean; error?: string } {
  if (crop.width <= 0 || crop.height <= 0) {
    return {
      isValid: false,
      error: 'As dimensões de recorte devem ser maiores que zero.',
    };
  }

  if (crop.x < 0 || crop.y < 0) {
    return {
      isValid: false,
      error: 'O recorte não pode iniciar fora das coordenadas da imagem.',
    };
  }

  if (crop.x + crop.width > imageWidth || crop.y + crop.height > imageHeight) {
    return {
      isValid: false,
      error: 'O recorte excede os limites da imagem original.',
    };
  }

  const aspectRatio = crop.width / crop.height;
  const targetRatio = 4 / 3;
  if (Math.abs(aspectRatio - targetRatio) > tolerance) {
    return {
      isValid: false,
      error: `A proporção do recorte deve ser de 4:3 (obtido: ${aspectRatio.toFixed(2)}).`,
    };
  }

  return { isValid: true };
}

/**
 * Automatically calculates bounds or clamps crop coordinates to stay within image limits.
 */
export function clampCropBounds(
  imageWidth: number,
  imageHeight: number,
  crop: CropRect,
): CropRect {
  const width = Math.max(0, Math.min(crop.width, imageWidth));
  const height = Math.max(0, Math.min(crop.height, imageHeight));
  const x = Math.max(0, Math.min(crop.x, imageWidth - width));
  const y = Math.max(0, Math.min(crop.y, imageHeight - height));

  return { x, y, width, height };
}
