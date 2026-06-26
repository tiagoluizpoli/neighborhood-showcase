import { describe, expect, test } from 'bun:test';
import translationEN from './locales/en/translation.json';
import translationPT from './locales/pt/translation.json';

const VERIFIED_PROVIDER_KEYS = [
  'my_providers.page_title',
  'my_providers.page_subtitle',
  'my_providers.create_button',
  'my_providers.open_card',
  'my_providers.unnamed',
  'my_providers.loading',
  'my_providers.load_error',
  'my_providers.empty_title',
  'my_providers.empty_description',
  'my_providers.empty_cta',
  'provider_switcher.label',
  'provider_switcher.aria',
  'provider_switcher.select',
  'provider_switcher.manage',
  'verified_resident_stamp.label',
  'provider_profile.verified_resident',
] as const;

interface TranslationTree {
  [key: string]: TranslationTree | string;
}

function getTranslationValue(
  translations: TranslationTree,
  key: string,
): string | undefined {
  const segments = key.split('.');
  let current: TranslationTree | string = translations;

  for (const segment of segments) {
    if (
      typeof current !== 'object' ||
      current === null ||
      !(segment in current)
    ) {
      return undefined;
    }

    current = current[segment] as TranslationTree | string;
  }

  return typeof current === 'string' ? current : undefined;
}

describe('provider/stamp i18n parity (T-21-03/ST-01)', () => {
  test('every new provider/stamp key exists in both pt and en', () => {
    for (const key of VERIFIED_PROVIDER_KEYS) {
      const ptValue = getTranslationValue(
        translationPT as TranslationTree,
        key,
      );
      const enValue = getTranslationValue(
        translationEN as TranslationTree,
        key,
      );

      expect(ptValue, `missing pt translation for ${key}`).toBeDefined();
      expect(enValue, `missing en translation for ${key}`).toBeDefined();
      expect(ptValue, `empty pt translation for ${key}`).not.toBe('');
      expect(enValue, `empty en translation for ${key}`).not.toBe('');
      expect(ptValue, `raw pt key leaked for ${key}`).not.toBe(key);
      expect(enValue, `raw en key leaked for ${key}`).not.toBe(key);
    }
  });

  test('verified resident stamp label keeps condo interpolation in both locales', () => {
    const ptValue = getTranslationValue(
      translationPT as TranslationTree,
      'verified_resident_stamp.label',
    );
    const enValue = getTranslationValue(
      translationEN as TranslationTree,
      'verified_resident_stamp.label',
    );

    expect(ptValue).toContain('{{condo}}');
    expect(enValue).toContain('{{condo}}');
  });
});
