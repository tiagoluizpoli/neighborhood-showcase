import { DomainError } from '../../shared/domain-error';
import { isValidPrimaryPhone } from './contact';

/**
 * Canonical CTA contract (PRD-v10 / E-17 / T-17-04).
 *
 * CTA targets answer "Where does this announcement intentionally send the
 * resident?" and are deliberately kept separate from contact channels (how the
 * resident reaches the provider). CTA lives at the announcement level only —
 * there is no provider-level CTA inheritance.
 *
 * The v1 target set is intentionally bounded: this is NOT an arbitrary
 * destination builder. An announcement carries at most one primary target plus
 * a small, capped list of secondary targets.
 */

export const CTA_TARGET_TYPES = [
  'provider_profile',
  'website',
  'instagram',
  'tiktok',
  'whatsapp',
] as const;
export type CtaTargetType = (typeof CTA_TARGET_TYPES)[number];

/** Bounded ceiling on secondary CTA targets to keep the model coherent. */
export const MAX_SECONDARY_CTA_TARGETS = 3;

/**
 * URL-backed targets require a concrete http(s) destination. Other types
 * resolve from existing data: `provider_profile` points at the provider page,
 * `whatsapp` falls back to the effective contact number when no value is given.
 */
const URL_TARGET_TYPES: readonly CtaTargetType[] = [
  'website',
  'instagram',
  'tiktok',
];

export interface CtaTarget {
  type: CtaTargetType;
  value: string | null;
}

export interface AnnouncementCta {
  primary: CtaTarget | null;
  secondary: CtaTarget[];
}

export const EMPTY_CTA: AnnouncementCta = { primary: null, secondary: [] };

export class InvalidCtaTargetError extends DomainError {
  constructor(message = 'Destino de CTA inválido para o conjunto suportado.') {
    super(message);
  }
}

export class TooManyCtaTargetsError extends DomainError {
  constructor() {
    super(
      `O anúncio permite no máximo ${MAX_SECONDARY_CTA_TARGETS} destinos de CTA secundários.`,
    );
  }
}

export function isCtaTargetType(value: string): value is CtaTargetType {
  return (CTA_TARGET_TYPES as readonly string[]).includes(value);
}

export function ctaTargetRequiresUrl(type: CtaTargetType): boolean {
  return URL_TARGET_TYPES.includes(type);
}

export function isValidHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * A target is valid when its value matches the rules for its type. URL targets
 * need a valid http(s) URL; `whatsapp` either omits its value (resolving to the
 * contact baseline later) or carries a valid phone; `provider_profile` needs no
 * value.
 */
export function isValidCtaTarget(target: CtaTarget): boolean {
  if (!isCtaTargetType(target.type)) {
    return false;
  }
  if (ctaTargetRequiresUrl(target.type)) {
    return typeof target.value === 'string' && isValidHttpUrl(target.value);
  }
  if (target.type === 'whatsapp') {
    if (target.value == null || target.value.trim().length === 0) {
      return true;
    }
    return isValidPrimaryPhone(target.value);
  }
  // provider_profile: resolves from the announcement's provider, no value.
  return true;
}

/**
 * Enforce the bounded CTA contract at the domain boundary. Throws a
 * `DomainError` subclass so the presentation layer can translate it.
 */
export function validateCta(cta: AnnouncementCta): void {
  if (cta.secondary.length > MAX_SECONDARY_CTA_TARGETS) {
    throw new TooManyCtaTargetsError();
  }
  if (cta.primary && !isValidCtaTarget(cta.primary)) {
    throw new InvalidCtaTargetError();
  }
  for (const target of cta.secondary) {
    if (!isValidCtaTarget(target)) {
      throw new InvalidCtaTargetError();
    }
  }
}

export interface ResolveCtaTargetInput {
  target: CtaTarget;
  providerId: string;
  /** Effective announcement contact phone, used as the WhatsApp fallback. */
  effectiveWhatsappPhone: string;
}

export interface ResolvedCtaAction {
  type: CtaTargetType;
  url: string;
}

/**
 * Resolve a single CTA target into a concrete, navigable action, or null when
 * the target cannot produce a live destination (so callers never render a
 * dead-end link). This is the seam public surfaces use to degrade gracefully.
 */
export function resolveCtaTarget(
  input: ResolveCtaTargetInput,
): ResolvedCtaAction | null {
  const { target, providerId, effectiveWhatsappPhone } = input;

  switch (target.type) {
    case 'provider_profile':
      return providerId
        ? { type: 'provider_profile', url: `/providers/${providerId}` }
        : null;
    case 'website':
    case 'instagram':
    case 'tiktok':
      return target.value && isValidHttpUrl(target.value)
        ? { type: target.type, url: target.value }
        : null;
    case 'whatsapp': {
      const explicit = target.value?.replace(/\D/g, '') ?? '';
      const fallback = effectiveWhatsappPhone.replace(/\D/g, '');
      const digits = explicit.length > 0 ? explicit : fallback;
      return digits.length > 0
        ? { type: 'whatsapp', url: `https://wa.me/${digits}` }
        : null;
    }
    default:
      return null;
  }
}

export interface SanitizeCtaInput {
  cta: AnnouncementCta;
  providerId: string;
  effectiveWhatsappPhone: string;
}

/**
 * Drop any CTA targets that cannot resolve to a live destination given the
 * current provider/contact state, returning only renderable targets. Read
 * surfaces use this so absent or stale CTA data falls back cleanly instead of
 * surfacing broken actions.
 */
export function sanitizeCta(input: SanitizeCtaInput): AnnouncementCta {
  const resolvable = (target: CtaTarget): boolean =>
    resolveCtaTarget({
      target,
      providerId: input.providerId,
      effectiveWhatsappPhone: input.effectiveWhatsappPhone,
    }) !== null;

  const primary =
    input.cta.primary && resolvable(input.cta.primary)
      ? input.cta.primary
      : null;
  const secondary = input.cta.secondary.filter(resolvable);

  // Promote a surviving secondary target when the primary dropped out so the
  // announcement still leads with a strong action when one exists.
  const [promoted, ...rest] = secondary;
  if (!primary && promoted) {
    return { primary: promoted, secondary: rest };
  }

  return { primary, secondary };
}
