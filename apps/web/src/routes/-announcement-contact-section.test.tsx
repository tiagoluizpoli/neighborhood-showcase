import { beforeEach, describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import {
  AnnouncementContactSection,
  hasBaseline,
} from '@/routes/panel/provider/-announcement-contact-section';

// Use the real i18n instance + <I18nextProvider> and assert the real pt strings.
// bun's `mock.module` is process-global and permanent, so a partial
// react-i18next mock would drop `initReactI18next`/`I18nextProvider` and break
// every other test file that imports `@/i18n` in the same process.

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

// biome-ignore lint/suspicious/noExplicitAny: test feeds partial props
function renderSection(props: any) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AnnouncementContactSection {...baseProps} {...props} />
    </I18nextProvider>,
  );
}

describe('AnnouncementContactSection', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
  });

  test('hasBaseline: requires at least 10 digits', () => {
    expect(hasBaseline(null)).toBe(false);
    expect(hasBaseline({ primaryPhone: '119999', callEnabled: false })).toBe(
      false,
    );
    expect(
      hasBaseline({ primaryPhone: '11999998888', callEnabled: false }),
    ).toBe(true);
  });

  test('inherit mode with a configured baseline shows the inherited badge', () => {
    renderSection({
      mode: 'inherit',
      providerDefaults: { primaryPhone: '11999998888', callEnabled: true },
    });
    expect(screen.getByText('Canais de Contato')).toBeTruthy();
    expect(screen.getByText('Usando padrões do perfil')).toBeTruthy();
    expect(screen.getByText('Personalizar para este anúncio')).toBeTruthy();
    expect(screen.getByText('11999998888')).toBeTruthy();
    expect(
      screen.getByText('Chamadas diretas ativadas neste número.'),
    ).toBeTruthy();
  });

  test('inherit mode without a baseline surfaces the configure affordance', () => {
    renderSection({ mode: 'inherit', providerDefaults: null });
    expect(
      screen.getByText(
        'Adicione um número de WhatsApp ao seu perfil antes de publicar.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Ir para configurações de contato')).toBeTruthy();
  });

  test('custom mode exposes the override fields and the back affordance', () => {
    renderSection({
      mode: 'custom',
      customPhone: '11988887777',
      providerDefaults: null,
    });
    expect(screen.getByText('Personalizado para este anúncio')).toBeTruthy();
    expect(screen.getByText('WhatsApp (apenas números com DDD)')).toBeTruthy();
    expect(screen.getByText('Usar padrões do perfil')).toBeTruthy();
  });
});
