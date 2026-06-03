// biome-ignore-all lint/suspicious/noExplicitAny: Mocking browser APIs in node tests requires explicit any
import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { getCroppedImg } from './crop-image';

describe('crop-image helper', () => {
  let mockDrawImage: ReturnType<typeof mock>;
  let mockToBlob: ReturnType<typeof mock>;
  let mockCanvasContext: any;
  let mockCanvasElement: any;

  beforeEach(() => {
    mockDrawImage = mock(() => {});
    mockToBlob = mock((callback: any) => {
      // Simulate successful blob generation
      callback(new Blob(['mock-image-data'], { type: 'image/webp' }));
    });

    mockCanvasContext = {
      drawImage: mockDrawImage,
    };

    mockCanvasElement = {
      getContext: mock(() => mockCanvasContext),
      toBlob: mockToBlob,
      width: 0,
      height: 0,
    };

    // Mock document.createElement
    global.document = {
      createElement: mock((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvasElement;
        }
        return {};
      }),
    } as any;

    // Mock Image constructor
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: ((err: any) => void) | null = null;
      src = '';
      crossOrigin = '';

      constructor() {
        // Automatically fire onload in a microtask to simulate image loading
        queueMicrotask(() => {
          if (this.onload) this.onload();
        });
      }

      addEventListener(event: string, callback: () => void) {
        if (event === 'load') this.onload = callback;
        if (event === 'error') this.onerror = callback;
      }
    } as any;
  });

  afterAll(() => {
    delete (global as any).document;
    delete (global as any).Image;
  });

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

    // Verify canvas element creation and dimensions
    expect(global.document.createElement).toHaveBeenCalledWith('canvas');
    expect(mockCanvasElement.width).toBe(400);
    expect(mockCanvasElement.height).toBe(300);

    // Verify 2d context calls
    expect(mockCanvasElement.getContext).toHaveBeenCalledWith('2d');
    expect(mockDrawImage).toHaveBeenCalled();
    expect(mockToBlob).toHaveBeenCalled();
  });
});
