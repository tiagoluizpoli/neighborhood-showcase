import { describe, expect, test } from 'bun:test';
import {
  type AnnouncementCta,
  InvalidCtaLabelError,
  InvalidCtaTargetError,
  MAX_CTA_LABEL_LENGTH,
  MAX_SECONDARY_CTA_TARGETS,
  resolveCtaTarget,
  sanitizeCta,
  TooManyCtaTargetsError,
  validateCta,
} from './cta';

describe('validateCta', () => {
  test('accepts each supported target family', () => {
    const families: AnnouncementCta[] = [
      { primary: { type: 'provider_profile', value: null }, secondary: [] },
      {
        primary: { type: 'website', value: 'https://menu.example.com' },
        secondary: [],
      },
      {
        primary: {
          type: 'instagram',
          value: 'https://instagram.com/p/abc',
        },
        secondary: [],
      },
      {
        primary: { type: 'tiktok', value: 'https://tiktok.com/@x/video/1' },
        secondary: [],
      },
      {
        primary: { type: 'whatsapp', value: '5511999999999' },
        secondary: [],
      },
      // whatsapp without value resolves to the contact baseline later.
      { primary: { type: 'whatsapp', value: null }, secondary: [] },
    ];

    for (const cta of families) {
      expect(() => validateCta(cta)).not.toThrow();
    }
  });

  test('rejects a URL target with an invalid value', () => {
    expect(() =>
      validateCta({
        primary: { type: 'website', value: 'not-a-url' },
        secondary: [],
      }),
    ).toThrow(InvalidCtaTargetError);
  });

  test('rejects a URL target with a missing value', () => {
    expect(() =>
      validateCta({
        primary: { type: 'instagram', value: null },
        secondary: [],
      }),
    ).toThrow(InvalidCtaTargetError);
  });

  test('rejects a whatsapp target with an invalid phone', () => {
    expect(() =>
      validateCta({
        primary: { type: 'whatsapp', value: '123' },
        secondary: [],
      }),
    ).toThrow(InvalidCtaTargetError);
  });

  test('rejects more than the secondary cap', () => {
    const secondary = Array.from(
      { length: MAX_SECONDARY_CTA_TARGETS + 1 },
      () => ({ type: 'provider_profile' as const, value: null }),
    );
    expect(() => validateCta({ primary: null, secondary })).toThrow(
      TooManyCtaTargetsError,
    );
  });

  test('validates invalid secondary targets too', () => {
    expect(() =>
      validateCta({
        primary: null,
        secondary: [{ type: 'website', value: 'broken' }],
      }),
    ).toThrow(InvalidCtaTargetError);
  });
});

describe('resolveCtaTarget', () => {
  const base = {
    providerId: 'prov-1',
    effectiveWhatsappPhone: '5511988887777',
  };

  test('resolves provider_profile to the provider page', () => {
    expect(
      resolveCtaTarget({
        target: { type: 'provider_profile', value: null },
        ...base,
      }),
    ).toEqual({ type: 'provider_profile', url: '/providers/prov-1' });
  });

  test('resolves whatsapp without value to the contact baseline', () => {
    expect(
      resolveCtaTarget({
        target: { type: 'whatsapp', value: null },
        ...base,
      }),
    ).toEqual({ type: 'whatsapp', url: 'https://wa.me/5511988887777' });
  });

  test('returns null for whatsapp with neither value nor baseline', () => {
    expect(
      resolveCtaTarget({
        target: { type: 'whatsapp', value: null },
        providerId: 'prov-1',
        effectiveWhatsappPhone: '',
      }),
    ).toBeNull();
  });

  test('returns null for a URL target with an invalid value', () => {
    expect(
      resolveCtaTarget({
        target: { type: 'website', value: 'nope' },
        ...base,
      }),
    ).toBeNull();
  });
});

describe('sanitizeCta', () => {
  test('drops unresolvable targets and promotes a surviving secondary', () => {
    const result = sanitizeCta({
      cta: {
        // unresolvable: no value, no contact baseline
        primary: { type: 'whatsapp', value: null },
        secondary: [
          { type: 'provider_profile', value: null },
          { type: 'website', value: 'broken' },
        ],
      },
      providerId: 'prov-1',
      effectiveWhatsappPhone: '',
    });

    expect(result.primary).toEqual({ type: 'provider_profile', value: null });
    expect(result.secondary).toEqual([]);
  });

  test('keeps a valid primary intact', () => {
    const result = sanitizeCta({
      cta: {
        primary: { type: 'website', value: 'https://menu.example.com' },
        secondary: [{ type: 'provider_profile', value: null }],
      },
      providerId: 'prov-1',
      effectiveWhatsappPhone: '5511988887777',
    });

    expect(result.primary).toEqual({
      type: 'website',
      value: 'https://menu.example.com',
    });
    expect(result.secondary).toHaveLength(1);
  });
});

describe('validateCta — optional label', () => {
  test('accepts a target with a bounded display name', () => {
    expect(() =>
      validateCta({
        primary: {
          type: 'website',
          value: 'https://menu.example.com',
          label: 'Cardápio',
        },
        secondary: [],
      }),
    ).not.toThrow();
  });

  test('accepts an absent label (optional)', () => {
    expect(() =>
      validateCta({
        primary: { type: 'provider_profile', value: null },
        secondary: [],
      }),
    ).not.toThrow();
  });

  test('rejects a label longer than the bound', () => {
    expect(() =>
      validateCta({
        primary: {
          type: 'website',
          value: 'https://menu.example.com',
          label: 'x'.repeat(MAX_CTA_LABEL_LENGTH + 1),
        },
        secondary: [],
      }),
    ).toThrow(InvalidCtaLabelError);
  });
});
