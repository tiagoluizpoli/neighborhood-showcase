import {
  type AnnouncementCta,
  type CtaTarget,
  EMPTY_CTA,
  isCtaTargetType,
} from '../../../domain/entities/cta';

export interface AnnouncementCtaRowTarget {
  type: string;
  value: string | null;
  label?: string | null;
}

export interface AnnouncementCtaRow {
  primary: AnnouncementCtaRowTarget | null;
  secondary: AnnouncementCtaRowTarget[];
}

function rowTargetToDomain(
  target: AnnouncementCtaRowTarget | null | undefined,
): CtaTarget | null {
  if (!target || !isCtaTargetType(target.type)) {
    return null;
  }
  return {
    type: target.type,
    value: target.value ?? null,
    label: target.label ?? null,
  };
}

/**
 * Build the structured CTA from a persisted announcement row, dropping any
 * persisted target whose type is no longer part of the bounded set.
 */
export function rowToCta(
  row: AnnouncementCtaRow | null | undefined,
): AnnouncementCta {
  if (!row) {
    return EMPTY_CTA;
  }
  const primary = rowTargetToDomain(row.primary);
  const secondary = (row.secondary ?? [])
    .map(rowTargetToDomain)
    .filter((target): target is CtaTarget => target !== null);
  return { primary, secondary };
}

/**
 * Serialize the structured CTA into the persisted jsonb shape.
 */
export function ctaToRow(cta: AnnouncementCta): AnnouncementCtaRow {
  return {
    primary: cta.primary
      ? {
          type: cta.primary.type,
          value: cta.primary.value,
          label: cta.primary.label,
        }
      : null,
    secondary: cta.secondary.map((target) => ({
      type: target.type,
      value: target.value,
      label: target.label,
    })),
  };
}
