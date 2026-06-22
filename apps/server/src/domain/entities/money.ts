/**
 * Canonical money normalization (PRD-v10 / E-17 / T-17-05).
 *
 * Prices persist as a normalized integer number of cents. The authoring UI may
 * collect money in a friendlier shape, but the stored contract is always a
 * non-negative integer of cents (or null when no price applies). Centralizing
 * here keeps create and update from drifting on how they coerce price input.
 */

/**
 * Upper bound on stored cents. The column is a 32-bit Postgres `integer`, so a
 * larger value would overflow and fail the insert; clamp instead of letting a
 * typo/paste reach the database.
 */
export const MAX_PRICE_CENTS = 2_147_483_647;

/**
 * Coerce an incoming price-in-cents value to the stored contract: a positive
 * integer count of cents within the storable range, or null when absent / zero
 * / invalid.
 */
export function normalizePriceCents(
  value: number | null | undefined,
): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  const cents = Math.round(value);
  if (cents <= 0) {
    return null;
  }
  return Math.min(cents, MAX_PRICE_CENTS);
}
