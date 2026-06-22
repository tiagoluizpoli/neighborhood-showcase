import { describe, expect, test } from 'bun:test';
import { foldAccents, MAX_TAG_LENGTH, MAX_TAGS, normalizeTags } from './tags';

describe('normalizeTags', () => {
  test('trims and lowercases each tag', () => {
    expect(normalizeTags(['  Bolo ', 'FESTA'])).toEqual(['bolo', 'festa']);
  });

  test('drops empty and whitespace-only entries', () => {
    expect(normalizeTags(['', '   ', 'doce'])).toEqual(['doce']);
  });

  test('dedupes case-insensitively, preserving first-seen order', () => {
    expect(normalizeTags(['Bolo', 'bolo', 'Doce', 'BOLO'])).toEqual([
      'bolo',
      'doce',
    ]);
  });

  test('dedupes accent variants while keeping the author accents', () => {
    expect(normalizeTags(['Café', 'cafe'])).toEqual(['café']);
  });

  test('does NOT collapse singular/plural — no semantic rewriting', () => {
    expect(normalizeTags(['bolo', 'bolos'])).toEqual(['bolo', 'bolos']);
  });

  test('drops over-long tags beyond the length ceiling', () => {
    const longTag = 'a'.repeat(MAX_TAG_LENGTH + 1);
    expect(normalizeTags(['ok', longTag])).toEqual(['ok']);
  });

  test('caps the number of tags at MAX_TAGS', () => {
    const many = Array.from({ length: MAX_TAGS + 10 }, (_, i) => `tag${i}`);
    expect(normalizeTags(many)).toHaveLength(MAX_TAGS);
  });
});

describe('foldAccents', () => {
  test('strips diacritics for comparison', () => {
    expect(foldAccents('açaí')).toBe('acai');
  });
});
