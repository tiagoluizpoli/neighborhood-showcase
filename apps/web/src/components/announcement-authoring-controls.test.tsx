import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { AnnouncementPriceInput } from './announcement-price-input';
import { AnnouncementTagsInput } from './announcement-tags-input';
import i18n from '@/i18n';

function renderWithI18n(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

const priceInput = (c: HTMLElement) =>
  c.querySelector<HTMLInputElement>('[data-testid="price-input"]');

describe('AnnouncementPriceInput', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
  });

  test('renders cents as a fixed two-decimal money amount with a currency symbol', () => {
    const { container } = renderWithI18n(
      <AnnouncementPriceInput valueCents={4500} onChange={() => {}} />,
    );
    expect(priceInput(container)?.value).toBe('45,00');
    expect(container.textContent).toContain('R$');
  });

  test('renders an empty field when there is no price', () => {
    const { container } = renderWithI18n(
      <AnnouncementPriceInput valueCents={null} onChange={() => {}} />,
    );
    expect(priceInput(container)?.value).toBe('');
  });

  test('emits normalized integer cents from typed digits', () => {
    const onChange = mock((_: number | null) => {});
    const { container } = renderWithI18n(
      <AnnouncementPriceInput valueCents={null} onChange={onChange} />,
    );
    const input = priceInput(container);
    if (!input) throw new Error('price-input not rendered');
    fireEvent.change(input, { target: { value: '12345' } });
    expect(onChange).toHaveBeenLastCalledWith(12345);
  });

  test('emits null when the field is cleared', () => {
    const onChange = mock((_: number | null) => {});
    const { container } = renderWithI18n(
      <AnnouncementPriceInput valueCents={999} onChange={onChange} />,
    );
    const input = priceInput(container);
    if (!input) throw new Error('price-input not rendered');
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe('AnnouncementTagsInput', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
  });

  test('renders each tag as a visible chip', () => {
    const { container } = renderWithI18n(
      <AnnouncementTagsInput value={['bolo', 'doce']} onChange={() => {}} />,
    );
    expect(
      container.querySelector('[data-testid="tag-chip-bolo"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="tag-chip-doce"]'),
    ).toBeTruthy();
    expect(container.textContent).toContain('#bolo');
  });

  test('removes a chip without disturbing the others', () => {
    const onChange = mock((_: string[]) => {});
    const { container } = renderWithI18n(
      <AnnouncementTagsInput value={['bolo', 'doce']} onChange={onChange} />,
    );
    const remove = container.querySelector<HTMLElement>(
      '[data-testid="tag-remove-bolo"]',
    );
    if (!remove) throw new Error('tag-remove-bolo not rendered');
    fireEvent.click(remove);
    expect(onChange).toHaveBeenLastCalledWith(['doce']);
  });
});
