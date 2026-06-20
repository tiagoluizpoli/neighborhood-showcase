// biome-ignore-all lint/suspicious/noExplicitAny: test serializes React tree
import { describe, expect, mock, test } from 'bun:test';

// ─── react-i18next mock: t echoes the key ────────────────────────────────────
mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt' },
  }),
}));

// ─── lucide-react mock ────────────────────────────────────────────────────────
mock.module('lucide-react', () => {
  const dummyIcon = () => null;
  return {
    CheckIcon: dummyIcon,
    Phone: dummyIcon,
    Settings: dummyIcon,
    Sparkles: dummyIcon,
  };
});

const noop = () => {};

const baseProps = {
  onModeChange: noop,
  customPhone: '',
  onCustomPhoneChange: noop,
  customCallEnabled: false,
  onCustomCallEnabledChange: noop,
  isLoadingDefaults: false,
  onConfigureContact: noop,
};

describe('AnnouncementContactSection', () => {
  test('hasBaseline: requires at least 10 digits', async () => {
    const { hasBaseline } = await import(
      '@/routes/panel/provider/-announcement-contact-section'
    );
    expect(hasBaseline(null)).toBe(false);
    expect(hasBaseline({ primaryPhone: '119999', callEnabled: false })).toBe(
      false,
    );
    expect(
      hasBaseline({ primaryPhone: '11999998888', callEnabled: false }),
    ).toBe(true);
  });

  test('inherit mode with a configured baseline shows the inherited badge', async () => {
    const { AnnouncementContactSection } = await import(
      '@/routes/panel/provider/-announcement-contact-section'
    );
    const tree = AnnouncementContactSection({
      ...baseProps,
      mode: 'inherit',
      providerDefaults: { primaryPhone: '11999998888', callEnabled: true },
    } as any);
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain('new_announcement.contact_card.title');
    expect(serialized).toContain(
      'new_announcement.contact_card.mode_inherit_badge',
    );
    expect(serialized).toContain(
      'new_announcement.contact_card.customize_button',
    );
    expect(serialized).toContain('11999998888');
    expect(serialized).toContain('new_announcement.contact_card.calls_on');
  });

  test('inherit mode without a baseline surfaces the configure affordance', async () => {
    const { AnnouncementContactSection } = await import(
      '@/routes/panel/provider/-announcement-contact-section'
    );
    const tree = AnnouncementContactSection({
      ...baseProps,
      mode: 'inherit',
      providerDefaults: null,
    } as any);
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain(
      'new_announcement.contact_card.no_baseline_warning',
    );
    expect(serialized).toContain(
      'new_announcement.contact_card.configure_link',
    );
  });

  test('custom mode exposes the override fields and the back affordance', async () => {
    const { AnnouncementContactSection } = await import(
      '@/routes/panel/provider/-announcement-contact-section'
    );
    const tree = AnnouncementContactSection({
      ...baseProps,
      mode: 'custom',
      customPhone: '11988887777',
      providerDefaults: null,
    } as any);
    const serialized = JSON.stringify(tree);
    expect(serialized).toContain(
      'new_announcement.contact_card.mode_custom_badge',
    );
    expect(serialized).toContain(
      'new_announcement.contact_card.custom_phone_label',
    );
    expect(serialized).toContain(
      'new_announcement.contact_card.use_defaults_button',
    );
  });
});
