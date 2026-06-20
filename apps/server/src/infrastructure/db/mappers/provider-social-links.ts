import type { ProviderContactMetadata } from '../../../domain/entities/contact';

export interface DeriveSocialLinksInput {
  primaryPhone: string;
  callEnabled: boolean;
  metadata: ProviderContactMetadata;
}

/**
 * Transitional compatibility view (T-17-01). Public provider surfaces still
 * consume a flat `socialLinks` map. Derive it from the canonical contact
 * contract so those surfaces keep working until T-17-04 migrates them onto the
 * structured contact + CTA model.
 */
export function deriveSocialLinks(
  input: DeriveSocialLinksInput,
): Record<string, string | undefined> {
  return {
    whatsapp: input.primaryPhone || undefined,
    phone:
      input.callEnabled && input.primaryPhone ? input.primaryPhone : undefined,
    ...input.metadata,
  };
}
