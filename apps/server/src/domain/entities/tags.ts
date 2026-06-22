/**
 * Canonical tag normalization (PRD-v10 / E-17 / T-17-05).
 *
 * Tags are provider-authored discovery metadata. Normalization is deliberately
 * conservative: trim, case-fold (lowercase), accent-fold for dedupe/search, and
 * drop duplicates. It must NOT rewrite meaning — no singular/plural collapsing,
 * stemming, or synonym mapping. The stored value keeps the author's accents; the
 * accent-folded form is used only as a comparison key so "Café" and "cafe" do
 * not both persist.
 *
 * This lives in the domain so create and update share one source of truth and
 * cannot drift apart.
 */

/** Upper bound on a single tag's length, to keep chips and storage sane. */
export const MAX_TAG_LENGTH = 40;

/** Upper bound on how many tags an announcement may carry. */
export const MAX_TAGS = 30;

/** Strip diacritics for accent-insensitive comparison/search. */
export function foldAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Trim + case-fold a single tag. No semantic rewriting. */
export function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Normalize a raw tag list: trim, case-fold, drop empties and over-long
 * entries, and dedupe by accent-folded key while preserving first-seen order
 * and the author's accents.
 */
export function normalizeTags(raw: readonly string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    const normalized = normalizeTag(entry);
    if (normalized.length === 0 || normalized.length > MAX_TAG_LENGTH) {
      continue;
    }
    const key = foldAccents(normalized);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
    if (result.length >= MAX_TAGS) {
      break;
    }
  }

  return result;
}
