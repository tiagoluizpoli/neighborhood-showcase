// biome-ignore-all lint/suspicious/noExplicitAny: test boundary mocks
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

const stubCropArea = { x: 0, y: 0, width: 400, height: 300 };

mock.module('@/utils/crop-image', () => ({
  getCroppedImg: async () => new Blob(['cropped'], { type: 'image/webp' }),
}));

mock.module('@neighborhood-showcase/env/web', () => ({
  env: { VITE_SERVER_URL: 'http://test.local' },
}));

mock.module('sonner', () => ({
  toast: { error: () => {}, success: () => {} },
}));

// Stub fires onCropComplete on mount so the crop area is always non-null.
mock.module('react-easy-crop', () => ({
  default: ({ onCropComplete }: any) => {
    useEffect(() => {
      onCropComplete?.({ x: 0, y: 0, width: 400, height: 300 }, stubCropArea);
    }, [onCropComplete]);
    return null;
  },
}));

const { ImageUploadField } = await import('./image-upload-field');

function renderField(props: any) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ImageUploadField label="Label" helpText="Help" {...props} />
    </I18nextProvider>,
  );
}

describe('ImageUploadField', () => {
  const fetchSpy = mock(async () => ({
    ok: true,
    json: async () => ({ url: 'http://test.local/uploaded.webp' }),
  }));
  let savedFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    fetchSpy.mockClear();
    savedFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as any;
  });

  afterEach(() => {
    globalThis.fetch = savedFetch;
  });

  // --- empty state ---

  test('empty: Upload button visible, no preview, no URL text input', () => {
    const { container } = renderField({ value: '', onChange: () => {} });
    expect(screen.getByRole('button', { name: /upload image/i })).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('input[type="text"]')).toBeNull();
  });

  // --- filled state ---

  test('filled: Replace / Re-crop / Remove visible, no URL text input', () => {
    const { container } = renderField({
      value: 'http://example.com/img.jpg',
      onChange: () => {},
    });
    expect(screen.getByRole('button', { name: /replace/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /re-crop/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /remove/i })).toBeTruthy();
    expect(container.querySelector('input[type="text"]')).toBeNull();
  });

  // --- per-role preview shape ---

  test('imageRole="avatar" → preview has rounded-full class', () => {
    const { container } = renderField({
      value: 'http://example.com/img.jpg',
      onChange: () => {},
      imageRole: 'avatar',
    });
    expect(container.querySelector('.rounded-full')).toBeTruthy();
  });

  test('imageRole="banner" → preview has aspect-video class', () => {
    const { container } = renderField({
      value: 'http://example.com/img.jpg',
      onChange: () => {},
      imageRole: 'banner',
    });
    expect(container.querySelector('.aspect-video')).toBeTruthy();
  });

  test('imageRole="logo" → preview is square, not circular', () => {
    const { container } = renderField({
      value: 'http://example.com/img.jpg',
      onChange: () => {},
      imageRole: 'logo',
    });
    expect(container.querySelector('.aspect-square')).toBeTruthy();
    expect(container.querySelector('.rounded-full')).toBeNull();
  });

  // --- Remove action ---

  test('Remove clears both value and original', () => {
    const onChange = mock(() => {});
    const onOriginalChange = mock(() => {});
    renderField({
      value: 'http://example.com/img.jpg',
      onChange,
      onOriginalChange,
      originalValue: 'http://example.com/original.jpg',
    });
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(onOriginalChange).toHaveBeenCalledWith('');
  });

  // --- lifecycle: empty → cropping ---

  test('file pick on empty state opens the crop modal', async () => {
    const { container } = renderField({ value: '', onChange: () => {} });
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) throw new Error('file input not found');
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText('Adjust Image')).toBeTruthy());
  });

  // --- lifecycle: cropping → filled ---

  test('confirming a crop calls onChange with the uploaded URL', async () => {
    const onChange = mock(() => {});
    const { container } = renderField({ value: '', onChange });
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) throw new Error('file input not found');
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => screen.getByText('Adjust Image'));
    // Flush pending React effects (Cropper stub onCropComplete via useEffect)
    // so croppedAreaPixels is set before we click "Crop and Save".
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: /crop and save/i }));
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('http://test.local/uploaded.webp'),
    );
  });

  // --- Re-crop: opens cropper on originalValue, no new original upload ---

  test('Re-crop opens cropper without triggering a new original upload', async () => {
    const onChange = mock(() => {});
    const onOriginalChange = mock(() => {});
    renderField({
      value: 'http://example.com/cropped.jpg',
      onChange,
      onOriginalChange,
      originalValue: 'http://example.com/original.jpg',
    });
    expect(screen.queryByText('Adjust Image')).toBeNull();
    // act flushes synchronous state updates from handleRecrop so the modal
    // renders and effects (onCropComplete) are flushed before we continue.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /re-crop/i }));
    });
    expect(screen.getByText('Adjust Image')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /crop and save/i }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    // Only the cropped-blob upload fires; no second upload for the original.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // onOriginalChange must NOT be called — re-crop keeps the existing original.
    expect(onOriginalChange).not.toHaveBeenCalled();
  });

  // --- Replace: re-enters the crop flow with a new file ---

  test('Replace in filled state triggers file input and re-enters crop flow', async () => {
    const { container } = renderField({
      value: 'http://example.com/img.jpg',
      onChange: () => {},
    });
    // The file input is always mounted; simulate the Replace trigger.
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) throw new Error('file input not found');
    const file = new File(['img2'], 'new.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText('Adjust Image')).toBeTruthy());
  });
});
