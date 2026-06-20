import { DomainError } from '../../shared/domain-error';

/**
 * Canonical contact contract (PRD-v10 / E-17).
 *
 * Contact channels answer "How does the resident reach the provider?" and are
 * deliberately kept separate from CTA targets (where an announcement sends the
 * resident). This module owns the contact vocabulary shared by provider
 * defaults and announcement-level inherit/custom behavior.
 *
 * WhatsApp is the hard baseline: one primary number is stored once and is
 * always WhatsApp-capable. Direct call is a separate action on that same
 * number, defaulting from the provider but overridable per announcement.
 */

export class InvalidPrimaryPhoneError extends DomainError {
  constructor() {
    super('Número de telefone principal inválido.');
  }
}

export class WhatsappBaselineRequiredError extends DomainError {
  constructor() {
    super('Um número de WhatsApp é obrigatório para o contato do anúncio.');
  }
}

/**
 * Provider-level default contact contract. `primaryPhone` is the single
 * WhatsApp-capable business number (empty string means not yet configured).
 * `callEnabled` exposes the optional direct-call action on that same number.
 */
export interface ProviderContactDefaults {
  primaryPhone: string;
  callEnabled: boolean;
}

/**
 * Supporting contact metadata preserved alongside the baseline number. These
 * are NOT first-class contact channels; they remain available so later CTA work
 * (T-17-04) can seed sensible destination suggestions without losing data.
 */
export interface ProviderContactMetadata {
  email?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  website?: string;
}

export const ANNOUNCEMENT_CONTACT_MODES = ['inherit', 'custom'] as const;
export type AnnouncementContactMode =
  (typeof ANNOUNCEMENT_CONTACT_MODES)[number];

/**
 * Announcement-level contact settings. In `inherit` mode the announcement
 * follows the provider defaults live and `custom` is null. In `custom` mode the
 * announcement carries its own self-contained defaults.
 */
export interface AnnouncementContactSettings {
  mode: AnnouncementContactMode;
  custom: ProviderContactDefaults | null;
}

export interface EffectiveContact {
  primaryPhone: string;
  callEnabled: boolean;
  source: AnnouncementContactMode;
}

export interface ResolveAnnouncementContactInput {
  settings: AnnouncementContactSettings;
  providerDefaults: ProviderContactDefaults;
}

/**
 * Strip a raw phone string down to digits (keeping a single leading +).
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return '';
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * A primary phone is valid when it has at least 10 digits (national number with
 * area code). Empty is treated as "not configured" and validated by callers.
 */
export function isValidPrimaryPhone(raw: string): boolean {
  const digitCount = raw.replace(/\D/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
}

export function hasWhatsappBaseline(
  defaults: ProviderContactDefaults,
): boolean {
  return isValidPrimaryPhone(defaults.primaryPhone);
}

/**
 * Resolve the effective contact for an announcement, applying live provider
 * inheritance unless the announcement is explicitly customized.
 */
export function resolveAnnouncementContact(
  input: ResolveAnnouncementContactInput,
): EffectiveContact {
  if (input.settings.mode === 'custom' && input.settings.custom) {
    return {
      primaryPhone: input.settings.custom.primaryPhone,
      callEnabled: input.settings.custom.callEnabled,
      source: 'custom',
    };
  }

  return {
    primaryPhone: input.providerDefaults.primaryPhone,
    callEnabled: input.providerDefaults.callEnabled,
    source: 'inherit',
  };
}
