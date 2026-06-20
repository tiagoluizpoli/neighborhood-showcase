import {
  type AnnouncementContactMode,
  type AnnouncementContactSettings,
  resolveAnnouncementContact,
} from '../../../domain/entities/contact';

export interface AnnouncementContactRow {
  mode: AnnouncementContactMode;
  custom: { primaryPhone: string; callEnabled: boolean } | null;
}

/**
 * Build the structured contact settings from a persisted announcement row.
 */
export function rowToContactSettings(
  row: AnnouncementContactRow,
): AnnouncementContactSettings {
  if (row.mode === 'custom' && row.custom) {
    return { mode: 'custom', custom: row.custom };
  }
  return { mode: 'inherit', custom: null };
}

/**
 * Transitional compatibility view. Read DTOs still expose a flat `contactLinks`
 * map so existing public/card/detail surfaces keep working until T-17-04
 * rewires them onto the structured contact + CTA model.
 *
 * During T-17-01 every authored announcement is `custom`, so resolution against
 * provider defaults is a no-op here; the providerDefaults fallback keeps the
 * derivation correct once inherit authoring lands (T-17-02/03).
 */
export function contactSettingsToLinks(
  settings: AnnouncementContactSettings,
  providerDefaults: { primaryPhone: string; callEnabled: boolean } = {
    primaryPhone: '',
    callEnabled: false,
  },
): Record<string, string | undefined> {
  const effective = resolveAnnouncementContact({
    settings,
    providerDefaults,
  });

  if (!effective.primaryPhone) {
    return {};
  }

  return {
    whatsapp: effective.primaryPhone,
    phone: effective.callEnabled ? effective.primaryPhone : undefined,
  };
}
