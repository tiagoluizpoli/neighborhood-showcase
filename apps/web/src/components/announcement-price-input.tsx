import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@neighborhood-showcase/ui/components/input-group';
import { useTranslation } from 'react-i18next';

interface AnnouncementPriceInputProps {
  valueCents: number | null;
  onChange: (cents: number | null) => void;
}

/**
 * Money-aware price input. The field behaves like money — a currency symbol
 * leads the control and the value reads as a fixed two-decimal amount — while
 * the stored contract stays a normalized integer of cents. Input is
 * calculator-style: each digit shifts into the cents place, so there is no
 * decimal-separator ambiguity across locales.
 */
export function AnnouncementPriceInput({
  valueCents,
  onChange,
}: AnnouncementPriceInputProps) {
  const { i18n, t } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const locale = isEnglish ? 'en-US' : 'pt-BR';
  const symbol = isEnglish ? '$' : 'R$';

  const display =
    valueCents == null
      ? ''
      : new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(valueCents / 100);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    if (digits.length === 0) {
      onChange(null);
      return;
    }
    onChange(Number.parseInt(digits, 10));
  };

  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>{symbol}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={t('announcement_authoring.price.placeholder')}
        data-testid="price-input"
      />
    </InputGroup>
  );
}
