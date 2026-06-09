import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/panel/spectrum')({
  component: SpectrumPlaceholder,
});

function SpectrumPlaceholder() {
  const { t } = useTranslation('sidebar');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl">{t('spectrum.title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('spectrum.description')}
        </p>
      </div>
      <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-muted-foreground">
          {t('spectrum.under_construction')}
        </p>
      </div>
    </div>
  );
}
