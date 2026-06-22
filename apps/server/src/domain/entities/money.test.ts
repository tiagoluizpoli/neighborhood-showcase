import { describe, expect, test } from 'bun:test';
import { MAX_PRICE_CENTS, normalizePriceCents } from './money';

describe('normalizePriceCents', () => {
  test('keeps a positive integer count of cents', () => {
    expect(normalizePriceCents(2500)).toBe(2500);
  });

  test('rounds fractional cents to the nearest integer', () => {
    expect(normalizePriceCents(2500.4)).toBe(2500);
    expect(normalizePriceCents(2500.6)).toBe(2501);
  });

  test('treats absent / zero / negative as no price', () => {
    expect(normalizePriceCents(null)).toBeNull();
    expect(normalizePriceCents(undefined)).toBeNull();
    expect(normalizePriceCents(0)).toBeNull();
    expect(normalizePriceCents(-100)).toBeNull();
  });

  test('rejects non-finite values', () => {
    expect(normalizePriceCents(Number.NaN)).toBeNull();
    expect(normalizePriceCents(Number.POSITIVE_INFINITY)).toBeNull();
  });

  test('clamps to the storable 32-bit integer ceiling', () => {
    expect(normalizePriceCents(MAX_PRICE_CENTS + 1)).toBe(MAX_PRICE_CENTS);
    expect(normalizePriceCents(9_999_999_999_999)).toBe(MAX_PRICE_CENTS);
  });
});
